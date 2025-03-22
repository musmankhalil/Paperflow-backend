import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { PdfXlsxService } from './pdf-xlsx.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('PDF to XLSX Conversion')
@Controller('pdf-xlsx')
export class PdfXlsxController {
  constructor(private readonly pdfXlsxService: PdfXlsxService) {}

  @ApiOperation({ summary: 'Convert PDF to XLSX' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to convert',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'PDF successfully converted to XLSX' })
  @ApiResponse({ status: 400, description: 'Bad request or invalid file format' })
  @Post('convert')
  @UseInterceptors(FileInterceptor('file'))
  async convertPdfToXlsx(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file is a PDF
      if (!file.mimetype || !file.mimetype.includes('pdf')) {
        throw new BadRequestException('Uploaded file must be a PDF');
      }

      // Convert the PDF to XLSX
      const result = await this.pdfXlsxService.convertPdfToXlsx(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'PDF successfully converted to XLSX',
        data: result,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'An error occurred during conversion',
      });
    }
  }

  @ApiOperation({ summary: 'Get conversion status' })
  @ApiParam({
    name: 'id',
    description: 'Conversion job ID',
    type: 'string',
  })
  @ApiResponse({ status: 200, description: 'Conversion status retrieved' })
  @Get('status/:id')
  async getConversionStatus(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      // This is a placeholder - you'd implement actual status tracking in a real app
      return res.status(HttpStatus.OK).json({
        id,
        status: 'completed',
        message: 'Conversion completed successfully',
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'An error occurred while retrieving status',
      });
    }
  }
}
