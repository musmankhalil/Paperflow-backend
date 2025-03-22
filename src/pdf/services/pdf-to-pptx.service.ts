import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ConvertToPptxDto, SlideQuality, TextExtractionMode, ImageHandling } from '../dto/convert-to-pptx.dto';

@Injectable()
export class PdfToPptxService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Check if LibreOffice is installed
   * @returns boolean indicating if LibreOffice is installed
   */
  private isLibreOfficeInstalled(): boolean {
    try {
      execSync('libreoffice --version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up a directory
   * @param dirPath Path to the directory to clean up
   */
  private cleanupDirectory(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath)) {
        if (typeof fs.rmSync === 'function') {
          fs.rmSync(dirPath, { recursive: true, force: true });
        } else {
          // Fallback for older Node.js versions
          const rimraf = require('rimraf');
          rimraf.sync(dirPath);
        }
      }
    } catch (error) {
      console.error(`Failed to clean up directory ${dirPath}:`, error);
    }
  }

  /**
   * Basic PDF to PowerPoint conversion
   * @param filePath Path to the PDF file
   * @returns Path to the converted PowerPoint file
   */
  async convertPdfToPptxBasic(filePath: string): Promise<string> {
    try {
      console.log(`Starting basic PDF to PowerPoint conversion for: ${filePath}`);
      
      // Ensure the input file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(
          `Input file not found: ${filePath}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if LibreOffice is installed
      const hasLibreOffice = this.isLibreOfficeInstalled();
      if (!hasLibreOffice) {
        throw new HttpException(
          'LibreOffice is required for PDF to PowerPoint conversion but is not installed on the server. Please install LibreOffice and try again.',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Generate output file path
      const outputPath = path.join(this.uploadsDir, `converted-${Date.now()}.pptx`);

      try {
        // Convert the PDF to PPTX using LibreOffice
        // First, create a temporary directory for processing
        const tempDir = path.join(this.uploadsDir, `temp-conversion-${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });
        
        // Copy the PDF to the temp directory
        const pdfFilename = path.basename(filePath);
        const tempPdfPath = path.join(tempDir, pdfFilename);
        fs.copyFileSync(filePath, tempPdfPath);
        
        // Run LibreOffice headless to convert to PPTX
        // Using direct command execution, as libreoffice-convert module doesn't handle PDF to PPTX well
        execSync(`libreoffice --headless --convert-to pptx --outdir "${this.uploadsDir}" "${tempPdfPath}"`, {
          timeout: 60000, // 1 minute timeout
        });
        
        // The output file will be named with the original file basename but with .pptx extension
        const pptxFilename = pdfFilename.replace(/\.pdf$/i, '.pptx');
        const pptxPath = path.join(this.uploadsDir, pptxFilename);
        
        // Check if the file was successfully created
        if (!fs.existsSync(pptxPath)) {
          throw new Error('PowerPoint file not created after conversion');
        }
        
        // If successful and the output path is different from the target path, rename it
        if (pptxPath !== outputPath) {
          fs.renameSync(pptxPath, outputPath);
        }
        
        // Clean up temp directory
        this.cleanupDirectory(tempDir);
        
        console.log(`PDF successfully converted to PowerPoint: ${outputPath}`);
        return outputPath;
      } catch (conversionError) {
        console.error('Error during LibreOffice conversion:', conversionError);
        throw new HttpException(
          `PDF to PowerPoint conversion failed: ${conversionError.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      console.error('PDF to PowerPoint conversion error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert PDF to PowerPoint: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Advanced PDF to PowerPoint conversion with detailed configuration options
   * @param filePath Path to the PDF file
   * @param options Conversion options
   * @returns Path to the converted PowerPoint file
   */
  async convertPdfToPptxAdvanced(filePath: string, options: ConvertToPptxDto = {}): Promise<string> {
    try {
      console.log(`Starting advanced PDF to PowerPoint conversion for: ${filePath}`);
      console.log(`Conversion options:`, JSON.stringify(options, null, 2));
      
      // Ensure the input file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(
          `Input file not found: ${filePath}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if LibreOffice is installed
      const hasLibreOffice = this.isLibreOfficeInstalled();
      if (!hasLibreOffice) {
        throw new HttpException(
          'LibreOffice is required for PDF to PowerPoint conversion but is not installed on the server. Please install LibreOffice and try again.',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Set default options if not provided
      const {
        quality = SlideQuality.STANDARD,
        textMode = TextExtractionMode.SMART,
        imageHandling = ImageHandling.INCLUDE_HIGH_RES,
        theme = {},
        slideOptions = {},
        advanced = {},
        pageSelection = [],
        metadata = {},
      } = options;

      // Generate output file path
      const outputPath = path.join(this.uploadsDir, `converted-advanced-${Date.now()}.pptx`);
      
      try {
        // Create a temporary working directory
        const tempDir = path.join(this.uploadsDir, `temp-conversion-${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });
        
        // Handle page selection if specified
        let sourceFilePath = filePath;
        
        // Copy the PDF to the temp directory
        const pdfFilename = path.basename(sourceFilePath);
        const tempPdfPath = path.join(tempDir, pdfFilename);
        fs.copyFileSync(sourceFilePath, tempPdfPath);
        
        // Build the LibreOffice command with quality settings
        let libreOfficeOptions = '--headless';
        
        switch (quality) {
          case SlideQuality.HIGH:
            libreOfficeOptions += ' --convert-to pptx:"Impress MS PowerPoint 2007 XML" --norestore';
            break;
          case SlideQuality.PREMIUM:
            libreOfficeOptions += ' --convert-to pptx:"Impress MS PowerPoint 2007 XML" --norestore';
            break;
          default:
            libreOfficeOptions += ' --convert-to pptx';
        }
        
        // Execute LibreOffice with the options
        console.log(`Running LibreOffice with options: ${libreOfficeOptions}`);
        execSync(`libreoffice ${libreOfficeOptions} --outdir "${this.uploadsDir}" "${tempPdfPath}"`, {
          timeout: 120000, // 2 minute timeout
        });
        
        // The output file will be named with the original file basename but with .pptx extension
        const pptxFilename = pdfFilename.replace(/\.pdf$/i, '.pptx');
        const pptxPath = path.join(this.uploadsDir, pptxFilename);
        
        // Check if the file was successfully created
        if (!fs.existsSync(pptxPath)) {
          throw new Error('PowerPoint file not created after conversion');
        }
        
        // Apply any additional post-processing based on advanced options
        // This is a placeholder for potential post-processing
        // In a real implementation, you'd have specific logic for themes, metadata, etc.
        console.log('Advanced options specified, but post-processing for PPTX is not fully implemented');
        
        // If successful and the output path is different from the target path, rename it
        if (pptxPath !== outputPath) {
          fs.renameSync(pptxPath, outputPath);
        }
        
        // Clean up temp directory and intermediate files
        this.cleanupDirectory(tempDir);
        if (sourceFilePath !== filePath && fs.existsSync(sourceFilePath)) {
          fs.unlinkSync(sourceFilePath);
        }
        
        console.log(`PDF successfully converted to PowerPoint with advanced options: ${outputPath}`);
        return outputPath;
      } catch (conversionError) {
        console.error('Error during advanced conversion:', conversionError);
        throw new HttpException(
          `Advanced PDF to PowerPoint conversion failed: ${conversionError.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      console.error('PDF to PowerPoint advanced conversion error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert PDF to PowerPoint with advanced options: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a custom presentation from PDF with detailed options
   * @param filePath Path to the PDF file
   * @param options Custom presentation options
   * @returns Path to the created PowerPoint presentation file
   */
  async createCustomPresentation(filePath: string, options: any = {}): Promise<string> {
    try {
      console.log(`Creating custom presentation from PDF: ${filePath}`);
      console.log(`Presentation options:`, JSON.stringify(options, null, 2));
      
      // This is essentially a more advanced version of convertPdfToPptxAdvanced
      // with additional customization options
      
      // In a production environment, this would implement additional customization
      // For now, we'll use the advanced conversion with any provided options
      return this.convertPdfToPptxAdvanced(filePath, options);
    } catch (error) {
      console.error('Error creating custom presentation:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to create custom presentation: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
