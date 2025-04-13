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
  Query,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { PdfService } from '../pdf.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { existsSync } from 'fs';
import { ConvertPptxToPdfDto, PptxPdfQuality } from '../dto/convert-pptx-to-pdf.dto';
import * as path from 'path';
import { diskStorage } from 'multer';

@ApiTags('PPTX to PDF Conversion')
@Controller('pdf/pptx-to-pdf')
export class PptxToPdfController {
  constructor(private readonly pdfService: PdfService) {}

  @ApiOperation({ summary: 'Convert PPTX to PDF with basic settings' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PPTX file to convert to PDF format',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'PPTX converted to PDF successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  @Post('basic')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        // Accept only pptx and ppt files
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            file.mimetype === 'application/vnd.ms-powerpoint' ||
            file.originalname.match(/\.(pptx|ppt)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PowerPoint files (PPTX, PPT) are allowed'), false);
        }
      },
    }),
  )
  async convertPptxToPdfBasic(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Convert the PPTX to PDF
      const convertedFilePath = await this.pdfService.convertPptxToPdfBasic(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'PPTX successfully converted to PDF',
        convertedFilePath: path.basename(convertedFilePath),
        originalFile: path.basename(file.path),
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

  @ApiOperation({ summary: 'Convert PPTX to PDF with advanced settings' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PPTX file to convert to PDF format',
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
    description: 'PPTX converted to PDF successfully with advanced options',
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or options' })
  @ApiResponse({ status: 500, description: 'Internal server error during conversion' })
  @Post('advanced')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        // Accept only pptx and ppt files
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            file.mimetype === 'application/vnd.ms-powerpoint' ||
            file.originalname.match(/\.(pptx|ppt)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PowerPoint files (PPTX, PPT) are allowed'), false);
        }
      },
    }),
  )
  async convertPptxToPdfAdvanced(
    @UploadedFile() file: Express.Multer.File,
    @Body('options', new ValidationPipe({ transform: true })) options: ConvertPptxToPdfDto,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Convert the PPTX to PDF with advanced options
      const convertedFilePath = await this.pdfService.convertPptxToPdfAdvanced(
        file.path,
        options,
      );

      return res.status(HttpStatus.OK).json({
        message: 'PPTX successfully converted to PDF with advanced options',
        convertedFilePath: path.basename(convertedFilePath),
        originalFile: path.basename(file.path),
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

  @ApiOperation({ summary: 'Convert PPTX to PDF/A format (for archiving)' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'version',
    required: false,
    enum: ['1b', '2b', '3b'],
    description: 'PDF/A version to use',
  })
  @ApiResponse({
    status: 200,
    description: 'PPTX converted to PDF/A successfully',
  })
  @Post('archive')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            file.mimetype === 'application/vnd.ms-powerpoint' ||
            file.originalname.match(/\.(pptx|ppt)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PowerPoint files (PPTX, PPT) are allowed'), false);
        }
      },
    }),
  )
  async convertPptxToPdfA(
    @UploadedFile() file: Express.Multer.File,
    @Query('version') version: '1b' | '2b' | '3b' = '1b',
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Convert the PPTX to PDF/A
      const convertedFilePath = await this.pdfService.convertPptxToPdfA(file.path, version);

      return res.status(HttpStatus.OK).json({
        message: `PPTX successfully converted to PDF/A-${version}`,
        convertedFilePath: path.basename(convertedFilePath),
        originalFile: path.basename(file.path),
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

  @ApiOperation({ summary: 'Generate a PDF preview from a PPTX file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'PPTX preview generated successfully',
  })
  @Post('preview')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            file.mimetype === 'application/vnd.ms-powerpoint' ||
            file.originalname.match(/\.(pptx|ppt)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PowerPoint files (PPTX, PPT) are allowed'), false);
        }
      },
    }),
  )
  async generatePptxPreview(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Generate a preview PDF from the PPTX
      const previewFilePath = await this.pdfService.generatePptxPreview(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'PPTX preview generated successfully',
        previewFilePath: path.basename(previewFilePath),
        originalFile: path.basename(file.path),
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

  @ApiOperation({ summary: 'Analyze PPTX file for PDF conversion compatibility' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'PPTX analyzed successfully',
  })
  @Post('analyze')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            file.mimetype === 'application/vnd.ms-powerpoint' ||
            file.originalname.match(/\.(pptx|ppt)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PowerPoint files (PPTX, PPT) are allowed'), false);
        }
      },
    }),
  )
  async analyzePptxConversion(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Analyze the PPTX file
      const analysis = await this.pdfService.analyzePptxConversion(file.path);

      return res.status(HttpStatus.OK).json({
        message: 'PPTX analyzed successfully',
        analysis,
        originalFile: path.basename(file.path),
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

  @ApiOperation({ summary: 'Download a converted PDF file' })
  @ApiResponse({
    status: 200,
    description: 'PDF file downloaded successfully',
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
