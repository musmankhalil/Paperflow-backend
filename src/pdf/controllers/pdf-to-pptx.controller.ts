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
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { PdfService } from '../services/pdf.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { existsSync } from 'fs';
import { ConvertToPptxDto } from '../dto/convert-to-pptx.dto';
import * as path from 'path';

@ApiTags('PDF to PowerPoint Conversion')
@Controller('pdf/convert/to-pptx')
export class PdfToPptxController {
  constructor(private readonly pdfService: PdfService) {}

  @ApiOperation({ summary: 'Convert PDF to PowerPoint (PPTX) with basic settings' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to convert to PowerPoint format',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PDF converted to PowerPoint successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  @Post('basic')
  @UseInterceptors(FileInterceptor('file'))
  async convertPdfToPptxBasic(
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

      // Convert the PDF to PowerPoint
      const convertedFilePath = await this.pdfService.convertPdfToPptxBasic(file.path);

      // Get file info
      const fileInfo = await this.pdfService.getPdfInfo(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'PDF successfully converted to PowerPoint presentation',
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

  @ApiOperation({ summary: 'Convert PDF to PowerPoint (PPTX) with advanced settings' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to convert to PowerPoint format',
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
    description: 'PDF converted to PowerPoint successfully with advanced options',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or options' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  @Post('advanced')
  @UseInterceptors(FileInterceptor('file'))
  async convertPdfToPptxAdvanced(
    @UploadedFile() file: Express.Multer.File,
    @Body('options', new ValidationPipe({ transform: true })) options: ConvertToPptxDto,
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

      // Parse options if they were passed as a string
      let parsedOptions = options;
      if (typeof options === 'string') {
        try {
          parsedOptions = JSON.parse(options);
        } catch (e) {
          throw new BadRequestException('Invalid options format. Must be a valid JSON object.');
        }
      }

      // Convert the PDF to PowerPoint with advanced options
      const convertedFilePath = await this.pdfService.convertPdfToPptxAdvanced(
        file.path,
        parsedOptions,
      );

      // Get file info
      const fileInfo = await this.pdfService.getPdfInfo(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'PDF successfully converted to PowerPoint presentation with advanced options',
        convertedFilePath: path.basename(convertedFilePath),
        originalFileInfo: fileInfo,
        appliedOptions: parsedOptions,
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

  @ApiOperation({ summary: 'Create a custom presentation from PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to convert to PowerPoint format',
        },
        options: {
          type: 'object',
          description: 'Custom presentation options',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Custom PowerPoint presentation created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or options' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  @Post('custom')
  @UseInterceptors(FileInterceptor('file'))
  async createCustomPresentation(
    @UploadedFile() file: Express.Multer.File,
    @Body('options') options: any,
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

      // Parse options if they were passed as a string
      let parsedOptions = options;
      if (typeof options === 'string') {
        try {
          parsedOptions = JSON.parse(options);
        } catch (e) {
          throw new BadRequestException('Invalid options format. Must be a valid JSON object.');
        }
      }

      // Create custom presentation
      const convertedFilePath = await this.pdfService.createCustomPresentation(
        file.path,
        parsedOptions,
      );

      // Get file info
      const fileInfo = await this.pdfService.getPdfInfo(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'Custom PowerPoint presentation created successfully',
        convertedFilePath: path.basename(convertedFilePath),
        originalFileInfo: fileInfo,
        appliedOptions: parsedOptions,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: `Custom presentation creation failed: ${error.message || 'Unknown error'}`,
      });
    }
  }

  @ApiOperation({ summary: 'Download a converted PowerPoint presentation' })
  @ApiParam({
    name: 'filename',
    type: 'string',
    description: 'Filename of the converted PowerPoint presentation',
  })
  @ApiResponse({
    status: 200,
    description: 'PowerPoint presentation downloaded successfully',
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Get('download/:filename')
  async downloadConvertedFile(
    @Param('filename') filename: string,
    @Res() res: Response
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
