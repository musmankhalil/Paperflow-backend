import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from '../pdf.service';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException } from '@nestjs/common';
import { SplitMode } from '../dto/split-options.dto';

// Mock the fs and path modules
jest.mock('fs');
jest.mock('path');
jest.mock('pdf-lib');

describe('PdfService - Split PDF', () => {
  let service: PdfService;

  // Sample data for tests
  const mockFilePath = '/path/to/test.pdf';
  const mockOutputDir = '/path/to/uploads';
  const mockPdfBytes = Buffer.from('mock pdf content');
  const mockPageCount = 10;

  beforeEach(async () => {
    // Create a testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService],
    }).compile();

    service = module.get<PdfService>(PdfService);

    // Mock implementation for required functions
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(mockPdfBytes);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    jest.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));

    // Mock the private uploadsDir property
    Object.defineProperty(service, 'uploadsDir', {
      value: mockOutputDir,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should split a PDF into individual pages', async () => {
    // Mock PDFDocument implementation
    const mockPdfDoc = {
      getPageCount: jest.fn().mockReturnValue(mockPageCount),
      copyPages: jest.fn().mockResolvedValue([{ id: 'page1' }]),
    };

    const mockNewPdf = {
      addPage: jest.fn(),
      save: jest.fn().mockResolvedValue(Buffer.from('new pdf content')),
    };

    require('pdf-lib').PDFDocument.load = jest.fn().mockResolvedValue(mockPdfDoc);
    require('pdf-lib').PDFDocument.create = jest.fn().mockResolvedValue(mockNewPdf);

    // Run the function
    const result = await service.splitPdf(mockFilePath);

    // Assertions
    expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath);
    expect(require('pdf-lib').PDFDocument.load).toHaveBeenCalledWith(mockPdfBytes);
    expect(mockPdfDoc.getPageCount).toHaveBeenCalled();
    expect(require('pdf-lib').PDFDocument.create).toHaveBeenCalledTimes(mockPageCount);
    expect(mockPdfDoc.copyPages).toHaveBeenCalledTimes(mockPageCount);
    expect(mockNewPdf.addPage).toHaveBeenCalledTimes(mockPageCount);
    expect(mockNewPdf.save).toHaveBeenCalledTimes(mockPageCount);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(mockPageCount);
    expect(result.length).toBe(mockPageCount);
  });

  it('should handle errors when splitting a PDF', async () => {
    // Mock PDFDocument to throw an error
    require('pdf-lib').PDFDocument.load = jest.fn().mockRejectedValue(new Error('Test error'));

    // Run the function and expect it to throw
    await expect(service.splitPdf(mockFilePath)).rejects.toThrow(HttpException);
  });

  it('should split a PDF with advanced options - pages mode', async () => {
    // Mock PDFDocument implementation
    const mockPdfDoc = {
      getPageCount: jest.fn().mockReturnValue(mockPageCount),
      copyPages: jest.fn().mockResolvedValue([{ id: 'page1' }]),
    };

    const mockNewPdf = {
      addPage: jest.fn(),
      save: jest.fn().mockResolvedValue(Buffer.from('new pdf content')),
    };

    require('pdf-lib').PDFDocument.load = jest.fn().mockResolvedValue(mockPdfDoc);
    require('pdf-lib').PDFDocument.create = jest.fn().mockResolvedValue(mockNewPdf);

    // Options for splitting at specific pages
    const options = {
      mode: SplitMode.PAGES,
      pages: [3, 6, 9],
      filenamePrefix: 'test',
    };

    // Run the function
    const result = await service.splitPdfAdvanced(mockFilePath, options);

    // Assertions
    expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath);
    expect(require('pdf-lib').PDFDocument.load).toHaveBeenCalledWith(mockPdfBytes);
    expect(mockPdfDoc.getPageCount).toHaveBeenCalled();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should split a PDF with advanced options - ranges mode', async () => {
    // Mock PDFDocument implementation
    const mockPdfDoc = {
      getPageCount: jest.fn().mockReturnValue(mockPageCount),
      copyPages: jest.fn().mockResolvedValue([{ id: 'page1' }, { id: 'page2' }]),
    };

    const mockNewPdf = {
      addPage: jest.fn(),
      save: jest.fn().mockResolvedValue(Buffer.from('new pdf content')),
    };

    require('pdf-lib').PDFDocument.load = jest.fn().mockResolvedValue(mockPdfDoc);
    require('pdf-lib').PDFDocument.create = jest.fn().mockResolvedValue(mockNewPdf);

    // Options for splitting by page ranges
    const options = {
      mode: SplitMode.RANGES,
      ranges: [
        { start: 1, end: 3 },
        { start: 4, end: 6 },
        { start: 7, end: 10 },
      ],
    };

    // Run the function
    const result = await service.splitPdfAdvanced(mockFilePath, options);

    // Assertions
    expect(require('pdf-lib').PDFDocument.create).toHaveBeenCalledTimes(3);
    expect(result.length).toBe(3);
  });

  it('should split a PDF with advanced options - everyNPages mode', async () => {
    // Mock PDFDocument implementation
    const mockPdfDoc = {
      getPageCount: jest.fn().mockReturnValue(mockPageCount),
      copyPages: jest.fn().mockResolvedValue([{ id: 'page1' }, { id: 'page2' }]),
    };

    const mockNewPdf = {
      addPage: jest.fn(),
      save: jest.fn().mockResolvedValue(Buffer.from('new pdf content')),
    };

    require('pdf-lib').PDFDocument.load = jest.fn().mockResolvedValue(mockPdfDoc);
    require('pdf-lib').PDFDocument.create = jest.fn().mockResolvedValue(mockNewPdf);

    // Options for splitting every N pages
    const options = {
      mode: SplitMode.EVERY_N_PAGES,
      everyNPages: 3,
    };

    // Run the function
    const result = await service.splitPdfAdvanced(mockFilePath, options);

    // Assertions - expect 4 documents for 10 pages split every 3 pages
    expect(require('pdf-lib').PDFDocument.create).toHaveBeenCalledTimes(4);
    expect(result.length).toBe(4);
  });
});
