import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  HttpException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { PdfService } from '../pdf.service';
import { ProtectOptionsDto } from '../dto/protect-options.dto';

@Controller('pdf/protect')
export class PdfProtectController {
  constructor(private readonly pdfService: PdfService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async protectPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: ProtectOptionsDto,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      const filePath = this.pdfService.getFilePath(file.filename);
      
      // Make sure that the options have at least a userPassword
      if (!options.userPassword) {
        throw new HttpException('User password is required', HttpStatus.BAD_REQUEST);
      }
      
      // Using class-transformer/validator will handle the conversion via the DTO

      // Protect the PDF
      const protectedFilePath = await this.pdfService.protectPdfWithPassword(filePath, options);
      
      // Prepare for sending the file
      const filename = path.basename(file.originalname, '.pdf');
      const outputFilename = `${filename}_protected.pdf`;
      
      // Send the file
      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
      res.setHeader('Content-Type', 'application/pdf');
      
      const fileStream = fs.createReadStream(protectedFilePath);
      fileStream.pipe(res);
      
      // Clean up the files after sending
      fileStream.on('end', () => {
        this.pdfService.cleanupFile(filePath);
        this.pdfService.cleanupFile(protectedFilePath);
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to protect PDF',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('remove')
  @UseInterceptors(FileInterceptor('file'))
  async removeProtection(
    @UploadedFile() file: Express.Multer.File,
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    if (!password) {
      throw new HttpException('Password is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const filePath = this.pdfService.getFilePath(file.filename);
      
      // Remove protection
      const unprotectedFilePath = await this.pdfService.removePasswordProtection(filePath, password);
      
      // Prepare for sending the file
      const filename = path.basename(file.originalname, '.pdf');
      const outputFilename = `${filename}_unprotected.pdf`;
      
      // Send the file
      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
      res.setHeader('Content-Type', 'application/pdf');
      
      const fileStream = fs.createReadStream(unprotectedFilePath);
      fileStream.pipe(res);
      
      // Clean up the files after sending
      fileStream.on('end', () => {
        this.pdfService.cleanupFile(filePath);
        this.pdfService.cleanupFile(unprotectedFilePath);
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to remove PDF protection',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('check')
  @UseInterceptors(FileInterceptor('file'))
  async checkProtection(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      const filePath = this.pdfService.getFilePath(file.filename);
      
      // Check if the PDF is protected
      const protectionInfo = await this.pdfService.checkPdfProtection(filePath);
      
      // Clean up the file after checking
      this.pdfService.cleanupFile(filePath);
      
      return protectionInfo;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to check PDF protection',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
