import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import * as archiver from 'archiver';

const execPromise = promisify(exec);

export enum ImageFormat {
  JPG = 'jpg',
  PNG = 'png',
  TIFF = 'tiff',
  BMP = 'bmp',
  WEBP = 'webp'
}

export enum ImageQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  BEST = 'best'
}

export interface PdfToImageOptions {
  format?: ImageFormat;
  quality?: ImageQuality | number;
  dpi?: number;
  pageRange?: {
    from?: number;
    to?: number;
  };
  specificPages?: number[];
  grayscale?: boolean;
  transparent?: boolean;  // Only applicable for PNG
  cropToContent?: boolean;
}

@Injectable()
export class PdfToImageService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  private readonly tempDir = path.join(process.cwd(), 'uploads', 'temp');

  constructor() {
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Convert PDF to image using GhostScript (which should be installed as prerequisite)
   */
  async convertPdfToImage(
    filePath: string, 
    options: PdfToImageOptions = {}
  ): Promise<{ zipPath: string; pageCount: number }> {
    try {
      // Validate the input file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException('Input PDF file not found', HttpStatus.NOT_FOUND);
      }

      // Create a unique output directory for this conversion
      const outputDirName = uuidv4();
      const outputDir = path.join(this.tempDir, outputDirName);
      fs.mkdirSync(outputDir, { recursive: true });

      // Set default options
      const format = options.format || ImageFormat.JPG;
      const quality = options.quality || ImageQuality.MEDIUM;
      const dpi = options.dpi || this.getDefaultDpi(quality);
      const grayscale = options.grayscale || false;

      // Determine which pages to convert
      let pageRangeArgs = '';
      if (options.specificPages && options.specificPages.length > 0) {
        // If specific pages are provided, use them
        pageRangeArgs = `-dFirstPage=${Math.min(...options.specificPages)} -dLastPage=${Math.max(...options.specificPages)}`;
      } else if (options.pageRange) {
        // Otherwise use the page range if provided
        if (options.pageRange.from) {
          pageRangeArgs += ` -dFirstPage=${options.pageRange.from}`;
        }
        if (options.pageRange.to) {
          pageRangeArgs += ` -dLastPage=${options.pageRange.to}`;
        }
      }

      // Build the Ghostscript command
      const baseCommand = `gs -dNOPAUSE -dBATCH -dSAFER -sDEVICE=${this.getGsDeviceType(format)}`;
      
      // Quality and resolution settings
      let qualityArgs = `-r${dpi}`;
      
      // For JPG, add specific quality setting (0-100)
      if (format === ImageFormat.JPG) {
        const jpegQuality = typeof quality === 'number' ? quality : this.getJpegQualityValue(quality);
        qualityArgs += ` -dJPEGQ=${jpegQuality}`;
      }
      
      // Color mode
      const colorArgs = grayscale ? '-sColorConversionStrategy=Gray -dProcessColorModel=/DeviceGray' : '';
      
      // Transparency for PNG
      const transparencyArgs = format === ImageFormat.PNG && options.transparent ? 
        '-dBackgroundColor=16#FFFFFF -dTextAlphaBits=4 -dGraphicsAlphaBits=4' : '';
      
      // Crop settings
      const cropArgs = options.cropToContent ? '-dUseCropBox' : '';

      // Output pattern
      const outputPattern = path.join(outputDir, `page_%03d.${format}`);
      
      // Complete command
      const command = `${baseCommand} ${qualityArgs} ${colorArgs} ${transparencyArgs} ${cropArgs} ${pageRangeArgs} -sOutputFile="${outputPattern}" "${filePath}"`;
      
      console.log('Executing command:', command);
      
      // Execute Ghostscript
      await execPromise(command);
      
      // Count how many files were generated
      const files = fs.readdirSync(outputDir);
      const outputFiles = files.filter(file => file.endsWith(`.${format}`));
      
      // Create a ZIP file with all the images
      const zipFilename = `pdf_to_${format}_${Date.now()}.zip`;
      const zipPath = path.join(this.uploadsDir, zipFilename);
      
      await this.createZipFromDirectory(outputDir, zipPath);
      
      // Clean up the temporary files
      this.cleanupDirectory(outputDir);
      
      return {
        zipPath,
        pageCount: outputFiles.length
      };
    } catch (error) {
      console.error('Error converting PDF to image:', error);
      
      throw new HttpException(
        `Failed to convert PDF to image: ${error.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Convert a single page from a PDF to an image
   */
  async convertSinglePage(
    filePath: string,
    pageNumber: number,
    options: PdfToImageOptions = {}
  ): Promise<string> {
    try {
      // Validate the input file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException('Input PDF file not found', HttpStatus.NOT_FOUND);
      }

      // Create a unique output filename
      const format = options.format || ImageFormat.JPG;
      const outputFilename = `page_${pageNumber}_${Date.now()}.${format}`;
      const outputPath = path.join(this.uploadsDir, outputFilename);

      // Set default options
      const quality = options.quality || ImageQuality.MEDIUM;
      const dpi = options.dpi || this.getDefaultDpi(quality);
      const grayscale = options.grayscale || false;

      // Build the Ghostscript command
      const baseCommand = `gs -dNOPAUSE -dBATCH -dSAFER -sDEVICE=${this.getGsDeviceType(format)}`;
      
      // Quality and resolution settings
      let qualityArgs = `-r${dpi}`;
      
      // For JPG, add specific quality setting (0-100)
      if (format === ImageFormat.JPG) {
        const jpegQuality = typeof quality === 'number' ? quality : this.getJpegQualityValue(quality);
        qualityArgs += ` -dJPEGQ=${jpegQuality}`;
      }
      
      // Color mode
      const colorArgs = grayscale ? '-sColorConversionStrategy=Gray -dProcessColorModel=/DeviceGray' : '';
      
      // Transparency for PNG
      const transparencyArgs = format === ImageFormat.PNG && options.transparent ? 
        '-dBackgroundColor=16#FFFFFF -dTextAlphaBits=4 -dGraphicsAlphaBits=4' : '';
      
      // Crop settings
      const cropArgs = options.cropToContent ? '-dUseCropBox' : '';

      // Page selection
      const pageArgs = `-dFirstPage=${pageNumber} -dLastPage=${pageNumber}`;
      
      // Complete command
      const command = `${baseCommand} ${qualityArgs} ${colorArgs} ${transparencyArgs} ${cropArgs} ${pageArgs} -sOutputFile="${outputPath}" "${filePath}"`;
      
      console.log('Executing command for single page:', command);
      
      // Execute Ghostscript
      await execPromise(command);
      
      return outputPath;
    } catch (error) {
      console.error('Error converting PDF page to image:', error);
      
      throw new HttpException(
        `Failed to convert PDF page to image: ${error.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create a zip file from all files in a directory
   */
  private async createZipFromDirectory(dirPath: string, zipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`Zip created: ${archive.pointer()} total bytes`);
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(dirPath, false);
      archive.finalize();
    });
  }

  /**
   * Map quality settings to DPI values
   */
  private getDefaultDpi(quality: ImageQuality | number): number {
    if (typeof quality === 'number') {
      // If quality is a number between 1-100, map it to a DPI range (72-600)
      return Math.round(72 + (quality / 100) * (600 - 72));
    }

    // Predefined quality settings
    switch (quality) {
      case ImageQuality.LOW:
        return 96;
      case ImageQuality.MEDIUM:
        return 150;
      case ImageQuality.HIGH:
        return 300;
      case ImageQuality.BEST:
        return 600;
      default:
        return 150; // Default medium quality
    }
  }

  /**
   * Map quality settings to JPEG quality values (1-100)
   */
  private getJpegQualityValue(quality: ImageQuality): number {
    switch (quality) {
      case ImageQuality.LOW:
        return 60;
      case ImageQuality.MEDIUM:
        return 80;
      case ImageQuality.HIGH:
        return 90;
      case ImageQuality.BEST:
        return 100;
      default:
        return 80; // Default medium quality
    }
  }

  /**
   * Map format to Ghostscript device type
   */
  private getGsDeviceType(format: ImageFormat): string {
    switch (format) {
      case ImageFormat.JPG:
        return 'jpeg';
      case ImageFormat.PNG:
        return 'png16m';
      case ImageFormat.TIFF:
        return 'tiff24nc';
      case ImageFormat.BMP:
        return 'bmp16m';
      case ImageFormat.WEBP:
        // GhostScript doesn't directly support WEBP, would need additional conversion
        throw new HttpException('WEBP format not directly supported', HttpStatus.BAD_REQUEST);
      default:
        return 'jpeg';
    }
  }

  /**
   * Clean up a directory and its contents
   */
  private cleanupDirectory(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file) => {
        const curPath = path.join(dirPath, file);
        fs.unlinkSync(curPath);
      });
      fs.rmdirSync(dirPath);
    }
  }
}
