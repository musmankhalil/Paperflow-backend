import {
  Controller,
  Post,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream } from 'fs';
import * as path from 'path';
import { PdfService } from '../pdf.service';
import { SplitOptionsDto, SplitMode } from '../dto/split-options.dto';
import { createZipFromFiles } from '../utils/zip.utils';
import { multerConfig } from '../multer.config';
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

class SplitPdfResponse {
  @ApiProperty({ example: 'PDF split successfully' })
  message: string;

  @ApiProperty({ example: 5 })
  pages: number;

  @ApiProperty({ example: ['page-1-1616233333.pdf', 'page-2-1616233333.pdf'] })
  paths: string[];
}

class SplitPdfPartInfo {
  @ApiProperty({ example: 'chapter-1-1616233333.pdf' })
  filename: string;

  @ApiProperty({ example: '425 KB' })
  size: string;

  @ApiProperty({ example: 5 })
  pageCount: number;

  @ApiProperty({ example: [1, 2, 3, 4, 5] })
  pages: number[];
}

class SplitPdfAdvancedResponse {
  @ApiProperty({ example: 'PDF split successfully with advanced options' })
  message: string;

  @ApiProperty({ example: 3, description: 'Number of PDF parts created' })
  parts: number;

  @ApiProperty({ 
    example: ['chapter-1-1616233333.pdf', 'chapter-2-1616233333.pdf', 'chapter-3-1616233333.pdf'],
    description: 'Filenames of the created PDF parts'
  })
  paths: string[];
  
  @ApiProperty({
    type: [SplitPdfPartInfo],
    description: 'Detailed information about each split part',
    required: false
  })
  partInfo?: SplitPdfPartInfo[];
}

class PageRangeDto {
  @ApiProperty({ example: 1, description: 'Start page (inclusive)' })
  start: number;

  @ApiProperty({ example: 5, description: 'End page (inclusive)' })
  end: number;
}

@ApiTags('pdf-split')
@Controller('pdf/split')
export class PdfSplitController {
  constructor(private readonly pdfService: PdfService) {}

  /**
   * Upload a PDF file and split it into individual pages
   */
  @Post()
  @ApiOperation({ 
    summary: 'Split a PDF file into individual pages',
    description: 'Splits a PDF into individual pages. Add ?download=zip query parameter to receive a ZIP file with all pages.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'PDF file to split',
    type: FileUploadDto,
  })
  @ApiProduces('application/json', 'application/zip')
  @ApiResponse({
    status: 200,
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(SplitPdfResponse) }
      },
      'application/zip': {
        schema: {
          type: 'string',
          format: 'binary',
          description: 'ZIP file containing all split PDF pages'
        }
      }
    }
  })
  @ApiQuery({
    name: 'download',
    required: false,
    type: String,
    enum: ['zip'],
    description: 'If set to "zip", returns a ZIP file with all split PDFs instead of JSON response'
  })
  @ApiResponse({ status: 400, description: 'Invalid input or no file uploaded' })
  @ApiResponse({ status: 500, description: 'Failed to split PDF' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async splitPdf(
    @UploadedFile() file: Express.Multer.File,
    @Query('download') download: string,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    try {
      const splitPdfPaths = await this.pdfService.splitPdf(file.path);
      
      // If download=zip parameter is provided, create and return ZIP file
      if (download === 'zip' && splitPdfPaths.length > 0) {
        const timestamp = Date.now();
        const zipFilePath = path.join(this.pdfService.getUploadsDir(), `split-pages-${timestamp}.zip`);
        
        try {
          // Get detailed info about each split part
          const partInfoPromises = splitPdfPaths.map(async (path) => {
            const filename = path.split('/').pop() || '';
            const { size, pageCount } = await this.pdfService.getPdfInfo(path);
            
            // Extract page number from filename
            const pageMatch = filename.match(/page-(\d+)-/);
            const pageNumber = pageMatch ? parseInt(pageMatch[1]) : 0;
            
            return {
              filename,
              size,
              pageCount,
              pageNumber
            };
          });
          
          const partInfo = await Promise.all(partInfoPromises);
          
          // Create metadata for the ZIP manifest
          const metadata = {
            createdAt: new Date().toISOString(),
            originalFile: file.originalname,
            originalSize: `${Math.round(file.size / 1024)} KB`,
            totalPages: splitPdfPaths.length,
            parts: partInfo
          };
          
          // Create ZIP file with all split PDFs and the metadata
          await createZipFromFiles(splitPdfPaths, zipFilePath, metadata);
          
          // Stream the ZIP file to client
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="split-pages.zip"`,
          );
          
          const fileStream = createReadStream(zipFilePath);
          fileStream.pipe(res);
          
          // Clean up after streaming
          fileStream.on('end', () => {
            // Clean up ZIP file
            this.pdfService.cleanupFile(zipFilePath);
            
            // Clean up split PDF files
            splitPdfPaths.forEach(path => this.pdfService.cleanupFile(path));
            
            // Clean up original PDF
            this.pdfService.cleanupFile(file.path);
          });
        } catch (zipError) {
          console.error('Failed to create ZIP file:', zipError);
          
          // Fallback to JSON response
          res.setHeader('Content-Type', 'application/json');
          res.json({
            message: 'PDF split successfully, but failed to create ZIP file',
            pages: splitPdfPaths.length,
            paths: splitPdfPaths.map(p => p.split('/').pop()),
          });
        }
      } else {
        // Return JSON with file paths
        res.setHeader('Content-Type', 'application/json');
        res.json({
          message: 'PDF split successfully',
          pages: splitPdfPaths.length,
          paths: splitPdfPaths.map(p => p.split('/').pop()),
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
   * Split a PDF file with advanced options
   */
  @Post('advanced')
  @ApiOperation({ 
    summary: 'Split a PDF file with advanced options',
    description: 'Splits a PDF using advanced options. Add ?download=zip query parameter to receive a ZIP file with all split files.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiProduces('application/json', 'application/zip')
  @ApiQuery({
    name: 'download',
    required: false,
    type: String,
    enum: ['zip'],
    description: 'If set to "zip", returns a ZIP file with all split PDFs instead of JSON response'
  })
  @ApiBody({
    description: 'PDF file to split with options',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        mode: {
          type: 'string',
          enum: Object.values(SplitMode),
          default: SplitMode.PAGES,
          description: 'Mode to use for splitting the PDF',
        },
        pages: {
          type: 'array',
          items: {
            type: 'number',
          },
          description: 'Split at these specific page numbers (1-based)',
          example: [3, 5, 8],
        },
        ranges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              start: {
                type: 'number',
                example: 1,
              },
              end: {
                type: 'number',
                example: 5,
              },
            },
          },
          description: 'Array of page ranges to extract as separate PDFs',
          example: [{ start: 1, end: 5 }, { start: 6, end: 10 }],
        },
        everyNPages: {
          type: 'number',
          description: 'Split every N pages (used with everyNPages mode)',
          example: 2,
        },
        preserveBookmarks: {
          type: 'boolean',
          description: 'Whether to include bookmark information in split PDFs (if available)',
          example: true,
        },
        filenamePrefix: {
          type: 'string',
          description: 'Prefix for output filenames',
          example: 'chapter',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(SplitPdfAdvancedResponse) }
      },
      'application/zip': {
        schema: {
          type: 'string',
          format: 'binary',
          description: 'ZIP file containing all split PDF files'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input or no file uploaded' })
  @ApiResponse({ status: 500, description: 'Failed to split PDF' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async splitPdfAdvanced(
    @UploadedFile() file: Express.Multer.File,
    @Body() splitOptionsDto: SplitOptionsDto,
    @Query('download') download: string,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    try {
      const splitPdfPaths = await this.pdfService.splitPdfAdvanced(file.path, splitOptionsDto);
      
      // If download=zip parameter is provided, create and return ZIP file
      if (download === 'zip' && splitPdfPaths.length > 0) {
        const timestamp = Date.now();
        const prefix = splitOptionsDto.filenamePrefix || 'split';
        const zipFilePath = path.join(this.pdfService.getUploadsDir(), `${prefix}-${timestamp}.zip`);
        
        try {
          // Get detailed info about each split part
          const partInfoPromises = splitPdfPaths.map(async (path) => {
            const filename = path.split('/').pop();
            const { size, pageCount } = await this.pdfService.getPdfInfo(path);
            
            return {
              filename,
              size,
              pageCount,
            };
          });
          
          const partInfo = await Promise.all(partInfoPromises);
          
          // Create metadata for the ZIP manifest
          const metadata = {
            createdAt: new Date().toISOString(),
            originalFile: file.originalname,
            originalSize: `${Math.round(file.size / 1024)} KB`,
            splitMode: splitOptionsDto.mode || 'default',
            totalParts: splitPdfPaths.length,
            parts: partInfo
          };
          
          // Create ZIP file with all split PDFs and the metadata
          await createZipFromFiles(splitPdfPaths, zipFilePath, metadata);
          
          // Stream the ZIP file to client
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${prefix}-files.zip"`,
          );
          
          const fileStream = createReadStream(zipFilePath);
          fileStream.pipe(res);
          
          // Clean up after streaming
          fileStream.on('end', () => {
            // Clean up ZIP file
            this.pdfService.cleanupFile(zipFilePath);
            
            // Clean up split PDF files
            splitPdfPaths.forEach(path => this.pdfService.cleanupFile(path));
            
            // Clean up original PDF
            this.pdfService.cleanupFile(file.path);
          });
        } catch (zipError) {
          console.error('Failed to create ZIP file:', zipError);
          
          // Fallback to JSON response
          res.setHeader('Content-Type', 'application/json');
          res.json({
            message: 'PDF split successfully, but failed to create ZIP file',
            parts: splitPdfPaths.length,
            paths: splitPdfPaths.map(p => p.split('/').pop()),
          });
        }
      } else {
        // Return JSON with file paths and detailed info
        try {
          // Get detailed info about each split part
          const partInfoPromises = splitPdfPaths.map(async (path) => {
            const filename = path.split('/').pop() || '';
            const { size, pageCount } = await this.pdfService.getPdfInfo(path);
            
            // For simplicity, we're including a page range based on filename pattern
            // In a real implementation, you would track which pages went into each file
            const pageNumbers: number[] = [];
            const match = filename.match(/part(\d+)-/);
            if (match) {
              const partNumber = parseInt(match[1]);
              // Create an array of page numbers
              const pageIndices = Array.from({ length: pageCount }, (_, i) => i + 1);
              // Add all page indices to the pageNumbers array
              pageIndices.forEach(index => pageNumbers.push(index));
            }
            
            return {
              filename,
              size,
              pageCount,
              pages: pageNumbers.length > 0 ? pageNumbers : Array.from({ length: pageCount }, (_, i) => i + 1)
            };
          });
          
          const partInfo = await Promise.all(partInfoPromises);
          
          res.setHeader('Content-Type', 'application/json');
          res.json({
            message: 'PDF split successfully with advanced options',
            parts: splitPdfPaths.length,
            paths: splitPdfPaths.map(p => p.split('/').pop()),
            partInfo
          });
        } catch (infoError) {
          // Fallback to basic info if we can't get detailed info
          console.error('Error getting detailed file info:', infoError);
          res.setHeader('Content-Type', 'application/json');
          res.json({
            message: 'PDF split successfully with advanced options',
            parts: splitPdfPaths.length,
            paths: splitPdfPaths.map(p => p.split('/').pop()),
          });
        }
      }
    } catch (error) {
      // Clean up on error
      if (file && file.path) {
        this.pdfService.cleanupFile(file.path);
      }
      throw error;
    }
  }
}