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
import { PdfService } from '../services/pdf.service';
import { RotatePagesDto } from '../dto/rotate-pages.dto';
import { multerConfig } from '../multer.config';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiProduces,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('pdf-rotate')
@Controller('pdf/rotate')
export class PdfRotateController {
  constructor(private readonly pdfService: PdfService) {}

  /**
   * Rotate pages in a PDF file
   */
  @Post()
  @ApiOperation({ summary: 'Rotate specific pages in a PDF file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'PDF file and rotation instructions',
    schema: {
      type: 'object',
      required: ['file', 'rotations'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        rotations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                example: 1,
              },
              degrees: {
                type: 'number',
                example: 90,
              },
            },
          },
          example: [
            { page: 1, degrees: 90 },
            { page: 2, degrees: 180 },
          ],
        },
      },
    },
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Pages rotated successfully',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or no file uploaded' })
  @ApiResponse({ status: 500, description: 'Failed to rotate pages' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async rotatePdf(
    @UploadedFile() file: Express.Multer.File,
    @Body() rotatePagesDto: RotatePagesDto,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    if (!rotatePagesDto.rotations || rotatePagesDto.rotations.length === 0) {
      throw new HttpException(
        'Rotation instructions are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    
    try {
      const rotatedPdfPath = await this.pdfService.rotatePdfPages(
        file.path,
        rotatePagesDto.rotations,
      );
      
      // Stream the rotated PDF as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="rotated.pdf"`,
      );
      
      const fileStream = createReadStream(rotatedPdfPath);
      fileStream.pipe(res);
      
      // Clean up after streaming
      fileStream.on('end', () => {
        this.pdfService.cleanupFile(rotatedPdfPath);
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