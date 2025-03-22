import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as libre from 'libreoffice-convert';
import { execSync } from 'child_process';
import { promisify } from 'util';
import { ConvertToPdfDto, PdfQuality, PdfCompliance, FontEmbedding } from '../dto/convert-to-pdf.dto';
import { 
  checkConversionTools,
  getOptimalConversionSettings, 
  checkDocxCompatibility, 
  getLibreOfficeOptions, 
  enhancePdf, 
  estimateConversionTime 
} from '../utils/docx-to-pdf';

@Injectable()
export class DocxToPdfService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Basic DOCX to PDF conversion with simple configuration
   * @param filePath Path to the DOCX file
   * @returns Path to the converted PDF file
   */
  async convertDocxToPdfBasic(filePath: string): Promise<string> {
    try {
      console.log(`Starting basic DOCX to PDF conversion for: ${filePath}`);
      
      // Ensure the input file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(
          `Input file not found: ${filePath}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (ext !== '.docx' && ext !== '.doc') {
        throw new HttpException(
          `Input file must be a Word document (.docx or .doc), but got ${ext}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if LibreOffice is installed
      const tools = checkConversionTools();
      if (!tools.libreOffice && !tools.otherTools) {
        throw new HttpException(
          'LibreOffice or other conversion tools are required for DOCX to PDF conversion but are not installed on the server. Please install LibreOffice and try again.',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Generate output file path
      const outputPath = path.join(this.uploadsDir, `converted-${Date.now()}.pdf`);

      // Convert the DOCX to PDF using LibreOffice
      const libreConvert = promisify(libre.convert);
      const docxBuffer = fs.readFileSync(filePath);
      
      try {
        const pdfBuffer = await libreConvert(docxBuffer, '.pdf', undefined);
        fs.writeFileSync(outputPath, pdfBuffer);
        
        console.log(`DOCX successfully converted to PDF: ${outputPath}`);
        return outputPath;
      } catch (conversionError) {
        console.error('Error during LibreOffice conversion:', conversionError);
        
        // Try alternative conversion method using soffice command directly
        try {
          console.log('Attempting alternative conversion method...');
          const docxFilename = path.basename(filePath);
          const outputDir = this.uploadsDir;
          
          // Create a temporary directory for the conversion
          const tempDir = path.join(this.uploadsDir, `temp-conversion-${Date.now()}`);
          fs.mkdirSync(tempDir, { recursive: true });
          
          // Copy the DOCX file to the temp directory
          const tempDocxPath = path.join(tempDir, docxFilename);
          fs.copyFileSync(filePath, tempDocxPath);
          
          // Run LibreOffice directly
          execSync(`libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${tempDocxPath}"`, {
            timeout: 60000, // 1 minute timeout
          });
          
          // The output file will be named with the original file basename but with .pdf extension
          const pdfFilename = docxFilename.replace(/\.(docx|doc)$/i, '.pdf');
          const pdfPath = path.join(outputDir, pdfFilename);
          
          // Check if the file was successfully created
          if (fs.existsSync(pdfPath)) {
            console.log(`DOCX successfully converted to PDF with alternative method: ${pdfPath}`);
            
            // Clean up temp directory - handle recursively
            try {
              // For Node.js older versions that might not have rmSync
              if (typeof fs.rmSync === 'function') {
                fs.rmSync(tempDir, { recursive: true, force: true });
              } else {
                // Fallback for older Node.js versions
                const rimraf = require('rimraf');
                rimraf.sync(tempDir);
              }
            } catch (err) {
              console.error(`Error cleaning up temp directory: ${err.message}`);
              // Don't throw - this is non-critical
            }
            
            return pdfPath;
          } else {
            throw new Error('PDF file not created after conversion');
          }
        } catch (altError) {
          console.error('Error during alternative conversion:', altError);
          throw new HttpException(
            `DOCX to PDF conversion failed with all methods. Please ensure LibreOffice is installed on the server.`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
    } catch (error) {
      console.error('DOCX to PDF conversion error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert DOCX to PDF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Advanced DOCX to PDF conversion with detailed configuration options
   * @param filePath Path to the DOCX file
   * @param options Conversion options
   * @returns Path to the converted PDF file
   */
  async convertDocxToPdfAdvanced(filePath: string, options: ConvertToPdfDto = {}): Promise<string> {
    try {
      console.log(`Starting advanced DOCX to PDF conversion for: ${filePath}`);
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
      if (ext !== '.docx' && ext !== '.doc') {
        throw new HttpException(
          `Input file must be a Word document (.docx or .doc), but got ${ext}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check conversion compatibility
      const compatibility = await checkDocxCompatibility(filePath);
      if (!compatibility.isCompatible) {
        throw new HttpException(
          `File is not compatible for conversion: ${compatibility.error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if LibreOffice is installed
      const tools = checkConversionTools();
      if (!tools.libreOffice) {
        throw new HttpException(
          'LibreOffice is required for advanced DOCX to PDF conversion but is not installed on the server. Please install LibreOffice and try again.',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Set default options if not provided
      const {
        quality = PdfQuality.STANDARD,
        compliance = PdfCompliance.PDF_1_7,
        fontEmbedding = FontEmbedding.SUBSET,
        security = {},
        metadata = {},
        advanced = {}
      } = options;

      // Generate output file path
      const outputPath = path.join(this.uploadsDir, `converted-advanced-${Date.now()}.pdf`);
      
      try {
        // Get LibreOffice options based on quality and compliance
        const libreOfficeOptions = getLibreOfficeOptions(quality, compliance);
        
        // Create a temporary directory for the conversion
        const tempDir = path.join(this.uploadsDir, `temp-conversion-${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });
        
        // Copy the DOCX file to the temp directory
        const docxFilename = path.basename(filePath);
        const tempDocxPath = path.join(tempDir, docxFilename);
        fs.copyFileSync(filePath, tempDocxPath);
        
        // Execute LibreOffice with advanced options
        console.log(`Running LibreOffice with options: ${libreOfficeOptions}`);
        execSync(`libreoffice ${libreOfficeOptions} --outdir "${this.uploadsDir}" "${tempDocxPath}"`, {
          timeout: 120000, // 2 minute timeout
        });
        
        // The output file will be named with the original file basename but with .pdf extension
        const pdfFilename = docxFilename.replace(/\.(docx|doc)$/i, '.pdf');
        let pdfPath = path.join(this.uploadsDir, pdfFilename);
        
        // Check if the file was successfully created
        if (!fs.existsSync(pdfPath)) {
          throw new Error('PDF file not created after conversion');
        }
        
        // Clean up temp directory - handle recursively
        try {
          // For Node.js older versions that might not have rmSync
          if (typeof fs.rmSync === 'function') {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } else {
            // Fallback for older Node.js versions
            const rimraf = require('rimraf');
            rimraf.sync(tempDir);
          }
        } catch (err) {
          console.error(`Error cleaning up temp directory: ${err.message}`);
          // Don't throw - this is non-critical
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
        
        console.log(`DOCX successfully converted to PDF with advanced options: ${outputPath}`);
        return outputPath;
      } catch (conversionError) {
        console.error('Error during advanced conversion:', conversionError);
        throw new HttpException(
          `Advanced DOCX to PDF conversion failed: ${conversionError.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      console.error('DOCX to PDF advanced conversion error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert DOCX to PDF with advanced options: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Convert DOCX to PDF/A format (for archiving)
   * @param filePath Path to the DOCX file
   * @param pdfaVersion PDF/A version to use (1b, 2b, or 3b)
   * @returns Path to the converted PDF/A file
   */
  async convertDocxToPdfA(filePath: string, pdfaVersion: '1b' | '2b' | '3b' = '1b'): Promise<string> {
    try {
      console.log(`Starting DOCX to PDF/A-${pdfaVersion} conversion for: ${filePath}`);
      
      // Determine PDF/A compliance level based on version
      let compliance = PdfCompliance.PDF_A_1B;
      switch (pdfaVersion) {
        case '2b':
          compliance = PdfCompliance.PDF_A_2B;
          break;
        case '3b':
          compliance = PdfCompliance.PDF_A_3B;
          break;
        default:
          compliance = PdfCompliance.PDF_A_1B;
      }
      
      // Use the advanced conversion method with PDF/A settings
      const options: ConvertToPdfDto = {
        quality: PdfQuality.HIGH, // Higher quality for archiving
        compliance,
        fontEmbedding: FontEmbedding.FULL, // Full font embedding for archiving
        metadata: {
          includeCreationDate: true, // Include creation date for archiving
        },
        advanced: {
          preserveBookmarks: true,
          preserveHyperlinks: true,
          preserveFormFields: false, // Form fields can be problematic in PDF/A
        }
      };
      
      return await this.convertDocxToPdfAdvanced(filePath, options);
    } catch (error) {
      console.error('DOCX to PDF/A conversion error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert DOCX to PDF/A: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate a PDF preview from a DOCX file (optimized for web viewing)
   * @param filePath Path to the DOCX file
   * @returns Path to the generated preview PDF
   */
  async generateDocxPreview(filePath: string): Promise<string> {
    try {
      console.log(`Generating PDF preview for DOCX: ${filePath}`);
      
      // Use advanced conversion with web-optimized settings
      const options: ConvertToPdfDto = {
        quality: PdfQuality.STANDARD,
        fontEmbedding: FontEmbedding.SUBSET, // Subset fonts for smaller size
        advanced: {
          optimizeForWeb: true,
          imageQuality: 85, // Slightly reduced image quality for faster loading
          compressImages: true,
          downsampleDpi: 150, // Lower resolution for web preview
        }
      };
      
      return await this.convertDocxToPdfAdvanced(filePath, options);
    } catch (error) {
      console.error('DOCX preview generation error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to generate DOCX preview: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if a DOCX file can be converted to PDF and provide recommendations
   * @param filePath Path to the DOCX file
   * @returns Compatibility information and recommendations
   */
  async analyzeDocxConversion(filePath: string): Promise<any> {
    try {
      console.log(`Analyzing DOCX conversion compatibility for: ${filePath}`);
      
      // Basic file checks
      if (!fs.existsSync(filePath)) {
        return {
          isCompatible: false,
          error: 'File does not exist'
        };
      }
      
      const ext = path.extname(filePath).toLowerCase();
      if (ext !== '.docx' && ext !== '.doc') {
        return {
          isCompatible: false,
          error: 'File must be a Word document (.docx or .doc)'
        };
      }
      
      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      // Check conversion tools
      const tools = checkConversionTools();
      
      // Check compatibility
      const compatibility = await checkDocxCompatibility(filePath);
      
      // Estimate conversion time
      const estimatedTimeStandard = estimateConversionTime(filePath, PdfQuality.STANDARD);
      const estimatedTimeHigh = estimateConversionTime(filePath, PdfQuality.HIGH);
      
      // Generate recommendations
      const recommendedQuality = compatibility.recommendedQuality || PdfQuality.STANDARD;
      
      // Generate detailed report
      return {
        filename: path.basename(filePath),
        fileSize: `${fileSizeMB.toFixed(2)} MB`,
        fileFormat: ext.replace('.', '').toUpperCase(),
        conversionStatus: {
          isCompatible: compatibility.isCompatible,
          error: compatibility.error || null,
          warning: compatibility.warning || null,
        },
        availableTools: {
          libreOffice: tools.libreOffice,
          otherTools: tools.otherTools,
          canPerformBasicConversion: tools.libreOffice || tools.otherTools,
          canPerformAdvancedConversion: tools.libreOffice,
        },
        conversionEstimates: {
          standardQuality: `${estimatedTimeStandard} seconds`,
          highQuality: `${estimatedTimeHigh} seconds`,
        },
        recommendations: {
          recommendedQuality,
          recommendedCompliance: 
            (fileSizeMB > 20) ? PdfCompliance.PDF_1_7 : PdfCompliance.PDF_A_2B,
          fontEmbedding: 
            (fileSizeMB > 10) ? FontEmbedding.SUBSET : FontEmbedding.FULL,
        }
      };
    } catch (error) {
      console.error('Error analyzing DOCX conversion:', error);
      return {
        isCompatible: false,
        error: `Analysis failed: ${error.message}`
      };
    }
  }
}
