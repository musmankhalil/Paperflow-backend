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
import { WatermarkOptionsDto, WatermarkType } from '../dto/watermark-options.dto';
import { multerConfig } from '../multer.config';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiProduces,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('pdf-watermark')
@Controller('pdf/watermark')
export class PdfWatermarkController {
  constructor(private readonly pdfService: PdfService) {}

  /**
   * Add watermark to a PDF document
   */
  @Post()
  @ApiOperation({ summary: 'Add watermark to a PDF document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'PDF file and watermark options',
    schema: {
      type: 'object',
      required: ['file', 'type', 'position'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: ['text', 'image'],
          example: 'text',
        },
        text: {
          type: 'string',
          example: 'CONFIDENTIAL',
        },
        position: {
          type: 'string',
          enum: ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'],
          example: 'center',
        },
        fontSize: {
          type: 'number',
          example: 48,
        },
        opacity: {
          type: 'number',
          example: 0.3,
        },
        color: {
          type: 'object',
          properties: {
            r: { type: 'number', example: 0 },
            g: { type: 'number', example: 0 },
            b: { type: 'number', example: 0 },
          },
        },
        rotation: {
          type: 'number',
          example: 45,
        },
        allPages: {
          type: 'boolean',
          example: true,
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
    description: 'Watermark added successfully',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or no file uploaded' })
  @ApiResponse({ status: 500, description: 'Failed to add watermark' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async addWatermark(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    if (!body.type || !body.position) {
      throw new HttpException(
        'Watermark type and position are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    
    // For text watermarks, text content is required
    if (body.type === WatermarkType.TEXT && !body.text) {
      throw new HttpException(
        'Text content is required for text watermarks',
        HttpStatus.BAD_REQUEST,
      );
    }
    
    // Convert form data fields to appropriate types
    const watermarkOptionsDto: WatermarkOptionsDto = {
      type: body.type,
      text: body.text,
      position: body.position,
      fontSize: body.fontSize ? parseInt(body.fontSize, 10) : 48,
      opacity: body.opacity ? parseFloat(body.opacity) : 0.3,
      rotation: body.rotation ? parseInt(body.rotation, 10) : 45,
      allPages: body.allPages === 'true',
    };
    
    // Handle color object
    if (body.color) {
      try {
        watermarkOptionsDto.color = typeof body.color === 'string' 
          ? JSON.parse(body.color) 
          : body.color;
      } catch (e) {
        console.error('Error parsing color:', e);
      }
    }
    
    // Handle page range
    if (body.pageRange) {
      try {
        watermarkOptionsDto.pageRange = typeof body.pageRange === 'string'
          ? JSON.parse(body.pageRange)
          : body.pageRange;
      } catch (e) {
        console.error('Error parsing pageRange:', e);
      }
    }
    
    try {
      const watermarkedPdfPath = await this.pdfService.addWatermark(
        file.path,
        watermarkOptionsDto,
      );
      
      // Stream the watermarked PDF as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="watermarked.pdf"`,
      );
      
      const fileStream = createReadStream(watermarkedPdfPath);
      fileStream.pipe(res);
      
      // Clean up after streaming
      fileStream.on('end', () => {
        this.pdfService.cleanupFile(watermarkedPdfPath);
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