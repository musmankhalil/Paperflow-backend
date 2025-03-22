import * as fs from 'fs';
import * as path from 'path';
import { ConvertToPptxDto, SlideQuality, TextExtractionMode, ImageHandling } from '../dto/convert-to-pptx.dto';
import { execSync } from 'child_process';

/**
 * Checks if the necessary tools for PDF to PPTX conversion are installed
 * @returns Object containing availability status of conversion tools
 */
export function checkConversionTools(): { libreOffice: boolean; otherTools: boolean } {
  let libreOffice = false;
  let otherTools = false;

  try {
    execSync('libreoffice --version', { stdio: 'ignore' });
    libreOffice = true;
  } catch (error) {
    console.log('LibreOffice not found');
  }

  // Check for other potential tools that could be used for conversion
  // This is just a placeholder - in a real implementation, you would check for
  // other tools that could handle PDF to PPTX conversion
  try {
    execSync('which unoconv', { stdio: 'ignore' });
    otherTools = true;
  } catch (error) {
    console.log('Unoconv not found');
  }

  return { libreOffice, otherTools };
}

/**
 * Get optimal conversion settings based on PDF file characteristics
 * @param filePath Path to the PDF file
 * @param preferredQuality Preferred quality setting
 * @returns Optimized conversion settings
 */
export function getOptimalConversionSettings(
  filePath: string,
  preferredQuality: SlideQuality = SlideQuality.STANDARD
): {
  quality: SlideQuality;
  textMode: TextExtractionMode;
  imageHandling: ImageHandling;
} {
  // Analyze file size to determine optimal settings
  const fileStats = fs.statSync(filePath);
  const fileSizeMB = fileStats.size / (1024 * 1024);

  let quality = preferredQuality;
  let textMode = TextExtractionMode.SMART;
  let imageHandling = ImageHandling.INCLUDE_HIGH_RES;

  // Adjust settings based on file size
  if (fileSizeMB > 50) {
    // For large files, reduce quality unless premium is explicitly requested
    if (quality !== SlideQuality.PREMIUM) {
      quality = SlideQuality.STANDARD;
    }
    // Reduce image quality for large files
    imageHandling = ImageHandling.INCLUDE_LOW_RES;
  } else if (fileSizeMB > 10) {
    // For medium files, use standard settings
    if (quality !== SlideQuality.PREMIUM && quality !== SlideQuality.HIGH) {
      quality = SlideQuality.STANDARD;
    }
  } else {
    // For small files, we can use higher quality
    if (quality === SlideQuality.DRAFT) {
      quality = SlideQuality.STANDARD;
    }
  }

  return { quality, textMode, imageHandling };
}

/**
 * Check if a PDF file is compatible for conversion to PPTX
 * @param filePath Path to the PDF file
 * @returns Compatibility information and recommendations
 */
export async function checkPdfCompatibility(filePath: string): Promise<{
  isCompatible: boolean;
  error?: string;
  warning?: string;
  recommendedQuality?: SlideQuality;
}> {
  try {
    // Basic file existence check
    if (!fs.existsSync(filePath)) {
      return {
        isCompatible: false,
        error: 'File does not exist',
      };
    }

    // Basic file size check
    const fileStats = fs.statSync(filePath);
    const fileSizeMB = fileStats.size / (1024 * 1024);

    // Check if file is too large
    if (fileSizeMB > 100) {
      return {
        isCompatible: true,
        warning: 'File is very large and may result in a slow conversion process or lower quality presentation',
        recommendedQuality: SlideQuality.STANDARD,
      };
    }

    // Check if file is too small (might be corrupted or empty)
    if (fileSizeMB < 0.01) {
      return {
        isCompatible: false,
        error: 'File is too small and may be corrupted or empty',
      };
    }

    // For demonstration, we'll assume all PDFs are compatible
    // In a real implementation, we would check:
    // - PDF version compatibility
    // - PDF structure (e.g., presence of document structure)
    // - Security/encryption status
    // - Content types (text, images, forms, etc.)

    return {
      isCompatible: true,
      recommendedQuality: 
        fileSizeMB > 50 ? SlideQuality.STANDARD : 
        fileSizeMB > 20 ? SlideQuality.HIGH : SlideQuality.PREMIUM,
    };
  } catch (error) {
    console.error('Error checking PDF compatibility:', error);
    return {
      isCompatible: false,
      error: `Compatibility check failed: ${error.message}`,
    };
  }
}

/**
 * Estimate the conversion time based on file characteristics
 * @param filePath Path to the PDF file
 * @param quality Requested quality setting
 * @returns Estimated conversion time in seconds
 */
export function estimateConversionTime(
  filePath: string,
  quality: SlideQuality = SlideQuality.STANDARD
): number {
  // Get file size in MB
  const fileStats = fs.statSync(filePath);
  const fileSizeMB = fileStats.size / (1024 * 1024);

  // Base time in seconds - this is just an example, real values would need calibration
  let baseTime = 5;

  // Adjust for file size
  baseTime += fileSizeMB * 0.5;

  // Adjust for quality setting
  switch (quality) {
    case SlideQuality.DRAFT:
      baseTime *= 0.6;
      break;
    case SlideQuality.STANDARD:
      baseTime *= 1.0;
      break;
    case SlideQuality.HIGH:
      baseTime *= 1.5;
      break;
    case SlideQuality.PREMIUM:
      baseTime *= 2.2;
      break;
  }

  // Return rounded estimate
  return Math.round(baseTime);
}

/**
 * Get LibreOffice command line options based on quality setting
 * @param quality Requested quality setting
 * @returns LibreOffice command line options string
 */
export function getLibreOfficeOptions(quality: SlideQuality): string {
  switch (quality) {
    case SlideQuality.PREMIUM:
      return '--headless --convert-to pptx:"Impress MS PowerPoint 2007 XML:EmbedImages"';
    case SlideQuality.HIGH:
      return '--headless --convert-to pptx:"Impress MS PowerPoint 2007 XML:EmbedImages"';
    case SlideQuality.DRAFT:
      return '--headless --convert-to pptx:"Impress MS PowerPoint 2007 XML"';
    case SlideQuality.STANDARD:
    default:
      return '--headless --convert-to pptx:"Impress MS PowerPoint 2007 XML"';
  }
}

/**
 * Analyze a PDF file to provide recommendations for conversion to PPTX
 * @param filePath Path to the PDF file
 * @returns Analysis results including recommendations
 */
export async function analyzePdfForPptxConversion(filePath: string): Promise<any> {
  try {
    // Basic file checks
    if (!fs.existsSync(filePath)) {
      return {
        isCompatible: false,
        error: 'File does not exist'
      };
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    // Check conversion tools
    const tools = checkConversionTools();
    
    // Check compatibility
    const compatibility = await checkPdfCompatibility(filePath);
    
    // Estimate conversion time
    const estimatedTimeStandard = estimateConversionTime(filePath, SlideQuality.STANDARD);
    const estimatedTimeHigh = estimateConversionTime(filePath, SlideQuality.HIGH);
    const estimatedTimePremium = estimateConversionTime(filePath, SlideQuality.PREMIUM);
    
    // Generate recommendations
    const recommendedQuality = compatibility.recommendedQuality || SlideQuality.STANDARD;
    
    // Generate detailed report
    return {
      filename: path.basename(filePath),
      fileSize: `${fileSizeMB.toFixed(2)} MB`,
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
        premiumQuality: `${estimatedTimePremium} seconds`,
      },
      recommendations: {
        recommendedQuality,
        recommendedTextMode: fileSizeMB > 20 ? TextExtractionMode.SMART : TextExtractionMode.PRESERVE_LAYOUT,
        recommendedImageHandling: 
          fileSizeMB > 50 ? ImageHandling.INCLUDE_LOW_RES : ImageHandling.INCLUDE_HIGH_RES,
        shouldGenerateTableOfContents: fileSizeMB > 5, // Recommend TOC for larger documents
      }
    };
  } catch (error) {
    console.error('Error analyzing PDF for PPTX conversion:', error);
    return {
      isCompatible: false,
      error: `Analysis failed: ${error.message}`
    };
  }
}
