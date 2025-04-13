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
    @Body() body: any,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    // Parse rotations from form data
    let rotations;
    try {
      if (typeof body.rotations === 'string') {
        rotations = JSON.parse(body.rotations);
      } else {
        rotations = body.rotations;
      }
      
      // Validate rotations
      if (!Array.isArray(rotations) || rotations.length === 0) {
        throw new HttpException(
          'Rotation instructions are required',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      // Validate each rotation entry
      for (const rotation of rotations) {
        if (typeof rotation !== 'object' || rotation === null) {
          throw new HttpException(
            'Invalid rotation format',
            HttpStatus.BAD_REQUEST,
          );
        }
        
        if (!Number.isInteger(Number(rotation.page)) || Number(rotation.page) < 1) {
          throw new HttpException(
            `Page number must be at least 1`,
            HttpStatus.BAD_REQUEST,
          );
        }
        
        if (!Number.isInteger(Number(rotation.degrees))) {
          throw new HttpException(
            'Degrees must be a number',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Invalid rotation data: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    
    try {
      // Convert string values to numbers
      const normalizedRotations = rotations.map(r => ({
        page: Number(r.page),
        degrees: Number(r.degrees)
      }));
      
      const rotatedPdfPath = await this.pdfService.rotatePdfPages(
        file.path,
        normalizedRotations,
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