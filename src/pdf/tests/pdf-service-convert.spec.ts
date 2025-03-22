import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from '../pdf.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConvertToWordDto, ConversionQuality, FontHandling } from '../dto/convert-to-word.dto';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('path');
jest.mock('pdf2docx', () => ({
  createDocx: jest.fn().mockResolvedValue(true),
}));

// Mock our utility functions
jest.mock('../utils/pdf-to-word', () => ({
  getOptimalConversionSettings: jest.fn().mockReturnValue({
    useThreads: true,
    maxDetectionEffort: 'normal',
  }),
  checkConversionCompatibility: jest.fn().mockResolvedValue({
    isCompatible: true,
    isEncrypted: false,
    hasPassword: false,
  }),
  postProcessWordDocument: jest.fn().mockResolvedValue(true),
  estimateConversionTime: jest.fn().mockReturnValue(30),
}));

describe('PdfService - PDF to Word Conversion', () => {
  let service: PdfService;
  const testFilePath = '/path/to/test.pdf';
  const uploadsDir = '/uploads';

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock existsSync to return true for our test file
    (fs.existsSync as jest.Mock).mockImplementation((path) => {
      return path === testFilePath || path === uploadsDir;
    });

    // Mock statSync for file size
    (fs.statSync as jest.Mock).mockReturnValue({
      size: 1024 * 1024, // 1MB
    });

    // Mock path.join to return predictable paths
    (path.join as jest.Mock).mockImplementation((...args) => {
      return args.join('/');
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService],
    }).compile();

    service = module.get<PdfService>(PdfService);
    // Override the uploads directory path for testing
    service['uploadsDir'] = uploadsDir;
  });

  describe('convertPdfToWordBasic', () => {
    it('should convert PDF to Word with basic settings', async () => {
      const result = await service.convertPdfToWordBasic(testFilePath);
      
      // Should use createDocx with the correct paths
      expect(require('pdf2docx').createDocx).toHaveBeenCalledWith(
        testFilePath,
        expect.stringContaining('converted-')
      );
      
      // Should check compatibility
      expect(require('../utils/pdf-to-word').checkConversionCompatibility).toHaveBeenCalledWith(testFilePath);
      
      // Should post-process the document
      expect(require('../utils/pdf-to-word').postProcessWordDocument).toHaveBeenCalled();
      
      // Should return the output path
      expect(result).toContain('converted-');
    });

    it('should throw an error if the input file does not exist', async () => {
      const nonExistentPath = '/path/to/nonexistent.pdf';
      
      await expect(service.convertPdfToWordBasic(nonExistentPath)).rejects.toThrow(HttpException);
    });
    
    it('should throw an error if the PDF is not compatible with conversion', async () => {
      // Mock incompatible file (encrypted)
      require('../utils/pdf-to-word').checkConversionCompatibility.mockResolvedValueOnce({
        isCompatible: false,
        isEncrypted: true,
        hasPassword: false,
      });
      
      await expect(service.convertPdfToWordBasic(testFilePath)).rejects.toThrow(HttpException);
    });
  });

  describe('convertPdfToWordAdvanced', () => {
    it('should convert PDF to Word with advanced settings', async () => {
      const options: ConvertToWordDto = {
        quality: ConversionQuality.ENHANCED,
        fontHandling: FontHandling.EMBED,
        formatting: {
          preserveImages: true,
          preserveLinks: true,
          defaultFontFamily: 'Arial',
        },
        advanced: {
          detectLists: true,
          optimizeForAccessibility: true,
        },
      };
      
      const result = await service.convertPdfToWordAdvanced(testFilePath, options);
      
      // Should use createDocx with the correct paths and options
      expect(require('pdf2docx').createDocx).toHaveBeenCalledWith(
        testFilePath,
        expect.stringContaining('converted-advanced-'),
        expect.objectContaining({
          // Should include settings from getOptimalConversionSettings
          useThreads: true,
          maxDetectionEffort: expect.any(String),
          // Should include quality-specific settings
          enhancedTextLayoutDetection: true,
          // Should include formatting settings
          preserveImages: true,
          preserveHyperlinks: true,
          // Should include font settings
          fontEmbedding: 'embed',
          defaultFontFamily: 'Arial',
          // Should include advanced settings
          detectLists: true,
          accessibilityMode: true,
        })
      );
      
      // Should return the output path
      expect(result).toContain('converted-advanced-');
    });
    
    it('should apply the correct settings based on quality selection', async () => {
      // Test with BASIC quality
      await service.convertPdfToWordAdvanced(testFilePath, { quality: ConversionQuality.BASIC });
      
      expect(require('pdf2docx').createDocx).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          preserveImages: false,
          preserveHyperlinks: false,
          preserveTables: false,
          detectLists: false,
          detectHeadings: false,
          detectTables: false,
          preserveColorProfile: false,
        })
      );
      
      // Reset mock and test with PRECISE quality
      jest.clearAllMocks();
      await service.convertPdfToWordAdvanced(testFilePath, { quality: ConversionQuality.PRECISE });
      
      expect(require('pdf2docx').createDocx).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          enhancedTextLayoutDetection: true,
          maxDetectionEffort: 'maximum',
          preserveFormattingMarks: true,
          textProcessingMode: 'precise',
        })
      );
    });
  });
});
