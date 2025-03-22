import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Body,
  Res,
  HttpStatus,
  ValidationPipe,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { PdfService } from '../services/pdf.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { existsSync } from 'fs';
import { ConvertToXlsxDto, TableExtractionMode, DataRecognitionLevel, SpreadsheetFormat } from '../dto/convert-to-xlsx.dto';
import * as path from 'path';

@ApiTags('PDF to XLSX Conversion')
@Controller('pdf/convert')
export class PdfToXlsxController {
  constructor(private readonly pdfService: PdfService) {}

  @ApiOperation({ summary: 'Convert PDF to XLSX with basic settings' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to convert to XLSX format',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PDF converted to XLSX successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  @Post('to-xlsx/basic')
  @UseInterceptors(FileInterceptor('file'))
  async convertPdfToXlsxBasic(
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
      const convertedFilePath = await this.pdfService.convertPdfToXlsxBasic(file.path);

      // Get file info
      const fileInfo = await this.pdfService.getPdfInfo(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'PDF successfully converted to XLSX',
        convertedFilePath: path.basename(convertedFilePath),
        originalFileInfo: fileInfo,
      });
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

  @ApiOperation({ summary: 'Convert PDF to XLSX with advanced settings' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to convert to XLSX format',
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
    description: 'PDF converted to XLSX successfully with advanced options',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or options' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  @Post('to-xlsx/advanced')
  @UseInterceptors(FileInterceptor('file'))
  async convertPdfToXlsxAdvanced(
    @UploadedFile() file: Express.Multer.File,
    @Body('options', new ValidationPipe({ transform: true })) options: ConvertToXlsxDto,
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

      // Convert the PDF to XLSX with advanced options
      const convertedFilePath = await this.pdfService.convertPdfToXlsxAdvanced(
        file.path,
        options,
      );

      // Get file info
      const fileInfo = await this.pdfService.getPdfInfo(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'PDF successfully converted to XLSX with advanced options',
        convertedFilePath: path.basename(convertedFilePath),
        originalFileInfo: fileInfo,
        appliedOptions: options,
      });
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

  @ApiOperation({ summary: 'Analyze PDF for table extraction compatibility' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to analyze for XLSX conversion compatibility',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PDF analysis completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @Post('to-xlsx/analyze')
  @UseInterceptors(FileInterceptor('file'))
  async analyzePdfForXlsxConversion(
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

      // Analyze the PDF for table extraction compatibility
      const analysis = await this.pdfService.analyzePdfForXlsxConversion(file.path);

      // Get file info
      const fileInfo = await this.pdfService.getPdfInfo(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'PDF analysis completed',
        fileName: file.originalname,
        fileInfo,
        tableAnalysis: analysis,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Analysis failed: ${error.message || 'Unknown error'}`,
      });
    }
  }

  @ApiOperation({ summary: 'Check available PDF to XLSX conversion tools' })
  @ApiResponse({
    status: 200,
    description: 'Tool availability check completed',
  })
  @Get('to-xlsx/tools')
  async checkXlsxConversionTools(@Res() res: Response) {
    try {
      const toolsAvailability = await this.pdfService.checkXlsxConversionTools();

      return res.status(HttpStatus.OK).json({
        message: 'Tool availability check completed',
        availableTools: toolsAvailability,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Tool check failed: ${error.message || 'Unknown error'}`,
      });
    }
  }

  @ApiOperation({ summary: 'Download a converted XLSX file' })
  @ApiParam({
    name: 'filename',
    description: 'The filename of the converted XLSX file to download',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'XLSX file downloaded successfully',
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Get('to-xlsx/download/:filename')
  async downloadConvertedXlsxFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
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
