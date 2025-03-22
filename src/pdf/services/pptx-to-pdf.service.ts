import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as libre from 'libreoffice-convert';
import { execSync } from 'child_process';
import { promisify } from 'util';
import { ConvertPptxToPdfDto, PptxPdfQuality, PptxPdfCompliance, PptxImageHandling } from '../dto/convert-pptx-to-pdf.dto';
import { 
  checkPptxCompatibility, 
  getLibreOfficeOptions, 
  enhancePdf, 
  estimateConversionTime, 
  convertWithLibreOffice,
  extractSlides
} from '../utils/pptx-to-pdf';

@Injectable()
export class PptxToPdfService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Basic PPTX to PDF conversion with simple configuration
   * @param filePath Path to the PPTX file
   * @returns Path to the converted PDF file
   */
  async convertPptxToPdfBasic(filePath: string): Promise<string> {
    try {
      console.log(`Starting basic PPTX to PDF conversion for: ${filePath}`);
      
      // Ensure the input file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(
          `Input file not found: ${filePath}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (ext !== '.pptx' && ext !== '.ppt') {
        throw new HttpException(
          `Input file must be a PowerPoint presentation (.pptx or .ppt), but got ${ext}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Generate output file path
      const outputPath = path.join(this.uploadsDir, `converted-${Date.now()}.pdf`);

      // Convert the PPTX to PDF using LibreOffice
      try {
        // Try direct LibreOffice conversion first
        await convertWithLibreOffice(filePath, outputPath, '--headless --convert-to pdf');
        
        console.log(`PPTX successfully converted to PDF: ${outputPath}`);
        return outputPath;
      } catch (conversionError) {
        console.error('Error during LibreOffice direct conversion:', conversionError);
        
        // Try alternative conversion method using libreoffice-convert package
        try {
          console.log('Attempting conversion with libreoffice-convert package...');
          const libreConvert = promisify(libre.convert);
          const pptxBuffer = fs.readFileSync(filePath);
          
          const pdfBuffer = await libreConvert(pptxBuffer, '.pdf', undefined);
          fs.writeFileSync(outputPath, pdfBuffer);
          
          console.log(`PPTX successfully converted to PDF with alternative method: ${outputPath}`);
          return outputPath;
        } catch (altError) {
          console.error('Error during alternative conversion:', altError);
          
          // Try one more method using command line directly
          try {
            console.log('Attempting conversion with direct command line...');
            
            // Create a temporary directory for the conversion
            const tempDir = path.join(this.uploadsDir, `temp-conversion-${Date.now()}`);
            fs.mkdirSync(tempDir, { recursive: true });
            
            // Copy the PPTX file to the temp directory
            const pptxFilename = path.basename(filePath);
            const tempPptxPath = path.join(tempDir, pptxFilename);
            fs.copyFileSync(filePath, tempPptxPath);
            
            // Run LibreOffice directly
            execSync(`libreoffice --headless --convert-to pdf --outdir "${this.uploadsDir}" "${tempPptxPath}"`, {
              timeout: 60000, // 1 minute timeout
            });
            
            // The output file will be named with the original file basename but with .pdf extension
            const pdfFilename = pptxFilename.replace(/\.(pptx|ppt)$/i, '.pdf');
            const pdfPath = path.join(this.uploadsDir, pdfFilename);
            
            // Check if the file was successfully created
            if (fs.existsSync(pdfPath)) {
              console.log(`PPTX successfully converted to PDF with command line: ${pdfPath}`);
              
              // Copy to the expected output path if different
              if (pdfPath !== outputPath) {
                fs.copyFileSync(pdfPath, outputPath);
                fs.unlinkSync(pdfPath);
              }
              
              // Clean up temp directory
              this.cleanupDirectory(tempDir);
              
              return outputPath;
            } else {
              throw new Error('PDF file not created after conversion');
            }
          } catch (cmdError) {
            console.error('Error during command line conversion:', cmdError);
            throw new HttpException(
              `PPTX to PDF conversion failed with all methods. Please ensure LibreOffice is installed on the server.`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        }
      }
    } catch (error) {
      console.error('PPTX to PDF conversion error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert PPTX to PDF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Advanced PPTX to PDF conversion with detailed configuration options
   * @param filePath Path to the PPTX file
   * @param options Conversion options
   * @returns Path to the converted PDF file
   */
  async convertPptxToPdfAdvanced(filePath: string, options: ConvertPptxToPdfDto = {}): Promise<string> {
    try {
      console.log(`Starting advanced PPTX to PDF conversion for: ${filePath}`);
      console.log(`Conversion options:`, JSON.stringify(options, null, 2));
      
      // Ensure the input file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(
          `Input file not found: ${filePath}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (ext !== '.pptx' && ext !== '.ppt') {
        throw new HttpException(
          `Input file must be a PowerPoint presentation (.pptx or .ppt), but got ${ext}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check conversion compatibility
      const compatibility = await checkPptxCompatibility(filePath);
      if (!compatibility.isCompatible) {
        throw new HttpException(
          `File is not compatible for conversion: ${compatibility.error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Set default options if not provided
      const {
        quality = PptxPdfQuality.STANDARD,
        compliance = PptxPdfCompliance.PDF_1_7,
        imageHandling = PptxImageHandling.OPTIMIZE,
        slideOptions = {},
        security = {},
        metadata = {},
        advanced = {}
      } = options;

      // Generate output file path
      const outputPath = path.join(this.uploadsDir, `converted-advanced-${Date.now()}.pdf`);
      
      try {
        // Process slide selection if specified
        let sourceFilePath = filePath;
        
        if (options.slideSelection && options.slideSelection.length > 0) {
          console.log(`Processing selected slides: ${options.slideSelection.join(', ')}`);
          sourceFilePath = await extractSlides(filePath, options.slideSelection, this.uploadsDir);
        }
        
        // Get LibreOffice options based on quality and compliance
        const libreOfficeOptions = getLibreOfficeOptions(quality, compliance);
        
        // Create a temporary directory for the conversion
        const tempDir = path.join(this.uploadsDir, `temp-conversion-${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });
        
        // Copy the PPTX file to the temp directory
        const pptxFilename = path.basename(sourceFilePath);
        const tempPptxPath = path.join(tempDir, pptxFilename);
        fs.copyFileSync(sourceFilePath, tempPptxPath);
        
        // Execute LibreOffice with advanced options
        console.log(`Running LibreOffice with options: ${libreOfficeOptions}`);
        execSync(`libreoffice ${libreOfficeOptions} --outdir "${this.uploadsDir}" "${tempPptxPath}"`, {
          timeout: 120000, // 2 minute timeout
        });
        
        // The output file will be named with the original file basename but with .pdf extension
        const pdfFilename = pptxFilename.replace(/\.(pptx|ppt)$/i, '.pdf');
        let pdfPath = path.join(this.uploadsDir, pdfFilename);
        
        // Check if the file was successfully created
        if (!fs.existsSync(pdfPath)) {
          throw new Error('PDF file not created after conversion');
        }
        
        // Clean up temp directory and temporary source file
        this.cleanupDirectory(tempDir);
        if (sourceFilePath !== filePath && fs.existsSync(sourceFilePath)) {
          fs.unlinkSync(sourceFilePath);
        }
        
        // Apply additional enhancements if requested
        if (security.encrypt || Object.keys(metadata).length > 0 || Object.keys(advanced).length > 0) {
          console.log('Applying advanced PDF enhancements...');
          pdfPath = await enhancePdf(pdfPath, options);
        }
        
        // Copy enhanced file to output path if different
        if (pdfPath !== outputPath) {
          fs.copyFileSync(pdfPath, outputPath);
          
          // Clean up intermediate file if it was enhanced
          if (pdfPath.includes('-enhanced')) {
            fs.unlinkSync(pdfPath);
          }
        }
        
        console.log(`PPTX successfully converted to PDF with advanced options: ${outputPath}`);
        return outputPath;
      } catch (conversionError) {
        console.error('Error during advanced conversion:', conversionError);
        throw new HttpException(
          `Advanced PPTX to PDF conversion failed: ${conversionError.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      console.error('PPTX to PDF advanced conversion error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert PPTX to PDF with advanced options: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
}
