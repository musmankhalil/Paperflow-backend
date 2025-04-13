import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpException,
  HttpStatus,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream, statSync } from 'fs';
import * as fs from 'fs';
import * as path from 'path';
import { PdfService } from '../pdf.service';
import { multerConfig } from '../multer.config';
import { CompressOptionsDto, ImageCompressionLevel } from '../dto/compress-options.dto';
import { PdfCompressionStatsController } from './pdf-compression-stats.controller';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiProduces,
  ApiBody,
  ApiResponse,
  ApiProperty,
  getSchemaPath,
  ApiQuery,
} from '@nestjs/swagger';

// Swagger DTO helpers
class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}

class CompressionResult {
  @ApiProperty({ example: 'PDF compressed successfully' })
  message: string;

  @ApiProperty({ example: '1024 KB' })
  originalSize: string;

  @ApiProperty({ example: '512 KB' })
  compressedSize: string;

  @ApiProperty({ example: 50 })
  compressionRatio: number;
}

class CompressionAnalysis {
  @ApiProperty({ example: '1024 KB' })
  fileSize: string;

  @ApiProperty({ example: 10 })
  pageCount: number;

  @ApiProperty({ example: true })
  hasImages: boolean;

  @ApiProperty({ example: '800 KB' })
  estimatedImageSize: string;

  @ApiProperty({ example: false })
  hasFormFields: boolean;

  @ApiProperty({ 
    example: [
      'Apply medium image compression',
      'Downsample images to 150 DPI',
      'Remove metadata'
    ]
  })
  recommendations: Array<string>;

  @ApiProperty({ example: '30-40%' })
  estimatedSavings: string;
}

@ApiTags('pdf-compress')
@Controller('pdf/compress')
export class PdfCompressController {
  constructor(private readonly pdfService: PdfService) {}

  /**
   * Compress a PDF file to reduce size
   */
  @Post()
  @ApiOperation({ 
    summary: 'Compress a PDF file to reduce file size',
    description: 'Compresses PDF using various techniques including image compression, downsampling, and metadata removal.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'PDF file to compress with options',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        imageCompression: {
          type: 'string',
          enum: Object.values(ImageCompressionLevel),
          default: ImageCompressionLevel.MEDIUM,
          description: 'Image compression level to apply',
        },
        imageQuality: {
          type: 'number',
          minimum: 1,
          maximum: 100,
          default: 75,
          description: 'JPEG image quality (1-100, lower means more compression)',
        },
        downsampleImages: {
          type: 'boolean',
          default: true,
          description: 'Whether to downsample images to reduce file size',
        },
        downsampleDpi: {
          type: 'number',
          minimum: 72,
          maximum: 300,
          default: 150,
          description: 'Target DPI for downsampled images',
        },
        removeMetadata: {
          type: 'boolean',
          default: false,
          description: 'Whether to remove metadata to reduce file size',
        },
        flattenFormFields: {
          type: 'boolean',
          default: false,
          description: 'Whether to flatten form fields',
        },
        deduplicateImages: {
          type: 'boolean',
          default: true,
          description: 'Whether to combine duplicate image resources',
        }
      },
    },
  })
  @ApiProduces('application/pdf', 'application/json')
  @ApiQuery({
    name: 'info',
    required: false,
    type: Boolean,
    description: 'If true, returns compression info as JSON instead of the PDF file'
  })
  @ApiResponse({
    status: 200,
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        }
      },
      'application/json': {
        schema: { $ref: getSchemaPath(CompressionResult) }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input or no file uploaded' })
  @ApiResponse({ status: 500, description: 'Failed to compress PDF' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async compressPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body() compressOptionsDto: CompressOptionsDto,
    @Query('info') infoOnly: boolean,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    try {
      // Get original file size for comparison
      const originalFileStats = statSync(file.path);
      const originalSizeKb = Math.round(originalFileStats.size / 1024);
      
      // Compress the PDF
      const compressedPdfPath = await this.pdfService.compressPdf(file.path, compressOptionsDto);
      
      // Get compressed file size
      const compressedFileStats = statSync(compressedPdfPath);
      const compressedSizeKb = Math.round(compressedFileStats.size / 1024);
      
      // Calculate compression ratio
      let compressionRatio = Math.round((1 - (compressedFileStats.size / originalFileStats.size)) * 100);
      
      // Only log the compression results - don't force a minimum ratio
      // We want to show the real results to the user
      if (compressedFileStats.size >= originalFileStats.size * 0.99) {
        console.warn('Compression resulted in minimal size reduction.');
        console.log(`Actual compression ratio was only ${compressionRatio}%`);
        
        // If the file actually got larger, use the original
        if (compressedFileStats.size > originalFileStats.size) {
          // Remove failed compressed file
          fs.unlinkSync(compressedPdfPath);
          
          // Copy original file to the output path
          const newOutputPath = path.join(this.pdfService.getUploadsDir(), `compressed-${Date.now()}.pdf`);
          fs.copyFileSync(file.path, newOutputPath);
          
          // Log detailed info for debugging
          console.log('Using original file because compression increased size:');
          console.log(`Original size: ${originalSizeKb} KB`);
          console.log(`Attempted compressed size: ${compressedSizeKb} KB`);
          console.log(`Compression options:`, compressOptionsDto);
          
          return newOutputPath;
        }
      }
      
      // Return JSON info if requested
      if (infoOnly) {
        res.setHeader('Content-Type', 'application/json');
        res.json({
          message: 'PDF compressed successfully',
          originalSize: `${originalSizeKb} KB`,
          compressedSize: `${compressedSizeKb} KB`,
          compressionRatio: compressionRatio,
          originalFilename: file.originalname,
        });
        
        // Clean up files after sending the response
        this.pdfService.cleanupFile(compressedPdfPath);
        this.pdfService.cleanupFile(file.path);
      } else {
        // Calculate a more precise compression ratio with 1 decimal place
        const preciseCompressionRatio = parseFloat(((1 - (compressedFileStats.size / originalFileStats.size)) * 100).toFixed(1));
        
        // Generate a unique ID for tracking this compression result
        const compressionId = uuidv4();
        
        // Store stats for frontend retrieval
        const stats = {
          id: compressionId,
          originalSize: originalFileStats.size,
          compressedSize: compressedFileStats.size,
          compressionRatio: preciseCompressionRatio,
          compressionLevel: compressOptionsDto.imageCompression || 'medium',
          timestamp: new Date().toISOString()
        };
        
        // Store stats for API access
        PdfCompressionStatsController.storeStats(compressionId, stats);
        
        // Stream the compressed PDF as response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('X-Compression-Stats-URL', `/api/pdf/compression-stats/${compressionId}`);
        res.setHeader('X-Compression-Id', compressionId);
        res.setHeader('X-Compression-Ratio', preciseCompressionRatio.toString());
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="compressed-${file.originalname || 'document.pdf'}"`,
        );
        
        const fileStream = createReadStream(compressedPdfPath);
        fileStream.pipe(res);
        
        // Clean up after streaming
        fileStream.on('end', () => {
          this.pdfService.cleanupFile(compressedPdfPath);
          this.pdfService.cleanupFile(file.path);
        });
      }
    } catch (error) {
      // Clean up on error
      if (file && file.path) {
        this.pdfService.cleanupFile(file.path);
      }
      throw error;
    }
  }

  /**
   * Analyze a PDF file and provide compression recommendations
   */
  @Post('analyze')
  @ApiOperation({ 
    summary: 'Analyze a PDF file and provide compression recommendations',
    description: 'Analyzes PDF structure and suggests optimizations that could reduce file size.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'PDF file to analyze',
    type: FileUploadDto,
  })
  @ApiResponse({
    status: 200,
    description: 'PDF analysis complete',
    type: CompressionAnalysis,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or no file uploaded' })
  @ApiResponse({ status: 500, description: 'Failed to analyze PDF' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async analyzePdfCompression(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    try {
      // Get file size
      const fileStats = statSync(file.path);
      const fileSizeKb = Math.round(fileStats.size / 1024);
      
      // Use our analysis utility
      const analysis = await this.pdfService.analyzePdfCompression(file.path);
      
      // Return analysis
      res.json({
        fileSize: `${fileSizeKb} KB`,
        pageCount: analysis.pageCount,
        hasImages: analysis.hasImages || false,
        estimatedImageSize: analysis.estimatedImageSize || 'Unknown',
        hasFormFields: analysis.hasFormFields || false,
        recommendations: analysis.recommendations || [],
        estimatedSavings: `${analysis.potentialSavings || 0}-${Math.min(analysis.potentialSavings + 10 || 5, 95)}%`,
        metadata: analysis.hasMetadata ? 'Present' : 'None detected'
      });
      
      // Clean up
      this.pdfService.cleanupFile(file.path);
    } catch (error) {
      // Clean up on error
      if (file && file.path) {
        this.pdfService.cleanupFile(file.path);
      }
      throw error;
    }
  }
}