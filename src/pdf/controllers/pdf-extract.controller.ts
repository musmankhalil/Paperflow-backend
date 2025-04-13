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
import { ExtractPagesDto } from '../dto/extract-pages.dto';
import { multerConfig } from '../multer.config';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiProduces,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('pdf-extract')
@Controller('pdf/extract')
export class PdfExtractController {
  constructor(private readonly pdfService: PdfService) {}

  /**
   * Extract specific pages from a PDF file
   */
  @Post('pages')
  @ApiOperation({ summary: 'Extract specific pages from a PDF file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'PDF file and page numbers to extract',
    schema: {
      type: 'object',
      required: ['file', 'pages'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        pages: {
          type: 'array',
          items: {
            type: 'number',
          },
          example: [1, 3, 5],
        },
      },
    },
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Pages extracted successfully',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or no file uploaded' })
  @ApiResponse({ status: 500, description: 'Failed to extract pages' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async extractPages(
    @UploadedFile() file: Express.Multer.File,
    @Body() extractPagesDto: ExtractPagesDto,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    if (!extractPagesDto.pages || extractPagesDto.pages.length === 0) {
      throw new HttpException(
        'Page numbers are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    
    try {
      const extractedPdfPath = await this.pdfService.extractPages(
        file.path,
        extractPagesDto.pages,
      );
      
      // Stream the extracted PDF as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="extracted_pages.pdf"`,
      );
      
      const fileStream = createReadStream(extractedPdfPath);
      fileStream.pipe(res);
      
      // Clean up after streaming
      fileStream.on('end', () => {
        this.pdfService.cleanupFile(extractedPdfPath);
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