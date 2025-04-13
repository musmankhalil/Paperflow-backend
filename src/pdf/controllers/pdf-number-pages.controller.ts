import {
  Controller,
  Post,
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
import { PdfService } from '../pdf.service';
import { PageNumberOptionsDto } from '../dto/page-number-options.dto';
import { multerConfig } from '../multer.config';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiProduces,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('pdf-number-pages')
@Controller('pdf/number-pages')
export class PdfNumberPagesController {
  constructor(private readonly pdfService: PdfService) {}

  /**
   * Add page numbers to a PDF document
   */
  @Post()
  @ApiOperation({ summary: 'Add page numbers to a PDF document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'PDF file and page numbering options',
    schema: {
      type: 'object',
      required: ['file', 'position'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        position: {
          type: 'string',
          enum: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'],
          example: 'bottom-center',
        },
        startNumber: {
          type: 'number',
          example: 1,
        },
        prefix: {
          type: 'string',
          example: 'Page ',
        },
        suffix: {
          type: 'string',
          example: ' of 10',
        },
        fontSize: {
          type: 'number',
          example: 12,
        },
        opacity: {
          type: 'number',
          example: 1.0,
        },
        fontColor: {
          type: 'object',
          properties: {
            r: { type: 'number', example: 0 },
            g: { type: 'number', example: 0 },
            b: { type: 'number', example: 0 },
          },
        },
        margin: {
          type: 'number',
          example: 25,
        },
        skipFirstPage: {
          type: 'boolean',
          example: false,
        },
        skipLastPage: {
          type: 'boolean',
          example: false,
        },
        pageRange: {
          type: 'object',
          properties: {
            start: { type: 'number', example: 1 },
            end: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Page numbers added successfully',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or no file uploaded' })
  @ApiResponse({ status: 500, description: 'Failed to add page numbers' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async addPageNumbers(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    if (!body.position) {
      throw new HttpException(
        'Page number position is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    
    // Convert form data fields to appropriate types
    const pageNumberOptionsDto: PageNumberOptionsDto = {
      position: body.position,
      startNumber: body.startNumber ? parseInt(body.startNumber, 10) : 1,
      prefix: body.prefix,
      suffix: body.suffix,
      fontSize: body.fontSize ? parseInt(body.fontSize, 10) : 12,
      opacity: body.opacity ? parseFloat(body.opacity) : 1.0,
      margin: body.margin ? parseInt(body.margin, 10) : 25,
      skipFirstPage: body.skipFirstPage === 'true',
      skipLastPage: body.skipLastPage === 'true',
    };
    
    // Handle font color object
    if (body.fontColor) {
      try {
        pageNumberOptionsDto.fontColor = typeof body.fontColor === 'string' 
          ? JSON.parse(body.fontColor) 
          : body.fontColor;
      } catch (e) {
        console.error('Error parsing fontColor:', e);
      }
    }
    
    // Handle page range
    if (body.pageRange) {
      try {
        pageNumberOptionsDto.pageRange = typeof body.pageRange === 'string'
          ? JSON.parse(body.pageRange)
          : body.pageRange;
      } catch (e) {
        console.error('Error parsing pageRange:', e);
      }
    }
    
    try {
      const numberedPdfPath = await this.pdfService.addPageNumbers(
        file.path,
        pageNumberOptionsDto,
      );
      
      // Stream the numbered PDF as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="numbered_pages.pdf"`,
      );
      
      const fileStream = createReadStream(numberedPdfPath);
      fileStream.pipe(res);
      
      // Clean up after streaming
      fileStream.on('end', () => {
        this.pdfService.cleanupFile(numberedPdfPath);
        this.pdfService.cleanupFile(file.path);
      });
    } catch (error) {
      // Clean up on error
      if (file && file.path) {
        this.pdfService.cleanupFile(file.path);
      }
      throw error;
    }
  }
}
