import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { ImageCompressionLevel } from '../dto/compress-options.dto';

const execPromise = promisify(exec);

/**
 * Compresses a PDF using Ghostscript for much more effective compression
 * This achieves results similar to commercial PDF compressors
 * 
 * @param inputPath Path to the input PDF file
 * @param outputPath Path where the compressed PDF should be saved
 * @param compressionLevel Compression level to apply
 * @returns Promise that resolves when compression is complete
 */
export async function compressPdfWithGhostscript(
  inputPath: string,
  outputPath: string, 
  compressionLevel: ImageCompressionLevel = ImageCompressionLevel.MEDIUM
): Promise<void> {
  // Map compression levels to Ghostscript presets and forcefully log which one we're using
  let preset = '';
  
  // Explicit logging to debug the compression level
  console.log(`Ghostscript compression level received: "${compressionLevel}" (type: ${typeof compressionLevel})`);
  
  switch(compressionLevel) {
    case ImageCompressionLevel.LOW:
      preset = 'prepress'; // Higher quality, less compression
      console.log('Using LOW compression preset: prepress');
      break;
    case ImageCompressionLevel.MEDIUM:
      preset = 'printer'; // Good balance
      console.log('Using MEDIUM compression preset: printer');
      break;
    case ImageCompressionLevel.HIGH:
      preset = 'ebook'; // More compression
      console.log('Using HIGH compression preset: ebook');
      break;
    case ImageCompressionLevel.MAXIMUM:
      preset = 'screen'; // Maximum compression
      console.log('Using MAXIMUM compression preset: screen');
      break;
    case ImageCompressionLevel.NONE:
      preset = 'default'; // Minimal compression
      console.log('Using NONE/DEFAULT compression preset: default');
      break;
    default:
      // If something goes wrong, log exactly what we received
      console.warn(`Unrecognized compression level: ${JSON.stringify(compressionLevel)}`);
      preset = 'printer'; // Default to medium
      console.log('Defaulting to MEDIUM compression preset: printer');
  }
  
  try {
    // Create temporary paths with escaped spaces
    const safeInputPath = inputPath.replace(/(\s+)/g, '\\$1');
    const safeOutputPath = outputPath.replace(/(\s+)/g, '\\$1');
    
    // Add custom compression parameters based on level
    let dpiSetting = '';
    let qualitySetting = '';
    
    switch(compressionLevel) {
      case ImageCompressionLevel.LOW:
        dpiSetting = '-dColorImageResolution=150 -dGrayImageResolution=150 -dMonoImageResolution=300';
        qualitySetting = '-dColorImageDownsampleType=/Bicubic -dColorImageDownsampleThreshold=1.5';
        break;
      case ImageCompressionLevel.MEDIUM:
        dpiSetting = '-dColorImageResolution=120 -dGrayImageResolution=120 -dMonoImageResolution=300';
        qualitySetting = '-dColorImageDownsampleType=/Bicubic -dColorImageDownsampleThreshold=1.3';
        break;
      case ImageCompressionLevel.HIGH:
        dpiSetting = '-dColorImageResolution=96 -dGrayImageResolution=96 -dMonoImageResolution=200';
        qualitySetting = '-dColorImageDownsampleType=/Average -dColorImageDownsampleThreshold=1.0';
        break;
      case ImageCompressionLevel.MAXIMUM:
        dpiSetting = '-dColorImageResolution=72 -dGrayImageResolution=72 -dMonoImageResolution=144';
        qualitySetting = '-dColorImageDownsampleType=/Average -dColorImageDownsampleThreshold=1.0 -dEncodeColorImages=true -dEncodeGrayImages=true -dCompressPages=true';
        break;
    }
    
    // Enhanced Ghostscript command with explicit compression parameters
    const gsCommand = `gs -q -dNOPAUSE -dBATCH -dSAFER -sDEVICE=pdfwrite -dPDFSETTINGS=/${preset} ${dpiSetting} ${qualitySetting} -dCompatibilityLevel=1.4 -dAutoRotatePages=/None -sOutputFile="${safeOutputPath}" "${safeInputPath}"`;
    
    console.log(`Executing Ghostscript command: ${gsCommand}`);
    
    // Execute the command
    const { stdout, stderr } = await execPromise(gsCommand);
    
    if (stderr) {
      console.log('Ghostscript stderr:', stderr);
    }
    
    if (stdout) {
      console.log('Ghostscript stdout:', stdout);
    }
    
    // Verify output file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('Ghostscript failed to create the output file');
    }
    
  } catch (error) {
    console.error('Error compressing PDF with Ghostscript:', error);
    throw error;
  }
}

/**
 * Check if Ghostscript is installed and available
 * @returns boolean indicating if Ghostscript is available
 */
export async function isGhostscriptAvailable(): Promise<boolean> {
  try {
    // Try with -v flag first (more universally supported)
    try {
      const { stdout } = await execPromise('gs -v');
      console.log('Ghostscript detected:', stdout.split('\n')[0]);
      return true;
    } catch (e) {
      // Try with --version as fallback
      const { stdout } = await execPromise('gs --version');
      console.log('Ghostscript version detected:', stdout.trim());
      return true;
    }
  } catch (error) {
    console.warn('Ghostscript not available:', error.message);
    
    // Additional diagnostics
    try {
      await execPromise('which gs || where gs');
    } catch (pathError) {
      console.warn('Ghostscript not found in PATH');
    }
    
    return false;
  }
}
