import { Injectable, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';
import { CompressOptionsDto, ImageCompressionLevel } from '../dto/compress-options.dto';
import { 
  calculateCompressionSettings, 
  analyzePdfForCompression, 
  applyBasicCompression, 
  getCompressionStats 
} from '../utils/compression';
import { compressPdfWithGhostscript, isGhostscriptAvailable } from '../utils/ghostscript-compression';

@Injectable()
export class PdfCompressionService implements OnModuleInit {
  private ghostscriptAvailable = false;
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  
  // Getter for uploads directory
  getUploadsDir(): string {
    return this.uploadsDir;
  }
  
  async onModuleInit() {
    // Check if Ghostscript is available on startup
    try {
      this.ghostscriptAvailable = await isGhostscriptAvailable();
      if (this.ghostscriptAvailable) {
        console.log('Ghostscript is available for high-quality PDF compression');
      } else {
        console.warn('Ghostscript is not available. Falling back to basic PDF compression.');
      }
    } catch (error) {
      console.warn('Error checking for Ghostscript:', error.message);
      this.ghostscriptAvailable = false;
    }
  }
  
  /**
   * Helper method to properly map string compression levels to enum values
   * This is crucial for making sure different compression levels work correctly
   */
  private mapStringToCompressionLevel(level: string | undefined): ImageCompressionLevel {
    // Explicitly log what we received to debug
    console.log(`Mapping compression level string: "${level}" to enum value`);
    
    // Handle undefined/null case explicitly
    if (!level) {
      console.log('Compression level is undefined/null, using default MEDIUM');
      return ImageCompressionLevel.MEDIUM;
    }
    
    switch (level.toLowerCase()) {
      case 'low':
        return ImageCompressionLevel.LOW;
      case 'medium':
        return ImageCompressionLevel.MEDIUM;
      case 'high':
        return ImageCompressionLevel.HIGH;
      case 'maximum':
        return ImageCompressionLevel.MAXIMUM;
      case 'none':
        return ImageCompressionLevel.NONE;
      default:
        console.warn(`Unknown compression level: "${level}", defaulting to MEDIUM`);
        return ImageCompressionLevel.MEDIUM;
    }
  }

  /**
   * Compress a PDF to reduce file size
   * This implementation uses Ghostscript for high-quality compression similar to commercial tools
   * @param filePath Path to the PDF file
   * @param options Compression options
   * @returns Path to the compressed PDF file
   */
  async compressPdf(filePath: string, options: CompressOptionsDto = {
    imageCompression: ImageCompressionLevel.MEDIUM,
    imageQuality: 75
  }): Promise<string> {
    try {
      const {
        imageCompression,
        removeMetadata = false,
        deduplicateImages = true
      } = options;

      // Get original file info
      const originalFileStats = fs.statSync(filePath);
      const originalSizeKb = Math.round(originalFileStats.size / 1024);
      
      // Generate an output path
      const outputPath = path.join(this.uploadsDir, `compressed-${Date.now()}.pdf`);
      
      // Load PDF to get page count
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();
      
      console.log(`Starting PDF compression: ${originalSizeKb} KB, ${pageCount} pages`);
      
      // Try to use Ghostscript for high-quality compression if available
      const ghostscriptOutputPath = path.join(this.uploadsDir, `gs-compressed-${Date.now()}.pdf`);
      let ghostscriptSuccess = false;
      
      // Only attempt Ghostscript if it's available
      if (this.ghostscriptAvailable) {
        try {
          // Explicitly convert string to enum type to ensure proper matching
          const compressionLevelEnum = this.mapStringToCompressionLevel(imageCompression);
          
          console.log(`Using Ghostscript for high-quality compression (${compressionLevelEnum} level)`);
          
          // Check if the Ghostscript process is available again (might have changed)
          const gsAvailable = await isGhostscriptAvailable();
          
          if (gsAvailable) {
            // Try Ghostscript compression with explicit level
            await compressPdfWithGhostscript(filePath, ghostscriptOutputPath, compressionLevelEnum);
            
            // Verify the output file exists and check its size
            if (fs.existsSync(ghostscriptOutputPath)) {
              const compressedFileStats = fs.statSync(ghostscriptOutputPath);
              
              // Only use the Ghostscript output if it's smaller than the original
              if (compressedFileStats.size < originalFileStats.size * 0.99) {
                const compressedSizeKb = Math.round(compressedFileStats.size / 1024);
                const compressionRatio = Math.round((1 - (compressedFileStats.size / originalFileStats.size)) * 100);
                
                console.log(`----- Ghostscript Compression Results -----`);
                console.log(`Original size: ${originalFileStats.size} bytes (${originalSizeKb} KB)`);
                console.log(`Compressed size: ${compressedFileStats.size} bytes (${compressedSizeKb} KB)`);
                console.log(`Compression ratio: ${compressionRatio}%`);
                console.log(`Compression level: ${imageCompression}`);
                
                // Success! Use the Ghostscript output
                fs.copyFileSync(ghostscriptOutputPath, outputPath);
                ghostscriptSuccess = true;
              } else {
                console.warn('Ghostscript compression did not reduce file size significantly');
              }
            } else {
              console.warn('Ghostscript did not produce an output file');
            }
          } else {
            console.warn('Ghostscript became unavailable before compression');
          }
        } catch (gsError) {
          console.error('Ghostscript compression failed:', gsError.message);
        } finally {
          // Cleanup Ghostscript temporary file if it exists
          if (fs.existsSync(ghostscriptOutputPath)) {
            try {
              fs.unlinkSync(ghostscriptOutputPath);
            } catch (e) {
              console.warn('Failed to cleanup Ghostscript temporary file:', e.message);
            }
          }
        }
      } else {
        console.log('Ghostscript not available, using basic compression');
      }
      
      // If Ghostscript succeeded, return the output path
      if (ghostscriptSuccess) {
        return outputPath;
      }
      
      // Fallback to PDF-lib based compression if Ghostscript is not available
      console.log('Using basic PDF-lib compression as fallback');
      
      // Apply compression using our utility
      const compressedPdf = await applyBasicCompression(pdfDoc, {
        imageCompression,
        removeMetadata,
        deduplicateImages
      });
      
      // Apply aggressive compression options
      const compressionOptions: any = {
        useObjectStreams: true,
        compress: true,
        deflateLevel: 9,
        compressStreams: true,
        useBinaryEntries: true,
        pruneObjects: true,
        objectsPerTick: 500,
        addDefaultPage: false,
        updateFieldAppearances: false,
        normalizeContentStreams: true,
        throwOnInvalidObject: false,
      };

      // Save the compressed PDF
      const compressedPdfBytes = await compressedPdf.save(compressionOptions);
      fs.writeFileSync(outputPath, compressedPdfBytes);
      
      // Log compression results
      const compressedFileStats = fs.statSync(outputPath);
      const compressedSizeKb = Math.round(compressedFileStats.size / 1024);
      const compressionRatio = Math.round((1 - (compressedFileStats.size / originalFileStats.size)) * 100);
      
      console.log(`----- Basic Compression Results -----`);
      console.log(`Original size: ${originalFileStats.size} bytes (${originalSizeKb} KB)`);
      console.log(`Compressed size: ${compressedFileStats.size} bytes (${compressedSizeKb} KB)`);
      console.log(`Compression ratio: ${compressionRatio}%`);
      
      return outputPath;
    } catch (error) {
      console.error('PDF compression error:', error);
      throw new HttpException(
        `Failed to compress PDF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Analyze a PDF file to identify compression opportunities
   * @param filePath Path to the PDF file
   * @returns Analysis results including recommendations
   */
  async analyzePdfCompression(filePath: string) {
    try {
      // Use our utility function to analyze the PDF
      const analysis = await analyzePdfForCompression(filePath);
      
      // Determine if PDF has images (a simplified approximation)
      const fileSize = fs.statSync(filePath).size;
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();
      
      const hasImages = fileSize / pageCount > 100 * 1024; // Assume pages > 100KB have images
      const avgPageSize = Math.round(fileSize / pageCount / 1024);
      const estimatedImageSize = hasImages ? `~${Math.round(fileSize * 0.7 / 1024)} KB` : 'None detected';
      
      // Check for metadata
      const pdfData = await pdfParse(pdfBytes);
      const hasMetadata = !!(pdfData.info?.Title || pdfData.info?.Author || 
                          pdfData.info?.Subject || pdfData.info?.Keywords);
      
      // Check for form fields (this is a simplified check - in reality, PDF form detection is more complex)
      // A real implementation would check for /AcroForm dictionary in the document catalog
      const hasFormFields = false; // Simplified for now - pdf-lib doesn't have a direct API for this
      
      // Additional analysis data
      const additionalInfo = {
        hasImages,
        estimatedImageSize,
        hasMetadata,
        hasFormFields,
        avgPageSizeKB: avgPageSize,
      };
      
      // Return combined analysis
      return {
        ...analysis,
        ...additionalInfo
      };
    } catch (error) {
      console.error('Error analyzing PDF for compression:', error);
      throw new HttpException(
        `Failed to analyze PDF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
