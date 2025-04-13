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
import { PdfService } from '../pdf.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { ConvertXlsxToPdfDto, XlsxPrintOptions, XlsxPaperSize, XlsxSheetSelection } from '../dto/convert-xlsx-to-pdf.dto';
import { PdfQuality, PdfCompliance } from '../dto/convert-to-pdf.dto';

@ApiTags('XLSX to PDF Conversion')
@Controller('xlsx-to-pdf')
export class XlsxToPdfController {
  constructor(private readonly pdfService: PdfService) {}

  @ApiOperation({ summary: 'Convert XLSX to PDF (Basic)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'XLSX file to convert',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'XLSX successfully converted to PDF' })
  @ApiResponse({ status: 400, description: 'Bad request or invalid file format' })
  @Post('convert/basic')
  @UseInterceptors(FileInterceptor('file'))
  async convertXlsxToPdfBasic(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file is an Excel file
      if (
        !file.mimetype ||
        !['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(
          file.mimetype
        )
      ) {
        throw new BadRequestException('Uploaded file must be an Excel spreadsheet (XLSX or XLS)');
      }

      // Convert the XLSX to PDF
      const outputPath = await this.pdfService.convertXlsxToPdfBasic(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'XLSX successfully converted to PDF',
        data: {
          success: true,
          filepath: outputPath,
          filename: path.basename(outputPath),
        },
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

  @ApiOperation({ summary: 'Convert XLSX to PDF (Advanced)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'XLSX file to convert',
        },
        options: {
          type: 'string',
          description: 'JSON string of conversion options',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'XLSX successfully converted to PDF with advanced options' })
  @ApiResponse({ status: 400, description: 'Bad request or invalid file format' })
  @Post('convert/advanced')
  @UseInterceptors(FileInterceptor('file'))
  async convertXlsxToPdfAdvanced(
    @UploadedFile() file: Express.Multer.File,
    @Body('options') optionsJson: string,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file is an Excel file
      if (
        !file.mimetype ||
        !['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(
          file.mimetype
        )
      ) {
        throw new BadRequestException('Uploaded file must be an Excel spreadsheet (XLSX or XLS)');
      }

      // Parse conversion options
      let options: ConvertXlsxToPdfDto = {};
      try {
        if (optionsJson) {
          options = JSON.parse(optionsJson);
        }
      } catch (err) {
        throw new BadRequestException('Invalid options JSON format');
      }

      // Convert the XLSX to PDF with advanced options
      const outputPath = await this.pdfService.convertXlsxToPdfAdvanced(file.path, options);

      return res.status(HttpStatus.OK).json({
        message: 'XLSX successfully converted to PDF with advanced options',
        data: {
          success: true,
          filepath: outputPath,
          filename: path.basename(outputPath),
        },
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

  @ApiOperation({ summary: 'Convert XLSX to PDF/A for archiving' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'XLSX file to convert',
        },
      },
    },
  })
  @ApiQuery({
    name: 'version',
    description: 'PDF/A version (1b, 2b, or 3b)',
    required: false,
    enum: ['1b', '2b', '3b'],
  })
  @ApiResponse({ status: 200, description: 'XLSX successfully converted to PDF/A' })
  @Post('convert/pdfa')
  @UseInterceptors(FileInterceptor('file'))
  async convertXlsxToPdfA(
    @UploadedFile() file: Express.Multer.File,
    @Query('version') version: '1b' | '2b' | '3b' = '1b',
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file is an Excel file
      if (
        !file.mimetype ||
        !['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(
          file.mimetype
        )
      ) {
        throw new BadRequestException('Uploaded file must be an Excel spreadsheet (XLSX or XLS)');
      }

      // Convert the XLSX to PDF/A
      const outputPath = await this.pdfService.convertXlsxToPdfA(file.path, version);

      return res.status(HttpStatus.OK).json({
        message: `XLSX successfully converted to PDF/A-${version}`,
        data: {
          success: true,
          filepath: outputPath,
          filename: path.basename(outputPath),
        },
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
  
  @ApiOperation({ summary: 'Generate XLSX preview as PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'XLSX file to preview',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'XLSX preview generated successfully' })
  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  async generateXlsxPreview(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file is an Excel file
      if (
        !file.mimetype ||
        !['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(
          file.mimetype
        )
      ) {
        throw new BadRequestException('Uploaded file must be an Excel spreadsheet (XLSX or XLS)');
      }

      // Generate preview
      const outputPath = await this.pdfService.generateXlsxPreview(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'XLSX preview generated successfully',
        data: {
          success: true,
          filepath: outputPath,
          filename: path.basename(outputPath),
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'An error occurred during preview generation',
      });
    }
  }

  @ApiOperation({ summary: 'Analyze XLSX file for PDF conversion' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'XLSX file to analyze',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'XLSX analysis completed' })
  @Post('analyze')
  @UseInterceptors(FileInterceptor('file'))
  async analyzeXlsxForPdfConversion(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file is an Excel file
      if (
        !file.mimetype ||
        !['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(
          file.mimetype
        )
      ) {
        throw new BadRequestException('Uploaded file must be an Excel spreadsheet (XLSX or XLS)');
      }

      // Analyze the file
      const analysis = await this.pdfService.analyzeXlsxForPdfConversion(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'XLSX analysis completed',
        data: analysis,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'An error occurred during analysis',
      });
    }
  }

  @ApiOperation({ summary: 'Check available XLSX to PDF conversion tools' })
  @ApiResponse({ status: 200, description: 'Conversion tools check completed' })
  @Get('tools')
  async checkXlsxToPdfTools(@Res() res: Response) {
    try {
      const toolsInfo = await this.pdfService.checkXlsxToPdfTools();

      return res.status(HttpStatus.OK).json({
        message: 'Conversion tools check completed',
        data: toolsInfo,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'An error occurred checking conversion tools',
      });
    }
  }

  @ApiOperation({ summary: 'Download converted PDF file' })
  @ApiParam({
    name: 'filename',
    description: 'Filename of the converted PDF to download',
  })
  @ApiResponse({ status: 200, description: 'File download' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Get('download/:filename')
  async downloadConvertedFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const filePath = this.pdfService.getFilePath(filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'File not found',
        });
      }

      return res.download(filePath);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message || 'An error occurred during file download',
      });
    }
  }
}
