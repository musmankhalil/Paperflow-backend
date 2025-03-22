import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfService } from '../services/pdf.service';
import { multerConfig } from '../multer.config';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';

// Swagger DTO helpers
class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}

class PdfInfoResponse {
  @ApiProperty({ example: 'Document Title' })
  title: string;

  @ApiProperty({ example: 'John Doe' })
  author: string;

  @ApiProperty({ example: 'Document Subject' })
  subject: string;

  @ApiProperty({ example: 'keyword1, keyword2' })
  keywords: string;

  @ApiProperty({ example: 'PDF Creator Software' })
  creator: string;

  @ApiProperty({ example: 'PDF Producer Software' })
  producer: string;

  @ApiProperty({ example: 10 })
  pageCount: number;

  @ApiProperty({ example: 'Sample text content from the document...' })
  textContent: string;

  @ApiProperty({ example: '1024 KB' })
  fileSize: string;
}

@ApiTags('pdf-info')
@Controller('pdf/info')
export class PdfInfoController {
  constructor(private readonly pdfService: PdfService) {}

  /**
   * Upload a PDF file and extract its information
   */
  @Post()
  @ApiOperation({ summary: 'Extract PDF metadata and information' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'PDF file to analyze',
    type: FileUploadDto,
  })
  @ApiResponse({
    status: 200,
    description: 'PDF information extracted successfully',
    type: PdfInfoResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or no file uploaded' })
  @ApiResponse({ status: 500, description: 'Failed to extract PDF information' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async getPdfInfo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    
    try {
      const info = await this.pdfService.extractPdfInfo(file.path);
      
      // Clean up the uploaded file after processing
      this.pdfService.cleanupFile(file.path);
      
      return info;
    } catch (error) {
      // Clean up on error
      if (file && file.path) {
        this.pdfService.cleanupFile(file.path);
      }
      throw error;
    }
  }
}