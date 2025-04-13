import { 
  Controller, 
  Post, 
  UploadedFile, 
  Body, 
  UseInterceptors, 
  Param, 
  Get, 
  Res, 
  Query, 
  ParseIntPipe, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiConsumes, 
  ApiProduces, 
  ApiBody, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { PdfService } from '../pdf.service';
import { PdfToImageService, ImageFormat, ImageQuality } from '../services/pdf-to-image.service';
import { ConvertToImageDto } from '../dto/convert-to-image.dto';

@ApiTags('PDF to Image')
@Controller('pdf/convert/to-image')
export class PdfToImageController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly pdfToImageService: PdfToImageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Convert PDF to images' })
  @ApiConsumes('multipart/form-data')
  @ApiProduces('application/zip')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          const fileExt = path.extname(file.originalname);
          cb(null, `${uniqueSuffix}${fileExt}`);
        },
      }),
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf' && 
            !file.originalname.toLowerCase().endsWith('.pdf')) {
          return cb(new HttpException('Only PDF files are allowed', HttpStatus.BAD_REQUEST), false);
        }
        cb(null, true);
      },
    }),
  )
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
  async convertPdfToImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: ConvertToImageDto,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      // Process and clean the options
      const processedOptions = this.processConversionOptions(options);

      // Convert the PDF to images
      const { zipPath, pageCount } = await this.pdfToImageService.convertPdfToImage(
        file.path,
        processedOptions,
      );

      // Set response headers
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="pdf_to_${processedOptions.format || 'jpg'}.zip"`,
      );
      res.setHeader('X-Page-Count', pageCount.toString());

      // Stream the file to the response
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);

      // Clean up the uploaded file after sending the response
      fileStream.on('end', () => {
        this.pdfService.cleanupFile(file.path);
        this.pdfService.cleanupFile(zipPath);
      });
    } catch (error) {
      // Clean up the uploaded file on error
      if (file?.path && fs.existsSync(file.path)) {
        this.pdfService.cleanupFile(file.path);
      }
      
      throw new HttpException(
        error.message || 'Error converting PDF to image',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('single-page')
  @ApiOperation({ summary: 'Convert a single page from PDF to image' })
  @ApiConsumes('multipart/form-data')
  @ApiProduces('image/jpeg', 'image/png', 'image/tiff', 'image/bmp')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          const fileExt = path.extname(file.originalname);
          cb(null, `${uniqueSuffix}${fileExt}`);
        },
      }),
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf' && 
            !file.originalname.toLowerCase().endsWith('.pdf')) {
          return cb(new HttpException('Only PDF files are allowed', HttpStatus.BAD_REQUEST), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to convert',
        },
        pageNumber: {
          type: 'number',
          description: 'Page number to extract (1-based)',
          example: 1,
        },
      },
    },
  })
  async convertSinglePage(
    @UploadedFile() file: Express.Multer.File,
    @Body('pageNumber', ParseIntPipe) pageNumber: number,
    @Body() options: ConvertToImageDto,
    @Res() res: Response,
  ) {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      if (!pageNumber || pageNumber < 1) {
        throw new HttpException('Invalid page number', HttpStatus.BAD_REQUEST);
      }

      // Process and clean the options
      const processedOptions = this.processConversionOptions(options);

      // Convert the single page from PDF to image
      const outputPath = await this.pdfToImageService.convertSinglePage(
        file.path,
        pageNumber,
        processedOptions,
      );

      // Determine the content type based on the format
      const format = processedOptions.format || ImageFormat.JPG;
      const contentType = this.getContentTypeForFormat(format);

      // Set response headers
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="page_${pageNumber}.${format}"`,
      );

      // Stream the file to the response
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);

      // Clean up the uploaded file after sending the response
      fileStream.on('end', () => {
        this.pdfService.cleanupFile(file.path);
        this.pdfService.cleanupFile(outputPath);
      });
    } catch (error) {
      // Clean up the uploaded file on error
      if (file?.path && fs.existsSync(file.path)) {
        this.pdfService.cleanupFile(file.path);
      }
      
      throw new HttpException(
        error.message || 'Error converting PDF page to image',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Process and validate conversion options
   */
  private processConversionOptions(options: any): any {
    const processedOptions: any = {};

    // Validate format
    if (options.format && Object.values(ImageFormat).includes(options.format)) {
      processedOptions.format = options.format;
    } else {
      processedOptions.format = ImageFormat.JPG;
    }

    // Validate quality
    if (typeof options.quality === 'string') {
      if (Object.values(ImageQuality).includes(options.quality as ImageQuality)) {
        processedOptions.quality = options.quality;
      } else {
        processedOptions.quality = ImageQuality.MEDIUM;
      }
    } else if (typeof options.quality === 'number' && options.quality >= 1 && options.quality <= 100) {
      processedOptions.quality = options.quality;
    } else {
      processedOptions.quality = ImageQuality.MEDIUM;
    }

    // Validate DPI
    if (options.dpi) {
      const dpi = parseInt(options.dpi, 10);
      if (!isNaN(dpi) && dpi >= 72 && dpi <= 1200) {
        processedOptions.dpi = dpi;
      }
    }

    // Process boolean values correctly
    if (options.grayscale !== undefined) {
      processedOptions.grayscale = options.grayscale === 'true' || options.grayscale === true;
    }

    if (options.transparent !== undefined) {
      processedOptions.transparent = options.transparent === 'true' || options.transparent === true;
    }

    if (options.cropToContent !== undefined) {
      processedOptions.cropToContent = options.cropToContent === 'true' || options.cropToContent === true;
    }

    // Process page range and specific pages
    if (options.pageRange) {
      try {
        if (typeof options.pageRange === 'string') {
          processedOptions.pageRange = JSON.parse(options.pageRange);
        } else {
          processedOptions.pageRange = options.pageRange;
        }
      } catch (e) {
        // Ignore if parsing fails
      }
    }

    if (options.specificPages) {
      try {
        if (typeof options.specificPages === 'string') {
          processedOptions.specificPages = JSON.parse(options.specificPages);
        } else {
          processedOptions.specificPages = options.specificPages;
        }
      } catch (e) {
        // Ignore if parsing fails
      }
    }

    return processedOptions;
  }

  /**
   * Get the proper MIME content type for the image format
   */
  private getContentTypeForFormat(format: ImageFormat): string {
    switch (format) {
      case ImageFormat.JPG:
        return 'image/jpeg';
      case ImageFormat.PNG:
        return 'image/png';
      case ImageFormat.TIFF:
        return 'image/tiff';
      case ImageFormat.BMP:
        return 'image/bmp';
      case ImageFormat.WEBP:
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }
}
