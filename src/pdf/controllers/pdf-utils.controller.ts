import {
  Controller,
  Get,
  Param,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { PdfService } from '../services/pdf.service';
import {
  ApiTags,
  ApiOperation,
  ApiProduces,
  ApiParam,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';

class HealthCheckResponse {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 'pdf-api' })
  service: string;
}

@ApiTags('pdf-utils')
@Controller('pdf')
export class PdfUtilsController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check if PDF service is running' })
  @ApiResponse({
    status: 200,
    description: 'Service health check',
    type: HealthCheckResponse,
  })
  health() {
    return { status: 'ok', service: 'pdf-api' };
  }

  /**
   * Download a processed file by filename
   * Note: In a production environment, this would need more security
   */
  @Get('download/:filename')
  @ApiOperation({ summary: 'Download a previously processed file by filename' })
  @ApiParam({
    name: 'filename',
    description: 'Filename of the processed PDF file',
    example: 'page-1-1616233333.pdf',
  })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF file',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = this.pdfService.getFilePath(filename);
    
    if (!existsSync(filePath)) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  }
}