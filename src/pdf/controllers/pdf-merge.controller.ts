import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { PdfService } from '../pdf.service';
import { MergeOptionsDto } from '../dto/merge-options.dto';
import { multipleFilesConfig } from '../multer.config';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiProduces,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('pdf-merge')
@Controller('pdf/merge')
export class PdfMergeController {
  constructor(private readonly pdfService: PdfService) {}

  /**
   * Upload multiple PDF files and merge them
   */
  @Post()
  @ApiOperation({ summary: 'Merge multiple PDF files into one' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Multiple PDF files to merge with optional merge configuration',
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        options: {
          type: 'object',
          properties: {
            documentInfo: {
              type: 'object',
              properties: {
                title: { type: 'string', example: 'Merged Document' },
                author: { type: 'string', example: 'PaperFlow API' },
                subject: { type: 'string', example: 'Merged PDFs' },
                keywords: { type: 'string', example: 'merged, pdf, documents' },
              },
            },
            addBookmarks: { type: 'boolean', example: true },
            fileOrder: { 
              type: 'array', 
              items: { type: 'number' },
              example: [0, 2, 1],
              description: 'Order of files to merge (0-based indices)'
            },
          },
        },
      },
    },
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF files merged successfully',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or not enough files uploaded' })
  @ApiResponse({ status: 500, description: 'Failed to merge PDF files' })
  @UseInterceptors(FilesInterceptor('files', 10, multipleFilesConfig))
  async mergePdfs(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() options: MergeOptionsDto,
    @Res() res: Response,
  ) {
    if (!files || files.length < 2) {
      throw new HttpException(
        'At least two PDF files are required for merging',
        HttpStatus.BAD_REQUEST,
      );
    }
    
    try {
      const filePaths = files.map(file => file.path);
      const mergedPdfPath = await this.pdfService.mergePdfs(filePaths, options);
      
      // Stream the merged PDF as a response
      if (existsSync(mergedPdfPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="merged.pdf"`,
        );
        
        const fileStream = createReadStream(mergedPdfPath);
        fileStream.pipe(res);
        
        // Clean up after streaming
        fileStream.on('end', () => {
          this.pdfService.cleanupFile(mergedPdfPath);
          // Clean up original files
          filePaths.forEach(path => this.pdfService.cleanupFile(path));
        });
      } else {
        throw new HttpException('Failed to create merged PDF', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      // Clean up all files on error
      if (files) {
        files.forEach(file => this.pdfService.cleanupFile(file.path));
      }
      throw error;
    }
  }

  /**
   * Upload multiple PDF files and merge them with advanced options
   */
  @Post('advanced')
  @ApiOperation({ summary: 'Merge PDFs with advanced options' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Multiple PDF files to merge with advanced configuration',
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        documentInfo: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Merged Document' },
            author: { type: 'string', example: 'PaperFlow API' },
            subject: { type: 'string', example: 'Merged PDFs' },
            keywords: { type: 'string', example: 'merged, pdf, documents' },
          },
        },
        addBookmarks: { type: 'boolean', example: true },
        bookmarks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', example: 'First Document' },
              pageNumber: { type: 'number', example: 1 },
            },
          },
        },
        fileOrder: { 
          type: 'array',
          items: { type: 'number' },
          example: [0, 2, 1],
          description: 'Order of files to merge (0-based indices)'
        },
      },
    },
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF files merged successfully with advanced options',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or not enough files uploaded' })
  @ApiResponse({ status: 500, description: 'Failed to merge PDF files' })
  @UseInterceptors(FilesInterceptor('files', 10, multipleFilesConfig))
  async mergePdfsAdvanced(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() mergeOptions: MergeOptionsDto,
    @Res() res: Response,
  ) {
    if (!files || files.length < 2) {
      throw new HttpException(
        'At least two PDF files are required for merging',
        HttpStatus.BAD_REQUEST,
      );
    }
    
    try {
      const filePaths = files.map(file => file.path);
      const mergedPdfPath = await this.pdfService.mergePdfs(filePaths, mergeOptions);
      
      // Stream the merged PDF as a response
      if (existsSync(mergedPdfPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="merged.pdf"`,
        );
        
        const fileStream = createReadStream(mergedPdfPath);
        fileStream.pipe(res);
        
        // Clean up after streaming
        fileStream.on('end', () => {
          this.pdfService.cleanupFile(mergedPdfPath);
          // Clean up original files
          filePaths.forEach(path => this.pdfService.cleanupFile(path));
        });
      } else {
        throw new HttpException('Failed to create merged PDF', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      // Clean up all files on error
      if (files) {
        files.forEach(file => this.pdfService.cleanupFile(file.path));
      }
      throw error;
    }
  }
}