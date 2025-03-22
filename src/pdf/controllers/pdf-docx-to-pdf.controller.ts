import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Res,
  HttpStatus,
  Get,
  ValidationPipe,
  Param,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { PdfService } from '../services/pdf.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { existsSync } from 'fs';
import { ConvertToPdfDto, PdfQuality, PdfCompliance } from '../dto/convert-to-pdf.dto';
import * as path from 'path';

@ApiTags('DOCX to PDF Conversion')
@Controller('pdf/docx-to-pdf')
export class PdfDocxToPdfController {
  constructor(private readonly pdfService: PdfService) {}

  @ApiOperation({ summary: 'Convert DOCX to PDF with basic settings' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'DOCX file to convert to PDF format',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'DOCX converted to PDF successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  @Post('basic')
  @UseInterceptors(FileInterceptor('file'))
  async convertDocxToPdfBasic(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file is a DOCX
      if (!file.mimetype || (
          !file.mimetype.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') &&
          !file.mimetype.includes('application/msword') &&
          !file.originalname.endsWith('.docx') && 
          !file.originalname.endsWith('.doc')
      )) {
        throw new BadRequestException('Uploaded file must be a Word Document (.docx or .doc)');
      }

      // Convert the DOCX to PDF
      const convertedFilePath = await this.pdfService.convertDocxToPdfBasic(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'DOCX successfully converted to PDF',
        convertedFilePath: path.basename(convertedFilePath),
        originalFilename: file.originalname,
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

  @ApiOperation({ summary: 'Convert DOCX to PDF with advanced settings' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'DOCX file to convert to PDF format',
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
    description: 'DOCX converted to PDF successfully with advanced options',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or options' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  @Post('advanced')
  @UseInterceptors(FileInterceptor('file'))
  async convertDocxToPdfAdvanced(
    @UploadedFile() file: Express.Multer.File,
    @Body('options', new ValidationPipe({ transform: true })) options: ConvertToPdfDto,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file is a DOCX
      if (!file.mimetype || (
          !file.mimetype.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') &&
          !file.mimetype.includes('application/msword') &&
          !file.originalname.endsWith('.docx') && 
          !file.originalname.endsWith('.doc')
      )) {
        throw new BadRequestException('Uploaded file must be a Word Document (.docx or .doc)');
      }

      // Convert the DOCX to PDF with advanced options
      const convertedFilePath = await this.pdfService.convertDocxToPdfAdvanced(
        file.path,
        options,
      );

      return res.status(HttpStatus.OK).json({
        message: 'DOCX successfully converted to PDF with advanced options',
        convertedFilePath: path.basename(convertedFilePath),
        originalFilename: file.originalname,
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

  @ApiOperation({ summary: 'Convert DOCX to PDF/A format (for archiving)' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'version',
    enum: ['1b', '2b', '3b'],
    description: 'PDF/A version to use',
    required: false,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'DOCX file to convert to PDF/A format',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'DOCX converted to PDF/A successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  @Post('pdfa')
  @UseInterceptors(FileInterceptor('file'))
  async convertDocxToPdfA(
    @UploadedFile() file: Express.Multer.File,
    @Query('version') version: '1b' | '2b' | '3b' = '1b',
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file is a DOCX
      if (!file.mimetype || (
          !file.mimetype.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') &&
          !file.mimetype.includes('application/msword') &&
          !file.originalname.endsWith('.docx') && 
          !file.originalname.endsWith('.doc')
      )) {
        throw new BadRequestException('Uploaded file must be a Word Document (.docx or .doc)');
      }

      // Validate version parameter
      if (version !== '1b' && version !== '2b' && version !== '3b') {
        version = '1b'; // Default to 1b if invalid
      }

      // Convert the DOCX to PDF/A
      const convertedFilePath = await this.pdfService.convertDocxToPdfA(file.path, version);

      return res.status(HttpStatus.OK).json({
        message: `DOCX successfully converted to PDF/A-${version}`,
        convertedFilePath: path.basename(convertedFilePath),
        originalFilename: file.originalname,
        pdfaVersion: version,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `PDF/A conversion failed: ${error.message || 'Unknown error'}`,
      });
    }
  }

  @ApiOperation({ summary: 'Generate a PDF preview from a DOCX file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'DOCX file to preview as PDF',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PDF preview generated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  async generatePreview(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file is a DOCX
      if (!file.mimetype || (
          !file.mimetype.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') &&
          !file.mimetype.includes('application/msword') &&
          !file.originalname.endsWith('.docx') && 
          !file.originalname.endsWith('.doc')
      )) {
        throw new BadRequestException('Uploaded file must be a Word Document (.docx or .doc)');
      }

      // Generate preview
      const previewPath = await this.pdfService.generateDocxPreview(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'PDF preview generated successfully',
        previewPath: path.basename(previewPath),
        originalFilename: file.originalname,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Preview generation failed: ${error.message || 'Unknown error'}`,
      });
    }
  }

  @ApiOperation({ summary: 'Analyze a DOCX file for PDF conversion compatibility' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'DOCX file to analyze',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Analysis completed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 500, description: 'Internal server error during analysis' })
  @Post('analyze')
  @UseInterceptors(FileInterceptor('file'))
  async analyzeConversion(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file is a DOCX
      if (!file.mimetype || (
          !file.mimetype.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') &&
          !file.mimetype.includes('application/msword') &&
          !file.originalname.endsWith('.docx') && 
          !file.originalname.endsWith('.doc')
      )) {
        throw new BadRequestException('Uploaded file must be a Word Document (.docx or .doc)');
      }

      // Analyze file
      const analysisResults = await this.pdfService.analyzeDocxConversion(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'DOCX analysis completed',
        originalFilename: file.originalname,
        analysis: analysisResults,
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

  @ApiOperation({ summary: 'Download a converted PDF' })
  @ApiResponse({
    status: 200,
    description: 'PDF downloaded successfully',
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
