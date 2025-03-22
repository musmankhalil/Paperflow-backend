/**
 * Utility functions for DOCX to PDF conversion
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { PdfQuality, PdfCompliance, FontEmbedding } from '../dto/convert-to-pdf.dto';
import { PDFDocument, StandardFonts } from 'pdf-lib';

/**
 * Check if required software is installed on the system
 * @returns Object indicating which conversion tools are available
 */
export function checkConversionTools(): { libreOffice: boolean; otherTools: boolean } {
  const result = {
    libreOffice: false,
    otherTools: false
  };

  // Check for LibreOffice
  try {
    execSync('libreoffice --version', { stdio: 'ignore' });
    result.libreOffice = true;
  } catch (error) {
    try {
      // On some systems, it might be called soffice
      execSync('soffice --version', { stdio: 'ignore' });
      result.libreOffice = true;
    } catch (secondError) {
      // LibreOffice not available
    }
  }

  // Check for other potential tools (e.g., unoconv)
  try {
    execSync('unoconv --version', { stdio: 'ignore' });
    result.otherTools = true;
  } catch (error) {
    // Unoconv not available
  }

  return result;
}

/**
 * Get optimal conversion settings based on document characteristics
 * @param filePath Path to the DOCX file
 * @param requestedQuality Requested output quality
 * @returns Optimized conversion settings
 */
export function getOptimalConversionSettings(filePath: string, requestedQuality: PdfQuality) {
  // Get file size in MB
  const stats = fs.statSync(filePath);
  const fileSizeMB = stats.size / (1024 * 1024);
  
  // Default settings
  const settings = {
    useThreads: true,
    maxMemoryMB: 512,
    imageQuality: 90,
    compressionLevel: 'medium',
    timeout: 60000, // 1 minute per document
  };
  
  // Adjust based on file size
  if (fileSizeMB > 20) {
    // Large file (>20MB)
    settings.maxMemoryMB = 768;
    settings.timeout = 120000; // 2 minutes
  } else if (fileSizeMB > 10) {
    // Medium file (10-20MB)
    settings.maxMemoryMB = 640;
    settings.timeout = 90000; // 1.5 minutes
  }
  
  // Override based on requested quality
  switch (requestedQuality) {
    case PdfQuality.DRAFT:
      settings.imageQuality = 75;
      settings.compressionLevel = 'high';
      break;
      
    case PdfQuality.HIGH:
      settings.imageQuality = 95;
      settings.compressionLevel = 'low';
      settings.maxMemoryMB = Math.max(settings.maxMemoryMB, 768);
      break;
      
    case PdfQuality.PREPRESS:
      settings.imageQuality = 100;
      settings.compressionLevel = 'none';
      settings.maxMemoryMB = Math.max(settings.maxMemoryMB, 1024);
      settings.timeout = Math.max(settings.timeout, 180000); // At least 3 minutes
      break;
  }
  
  return settings;
}

/**
 * Check if a DOCX file is compatible with conversion
 * @param filePath Path to the DOCX file
 * @returns Object containing compatibility info
 */
export async function checkDocxCompatibility(filePath: string) {
  try {
    // Make sure the file exists
    if (!fs.existsSync(filePath)) {
      return {
        isCompatible: false,
        error: 'File does not exist'
      };
    }
    
    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.docx' && ext !== '.doc') {
      return {
        isCompatible: false,
        error: 'File must be a Word document (.docx or .doc)'
      };
    }
    
    // Check file size
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    // File is too large (arbitrary limit for this example)
    const MAX_FILE_SIZE_MB = 100;
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return {
        isCompatible: true,
        warning: `File is very large (${Math.round(fileSizeMB)} MB). Conversion may take longer.`,
        recommendedQuality: PdfQuality.DRAFT
      };
    }
    
    // Check available conversion tools
    const tools = checkConversionTools();
    if (!tools.libreOffice && !tools.otherTools) {
      return {
        isCompatible: false,
        error: 'No conversion tools available. Please install LibreOffice.'
      };
    }
    
    // All checks passed
    return {
      isCompatible: true,
      recommendedQuality: getRecommendedQuality(fileSizeMB)
    };
  } catch (error) {
    console.error('Error checking DOCX compatibility:', error);
    return {
      isCompatible: false,
      error: error.message
    };
  }
}

/**
 * Recommend a quality level based on document size
 * @param fileSizeMB File size in MB
 * @returns Recommended PdfQuality
 */
function getRecommendedQuality(fileSizeMB: number): PdfQuality {
  if (fileSizeMB > 30) {
    // Large files - use draft for speed
    return PdfQuality.DRAFT;
  } else if (fileSizeMB > 15) {
    // Medium files - use standard
    return PdfQuality.STANDARD;
  } else if (fileSizeMB > 5) {
    // Smaller files - use high quality
    return PdfQuality.HIGH;
  } else {
    // Very small files - use prepress quality
    return PdfQuality.PREPRESS;
  }
}

/**
 * Get LibreOffice command line options for PDF conversion
 * @param quality Requested PDF quality
 * @param compliance PDF compliance standard
 * @returns Command line options string
 */
export function getLibreOfficeOptions(quality: PdfQuality, compliance: PdfCompliance): string {
  // Base options
  let options = '--headless --convert-to pdf';
  
  // Quality-specific options
  switch (quality) {
    case PdfQuality.DRAFT:
      options += ':writer_pdf_Export:{"CompressionQuality":{"type":"long","value":"90"}}';
      break;
    case PdfQuality.HIGH:
      options += ':writer_pdf_Export:{"CompressionQuality":{"type":"long","value":"10"}}';
      break;
    case PdfQuality.PREPRESS:
      options += ':writer_pdf_Export:{"CompressionQuality":{"type":"long","value":"0"},"UseLosslessCompression":{"type":"boolean","value":"true"}}';
      break;
    default: // STANDARD
      options += ':writer_pdf_Export:{"CompressionQuality":{"type":"long","value":"50"}}';
      break;
  }
  
  // Compliance-specific options
  if (compliance === PdfCompliance.PDF_A_1B) {
    options = options.replace('writer_pdf_Export', 'writer_pdf_Export:{"SelectPdfVersion":{"type":"long","value":"1"}}');
  } else if (compliance === PdfCompliance.PDF_A_2B) {
    options = options.replace('writer_pdf_Export', 'writer_pdf_Export:{"SelectPdfVersion":{"type":"long","value":"2"}}');
  } else if (compliance === PdfCompliance.PDF_A_3B) {
    options = options.replace('writer_pdf_Export', 'writer_pdf_Export:{"SelectPdfVersion":{"type":"long","value":"3"}}');
  }
  
  return options;
}

/**
 * Enhance the converted PDF with additional features
 * @param pdfPath Path to the converted PDF
 * @param options Advanced options for enhancement
 * @returns Path to the enhanced PDF file
 */
export async function enhancePdf(pdfPath: string, options: any): Promise<string> {
  try {
    // Read the input PDF
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Apply security if requested
    if (options.security?.encrypt) {
      // For security options, we could use a third-party library
      // but for now we'll skip this as pdf-lib doesn't fully support
      // all security features we need
      console.log('PDF security options requested but not fully supported by pdf-lib');
      console.log('Consider using a dedicated PDF security tool for sensitive documents');
      
      // Add a warning note about security
      const { title } = options.metadata || {};
      const updatedTitle = title ? `${title} (Security options not applied)` : 'Document (Security options not applied)';
      pdfDoc.setTitle(updatedTitle);
    }
    
    // Apply metadata if requested
    if (options.metadata) {
      const { title, author, subject, keywords, creator, includeCreationDate } = options.metadata;
      
      if (title) pdfDoc.setTitle(title);
      if (author) pdfDoc.setAuthor(author);
      if (subject) pdfDoc.setSubject(subject);
      if (keywords) pdfDoc.setKeywords(keywords.split(',').map(k => k.trim()));
      if (creator) pdfDoc.setCreator(creator);
      if (!includeCreationDate) {
        // Remove creation date (simplified approach)
        // In a full implementation, you would access the PDF dictionary directly
      }
    }
    
    // Save the enhanced PDF
    const enhancedPdfBytes = await pdfDoc.save();
    const outputPath = pdfPath.replace('.pdf', '-enhanced.pdf');
    fs.writeFileSync(outputPath, enhancedPdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('Error enhancing PDF:', error);
    // Return original path if enhancement fails
    return pdfPath;
  }
}

/**
 * Estimate conversion processing time based on file characteristics
 * @param filePath Path to the DOCX file
 * @param quality Requested conversion quality
 * @returns Estimated processing time in seconds
 */
export function estimateConversionTime(filePath: string, quality: PdfQuality): number {
  try {
    // Get file size
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    // Base time in seconds
    let baseTime = 10; // 10 seconds baseline
    
    // Adjust based on file size (rough estimate)
    baseTime += fileSizeMB * 0.5; // 0.5 seconds per MB
    
    // Adjust based on quality
    switch (quality) {
      case PdfQuality.DRAFT:
        baseTime *= 0.7; // 30% faster
        break;
      case PdfQuality.HIGH:
        baseTime *= 1.5; // 50% slower
        break;
      case PdfQuality.PREPRESS:
        baseTime *= 2.0; // 100% slower
        break;
    }
    
    // Add 20% overhead
    const withOverhead = baseTime * 1.2;
    
    return Math.ceil(withOverhead);
  } catch (error) {
    console.error('Error estimating conversion time:', error);
    return 30; // Default to 30 seconds if estimation fails
  }
}
