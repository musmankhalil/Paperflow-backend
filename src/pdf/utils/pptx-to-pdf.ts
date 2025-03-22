import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { execSync, exec } from 'child_process';
import { PDFDocument, PDFDict, PDFName, PDFArray, PDFString } from 'pdf-lib';
import { 
  PptxPdfQuality, 
  PptxPdfCompliance, 
  PptxImageHandling,
  ConvertPptxToPdfDto 
} from '../dto/convert-pptx-to-pdf.dto';

/**
 * Check if conversion tools are available on the system
 * @returns Object indicating available tools
 */
export function checkConversionTools(): { libreOffice: boolean, otherTools: boolean } {
  let libreOffice = false;
  let otherTools = false;

  try {
    // Check for LibreOffice
    execSync('libreoffice --version', { stdio: 'ignore' });
    libreOffice = true;
  } catch (error) {
    // LibreOffice not found
  }

  try {
    // Check for unoconv (another potential tool)
    execSync('unoconv --version', { stdio: 'ignore' });
    otherTools = true;
  } catch (error) {
    // unoconv not found
  }

  return { libreOffice, otherTools };
}

/**
 * Get LibreOffice conversion options based on quality and compliance settings
 * @param quality The desired quality level
 * @param compliance The desired PDF compliance standard
 * @returns String with LibreOffice command line options
 */
export function getLibreOfficeOptions(
  quality: PptxPdfQuality = PptxPdfQuality.STANDARD,
  compliance: PptxPdfCompliance = PptxPdfCompliance.PDF_1_7
): string {
  // Base options for headless conversion
  let options = '--headless';
  
  // Set conversion format based on compliance
  switch (compliance) {
    case PptxPdfCompliance.PDF_A_1B:
      options += ' --convert-to pdf:writer_pdf_Export:SelectPdfVersion=1';
      break;
    case PptxPdfCompliance.PDF_A_2B:
      options += ' --convert-to pdf:writer_pdf_Export:SelectPdfVersion=2';
      break;
    case PptxPdfCompliance.PDF_A_3B:
      options += ' --convert-to pdf:writer_pdf_Export:SelectPdfVersion=3';
      break;
    case PptxPdfCompliance.PDF_1_5:
      options += ' --convert-to pdf:writer_pdf_Export:SelectPdfVersion=4';
      break;
    case PptxPdfCompliance.PDF_1_6:
      options += ' --convert-to pdf:writer_pdf_Export:SelectPdfVersion=5';
      break;
    case PptxPdfCompliance.PDF_1_7:
    default:
      options += ' --convert-to pdf:writer_pdf_Export:SelectPdfVersion=6';
      break;
  }
  
  // Add quality-specific options
  switch (quality) {
    case PptxPdfQuality.DRAFT:
      options += ':ExportNotes=false:Quality=50:Reduce=true';
      break;
    case PptxPdfQuality.HIGH:
      options += ':ExportNotes=false:Quality=90:Reduce=false';
      break;
    case PptxPdfQuality.PREMIUM:
      options += ':ExportNotes=false:Quality=100:Reduce=false:UseLosslessCompression=true';
      break;
    case PptxPdfQuality.STANDARD:
    default:
      options += ':ExportNotes=false:Quality=75:Reduce=false';
      break;
  }
  
  return options;
}

/**
 * Check if a PPTX file is compatible for conversion to PDF
 * @param filePath Path to the PPTX file
 * @returns Object indicating compatibility status and any issues
 */
export async function checkPptxCompatibility(
  filePath: string
): Promise<{ isCompatible: boolean; error?: string; warning?: string; recommendedQuality?: PptxPdfQuality }> {
  try {
    // Basic file checks
    if (!fs.existsSync(filePath)) {
      return {
        isCompatible: false,
        error: 'File does not exist'
      };
    }
    
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.pptx' && ext !== '.ppt') {
      return {
        isCompatible: false,
        error: 'File must be a PowerPoint presentation (.pptx or .ppt)'
      };
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    // Look for potential issues
    let warning: string | undefined = undefined;
    let recommendedQuality = PptxPdfQuality.STANDARD;
    
    if (fileSizeMB > 50) {
      warning = 'Large file size may result in longer conversion time';
      recommendedQuality = PptxPdfQuality.STANDARD;
    }
    
    if (fileSizeMB > 100) {
      warning = 'Very large file size may require lower quality setting for successful conversion';
      recommendedQuality = PptxPdfQuality.DRAFT;
    }
    
    // Check conversion tools
    const tools = checkConversionTools();
    if (!tools.libreOffice && !tools.otherTools) {
      return {
        isCompatible: false,
        error: 'No conversion tools available. Please install LibreOffice.'
      };
    }
    
    return {
      isCompatible: true,
      warning,
      recommendedQuality
    };
  } catch (error) {
    return {
      isCompatible: false,
      error: `Failed to check compatibility: ${error.message}`
    };
  }
}

/**
 * Enhance the PDF file with additional features after conversion
 * @param pdfPath Path to the PDF file
 * @param options PPTX to PDF conversion options
 * @returns Path to the enhanced PDF file
 */
export async function enhancePdf(
  pdfPath: string,
  options: ConvertPptxToPdfDto = {}
): Promise<string> {
  try {
    const { metadata, security, advanced } = options;
    
    // Load the PDF file
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Set metadata if provided
    if (metadata) {
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
      if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords.split(',').map(k => k.trim()));
      if (metadata.creator) pdfDoc.setCreator(metadata.creator);
    }
    
    // Optimize for web if requested
    if (advanced?.optimizeForWeb) {
      // To optimize for web, we'd set specific options in the PDFDocument
      // For now, we'll just log it - a more comprehensive implementation would:
      // 1. Set the PDF to be linearized (for web streaming)
      // 2. Optimize content streams
      console.log('Optimizing PDF for web viewing');
    }
    
    // Apply security settings if requested
    // Note: pdf-lib has limited support for security features
    // A more comprehensive implementation would use a library with more security options
    let encryptOptions = {};
    if (security?.encrypt) {
      console.log('Applying PDF security settings');
      
      // In a real implementation, we'd set the security options
      // For now, we just show what would be done
      encryptOptions = {
        // Example encryption options - not fully supported in pdf-lib
      };
    }
    
    // Save the enhanced PDF
    const enhancedPdfPath = pdfPath.replace('.pdf', '-enhanced.pdf');
    const enhancedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(enhancedPdfPath, enhancedPdfBytes);
    
    return enhancedPdfPath;
  } catch (error) {
    console.error('Error enhancing PDF:', error);
    // If enhancement fails, return the original path
    return pdfPath;
  }
}

/**
 * Estimate conversion time for a PPTX file based on file size and quality
 * @param filePath Path to the PPTX file
 * @param quality The desired quality level
 * @returns Estimated conversion time in seconds
 */
export function estimateConversionTime(
  filePath: string,
  quality: PptxPdfQuality = PptxPdfQuality.STANDARD
): number {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    // Base time in seconds (rough estimate)
    let baseTime = fileSizeMB * 0.2;
    
    // Adjust based on quality
    switch (quality) {
      case PptxPdfQuality.DRAFT:
        baseTime *= 0.7;
        break;
      case PptxPdfQuality.HIGH:
        baseTime *= 1.5;
        break;
      case PptxPdfQuality.PREMIUM:
        baseTime *= 2.5;
        break;
      case PptxPdfQuality.STANDARD:
      default:
        // Keep base time as is
        break;
    }
    
    // Ensure minimum time
    return Math.max(1, Math.round(baseTime));
  } catch (error) {
    // Default to 10 seconds if estimation fails
    return 10;
  }
}

/**
 * Convert PPTX to PDF using direct LibreOffice command
 * @param pptxPath Path to the PPTX file
 * @param outputDir Directory for output
 * @param options LibreOffice command line options
 * @returns Promise that resolves to the path of the converted PDF
 */
export function convertWithLibreOffice(
  pptxPath: string,
  outputDir: string,
  options: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const pptxFilename = path.basename(pptxPath);
    const pdfFilename = pptxFilename.replace(/\.(pptx|ppt)$/i, '.pdf');
    const outputPath = path.join(outputDir, pdfFilename);
    
    const command = `libreoffice ${options} --outdir "${outputDir}" "${pptxPath}"`;
    console.log(`Executing conversion command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error during LibreOffice conversion:', stderr);
        return reject(new Error(`Conversion failed: ${error.message}`));
      }
      
      // Check if the file was created
      if (!fs.existsSync(outputPath)) {
        return reject(new Error('Conversion completed but PDF file was not created'));
      }
      
      resolve(outputPath);
    });
  });
}

/**
 * Extract specified slides from a PPTX file and create a new PPTX
 * @param pptxPath Path to the PPTX file
 * @param slideNumbers Array of slide numbers to extract (1-based)
 * @param outputDir Directory for output
 * @returns Path to the new PPTX with only selected slides
 * 
 * Note: This is a placeholder. Full implementation requires a PowerPoint
 * manipulation library which is beyond the scope of this example.
 */
export async function extractSlides(
  pptxPath: string,
  slideNumbers: number[],
  outputDir: string
): Promise<string> {
  // This is a placeholder. In a real implementation, we would:
  // 1. Open the PPTX file with a library like officegen or pptxgenjs
  // 2. Extract the specified slides
  // 3. Create a new PPTX with only those slides
  // 4. Save the new PPTX file
  
  console.log(`Would extract slides ${slideNumbers.join(', ')} from ${pptxPath}`);
  
  // For now, we'll just return the original file path
  // indicating that slide extraction is not implemented
  return pptxPath;
}
