import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as libre from 'libreoffice-convert';
import { promisify } from 'util';
import { ConvertToWordDto, ConversionQuality, FontHandling } from '../dto/convert-to-word.dto';
import { isLibreOfficeInstalled, isGhostscriptInstalled, convertPdfToDocxViaGhostscript } from '../utils/pdf-to-word';

@Injectable()
export class PdfToWordService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Basic PDF to Word conversion with simple configuration
   * @param filePath Path to the PDF file
   * @returns Path to the converted Word document (.docx)
   */
  async convertPdfToWordBasic(filePath: string): Promise<string> {
    try {
      console.log(`Starting basic PDF to Word conversion for: ${filePath}`);
      
      // Ensure the input file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(
          `Input file not found: ${filePath}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if Ghostscript or LibreOffice is installed
      const hasGhostscript = isGhostscriptInstalled();
      const hasLibreOffice = isLibreOfficeInstalled();
      
      if (!hasGhostscript && !hasLibreOffice) {
        throw new HttpException(
          'Either Ghostscript or LibreOffice is required for PDF to Word conversion but neither is installed on the server.',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Generate output file path
      const outputPath = path.join(this.uploadsDir, `converted-${Date.now()}.docx`);

      // Try Ghostscript conversion first if available
      if (hasGhostscript) {
        try {
          console.log('Attempting PDF to DOCX conversion using Ghostscript...');
          await convertPdfToDocxViaGhostscript(filePath, outputPath);
          console.log(`PDF successfully converted to Word document using Ghostscript: ${outputPath}`);
          return outputPath;
        } catch (ghostscriptError) {
          console.error('Error during Ghostscript conversion:', ghostscriptError);
          // If Ghostscript fails and LibreOffice is not available, throw error
          if (!hasLibreOffice) {
            throw new HttpException(
              `PDF to Word conversion failed with Ghostscript. Error: ${ghostscriptError.message}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
          // If LibreOffice is available, continue to try that method
          console.log('Fallback to LibreOffice conversion...');
        }
      }
      
      // Try LibreOffice if Ghostscript is not available or failed
      if (hasLibreOffice) {
        const libreConvert = promisify(libre.convert);
        const pdfBuffer = fs.readFileSync(filePath);
        
        try {
          const docxBuffer = await libreConvert(pdfBuffer, '.docx', undefined);
          fs.writeFileSync(outputPath, docxBuffer);
          
          console.log(`PDF successfully converted to Word document using LibreOffice: ${outputPath}`);
          return outputPath;
        } catch (conversionError) {
          console.error('Error during LibreOffice conversion:', conversionError);
          
          // Try alternative conversion if LibreOffice fails
          try {
            console.log('Attempting alternative conversion method...');
            const docxPdf = require('docx-pdf');
            const convertPromise = promisify(docxPdf.pdf2docx);
            await convertPromise(filePath, outputPath);
            
            console.log(`PDF successfully converted to Word document with alternative method: ${outputPath}`);
            return outputPath;
          } catch (altError) {
            console.error('Error during alternative conversion:', altError);
            throw new HttpException(
              `PDF to Word conversion failed with all methods.`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        }
      }
      
      // If we get here, something unexpected went wrong
      throw new HttpException(
        'PDF to Word conversion failed: No conversion method succeeded.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } catch (error) {
      console.error('PDF to Word conversion error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert PDF to Word: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Advanced PDF to Word conversion with detailed configuration options
   * @param filePath Path to the PDF file
   * @param options Conversion options
   * @returns Path to the converted Word document (.docx)
   */
  async convertPdfToWordAdvanced(filePath: string, options: ConvertToWordDto = {}): Promise<string> {
    try {
      console.log(`Starting advanced PDF to Word conversion for: ${filePath}`);
      console.log(`Conversion options:`, JSON.stringify(options, null, 2));
      
      // Ensure the input file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(
          `Input file not found: ${filePath}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if Ghostscript or LibreOffice is installed
      const hasGhostscript = isGhostscriptInstalled();
      const hasLibreOffice = isLibreOfficeInstalled();
      
      if (!hasGhostscript && !hasLibreOffice) {
        throw new HttpException(
          'Either Ghostscript or LibreOffice is required for PDF to Word conversion but neither is installed on the server.',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Generate output file path
      const outputPath = path.join(this.uploadsDir, `converted-advanced-${Date.now()}.docx`);
      
      // Set default options if not provided
      const {
        quality = ConversionQuality.STANDARD,
        fontHandling = FontHandling.SUBSTITUTE,
        formatting = {},
        advanced = {}
      } = options;
      
      // Determine if we need more precise conversion based on options
      const needsPreciseConversion = 
        quality === ConversionQuality.ENHANCED || 
        quality === ConversionQuality.PRECISE ||
        advanced?.optimizeForAccessibility === true;
      
      // Try using Ghostscript for simpler conversions, or if LibreOffice isn't available
      if (hasGhostscript && (!needsPreciseConversion || !hasLibreOffice)) {
        try {
          console.log('Using Ghostscript for PDF to DOCX conversion...');
          
          // Pass relevant options to Ghostscript conversion
          const ghostscriptOptions = {
            quality,
            preserveImages: formatting?.preserveImages,
            preserveTables: formatting?.preserveTables,
          };
          
          await convertPdfToDocxViaGhostscript(filePath, outputPath, ghostscriptOptions);
          
          // Apply post-processing if needed
          if (needsPreciseConversion) {
            console.log('Applying post-processing with advanced options...');
            await this.applyAdvancedDocxFormatting(outputPath, options);
          }
          
          console.log(`PDF successfully converted to Word document using Ghostscript: ${outputPath}`);
          return outputPath;
        } catch (ghostscriptError) {
          console.error('Error during Ghostscript conversion:', ghostscriptError);
          
          // If LibreOffice is not available, throw error
          if (!hasLibreOffice) {
            throw new HttpException(
              `Advanced PDF to Word conversion failed with Ghostscript. Error: ${ghostscriptError.message}`,
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          }
          // Otherwise try LibreOffice
        }
      }
      
      // Use LibreOffice for enhanced or precise conversion
      if (hasLibreOffice) {
        try {
          console.log('Using LibreOffice for PDF to DOCX conversion...');
          
          const libreConvert = promisify(libre.convert);
          const pdfBuffer = fs.readFileSync(filePath);
          
          // Configure LibreOffice options for conversion
          const outputFormat = '.docx';
          
          const docxBuffer = await libreConvert(pdfBuffer, outputFormat, undefined);
          fs.writeFileSync(outputPath, docxBuffer);
          
          // Apply post-processing based on advanced options
          if (advanced?.optimizeForAccessibility || 
              formatting?.defaultFontFamily || 
              quality === ConversionQuality.ENHANCED || 
              quality === ConversionQuality.PRECISE) {
            
            console.log('Applying post-processing with advanced options...');
            await this.applyAdvancedDocxFormatting(outputPath, options);
          }
          
          console.log(`PDF successfully converted to Word document with LibreOffice: ${outputPath}`);
          return outputPath;
        } catch (conversionError) {
          console.error('Error during LibreOffice conversion:', conversionError);
          throw new HttpException(
            `Advanced PDF to Word conversion failed with all methods. Error: ${conversionError.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
      
      // If we get here without returning, both methods failed
      throw new HttpException(
        'PDF to Word conversion failed: No conversion method succeeded.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } catch (error) {
      console.error('PDF to Word advanced conversion error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert PDF to Word: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Apply advanced formatting to a DOCX file after conversion
   * @param docxPath Path to the DOCX file
   * @param options Conversion options
   */
  private async applyAdvancedDocxFormatting(docxPath: string, options: ConvertToWordDto): Promise<void> {
    try {
      // This method would use the docx library to modify the document 
      // based on advanced formatting options. For now, it's a placeholder
      // that demonstrates the concept.
      
      console.log(`Applying advanced formatting to ${docxPath}`);
      
      // In a real implementation, this would:
      // 1. Load the DOCX file
      // 2. Apply formatting options (font, accessibility, etc.)
      // 3. Save the modified file
      
      // Example of what this could look like (simplified):
      // const docx = require('some-docx-editing-library');
      // const doc = await docx.load(docxPath);
      // 
      // if (options.formatting?.defaultFontFamily) {
      //   doc.setDefaultFont(options.formatting.defaultFontFamily);
      // }
      // 
      // if (options.advanced?.optimizeForAccessibility) {
      //   doc.addAccessibilityMetadata();
      //   doc.improveHeadingStructure();
      // }
      // 
      // await doc.save(docxPath);
      
      return;
    } catch (error) {
      console.error('Error applying advanced DOCX formatting:', error);
      // Don't throw - this is a non-critical post-processing step
    }
  }
}
