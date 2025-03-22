import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Res,
  HttpStatus,
  Get,
  Param,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { PdfService } from '../services/pdf.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { existsSync, readFileSync } from 'fs';
import { ConvertToWordDto } from '../dto/convert-to-word.dto';
import * as path from 'path';

@ApiTags('PDF Conversion')
@Controller('pdf/convert')
export class PdfConvertController {
  constructor(private readonly pdfService: PdfService) {}

  @ApiOperation({ summary: 'Convert PDF to Word (DOCX) with basic settings' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to convert to Word format',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PDF converted to Word document successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  @Post('to-word/basic')
  @UseInterceptors(FileInterceptor('file'))
  async convertPdfToWordBasic(
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

      // Convert the PDF to Word
      const convertedFilePath = await this.pdfService.convertPdfToWordBasic(file.path);

      // Get file info
      const fileInfo = await this.pdfService.getPdfInfo(file.path);

      // Send the actual file instead of just the path info
      if (existsSync(convertedFilePath)) {
        const docxBuffer = existsSync(convertedFilePath) ? readFileSync(convertedFilePath) : Buffer.from('');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=${path.basename(convertedFilePath)}`);
        return res.send(docxBuffer);
      } else {
        return res.status(HttpStatus.OK).json({
          message: 'PDF successfully converted to Word document',
          convertedFilePath: path.basename(convertedFilePath),
          originalFileInfo: fileInfo,
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Conversion failed: ${error.message || 'Unknown error'}`,
      });
    }
  }

  @ApiOperation({ summary: 'Convert PDF to Word (DOCX) with advanced settings' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to convert to Word format',
        },
        options: {
          type: 'object',
          description: 'Advanced conversion options',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PDF converted to Word document successfully with advanced options',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or options' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  @Post('to-word/advanced')
  @UseInterceptors(FileInterceptor('file'))
  async convertPdfToWordAdvanced(
    @UploadedFile() file: Express.Multer.File,
    @Body('options', new ValidationPipe({ transform: true })) options: ConvertToWordDto,
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

      // Convert the PDF to Word with advanced options
      const convertedFilePath = await this.pdfService.convertPdfToWordAdvanced(
        file.path,
        options,
      );

      // Get file info
      const fileInfo = await this.pdfService.getPdfInfo(file.path);

      // Send the actual file instead of just the path info
      if (existsSync(convertedFilePath)) {
        const docxBuffer = readFileSync(convertedFilePath);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=${path.basename(convertedFilePath)}`);
        return res.send(docxBuffer);
      } else {
        return res.status(HttpStatus.OK).json({
          message: 'PDF successfully converted to Word document with advanced options',
          convertedFilePath: path.basename(convertedFilePath),
          originalFileInfo: fileInfo,
          appliedOptions: options,
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Advanced conversion failed: ${error.message || 'Unknown error'}`,
      });
    }
  }

  @ApiOperation({ summary: 'Download a converted Word document' })
  @ApiResponse({
    status: 200,
    description: 'Word document downloaded successfully',
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Get('download/:filename')
  async downloadConvertedFile(@Res() res: Response, @Param('filename') filename: string) {
    try {
      const filePath = this.pdfService.getFilePath(filename);

      if (!existsSync(filePath)) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'File not found',
        });
      }

      return res.download(filePath);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Download failed: ${error.message || 'Unknown error'}`,
      });
    }
  }
}
