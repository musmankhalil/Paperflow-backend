import { Test, TestingModule } from '@nestjs/testing';
import { XlsxToPdfService, XlsxPrintOptions, XlsxPaperSize } from './xlsx-to-pdf.service';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { HttpException } from '@nestjs/common';

const exec = promisify(require('child_process').exec);

describe('XlsxToPdfService', () => {
  let service: XlsxToPdfService;
  const testFilesDir = path.join(process.cwd(), 'test/files');
  const uploadsDir = path.join(process.cwd(), 'uploads');

  beforeAll(async () => {
    // Ensure test directories exist
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create a simple test XLSX file if needed
    const testXlsxPath = path.join(testFilesDir, 'test.xlsx');
    if (!fs.existsSync(testXlsxPath)) {
      try {
        // Try to generate a test XLSX file using Node.js
        // This is just a placeholder - in a real test, you would provide a real XLSX file
        console.log('Creating test XLSX file...');
        // Attempt to use LibreOffice to create a simple XLSX if available
        await exec(`echo "Test,Data\n1,2" > ${path.join(testFilesDir, 'test.csv')}`);
        await exec(`libreoffice --headless --convert-to xlsx --outdir "${testFilesDir}" "${path.join(testFilesDir, 'test.csv')}"`)
          .catch(() => console.log('LibreOffice not available for test file creation'));
      } catch (error) {
        console.log('Failed to create test XLSX file:', error);
        console.log('Tests may fail if proper test files are not available');
      }
    }
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XlsxToPdfService],
    }).compile();

    service = module.get<XlsxToPdfService>(XlsxToPdfService);
  });

  afterAll(() => {
    // Optional: Clean up test files
    // In a real test environment, you might want to keep them for debugging
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkXlsxCompatibility', () => {
    it('should return compatibility information for a valid XLSX file', async () => {
      const testXlsxPath = path.join(testFilesDir, 'test.xlsx');
      
      // Skip test if file doesn't exist
      if (!fs.existsSync(testXlsxPath)) {
        console.log('Skipping test due to missing test file');
        return;
      }

      const result = await service.checkXlsxCompatibility(testXlsxPath);
      expect(result.isCompatible).toBeDefined();
    });

    it('should return error for non-existent file', async () => {
      const nonExistentPath = path.join(testFilesDir, 'non-existent.xlsx');
      const result = await service.checkXlsxCompatibility(nonExistentPath);
      expect(result.isCompatible).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('analyzeXlsxForPdfConversion', () => {
    it('should analyze an XLSX file and return recommendations', async () => {
      const testXlsxPath = path.join(testFilesDir, 'test.xlsx');
      
      // Skip test if file doesn't exist
      if (!fs.existsSync(testXlsxPath)) {
        console.log('Skipping test due to missing test file');
        return;
      }

      try {
        const result = await service.analyzeXlsxForPdfConversion(testXlsxPath);
        expect(result.filename).toBeDefined();
        expect(result.fileSize).toBeDefined();
        expect(result.recommendations).toBeDefined();
      } catch (error) {
        // If the test environment doesn't have the required tools, the test may fail
        // This is expected in some environments
        if (error instanceof HttpException) {
          console.log('Test skipped due to missing conversion tools:', error.message);
        } else {
          throw error;
        }
      }
    });
  });

  // Basic and advanced conversion tests would normally be added here
  // but they require LibreOffice or other conversion tools to be installed,
  // which may not be available in all test environments.
  // For a real test suite, you would use mock implementations or
  // conditionally run tests based on tool availability.

  describe('checkXlsxToPdfTools', () => {
    it('should return information about available conversion tools', async () => {
      const result = await service.checkXlsxToPdfTools();
      expect(result).toBeDefined();
      // Tool availability will vary by environment, so we just check that the info exists
      expect(result.recommendedMethod).toBeDefined();
    });
  });
});
