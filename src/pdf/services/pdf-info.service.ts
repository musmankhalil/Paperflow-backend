import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class PdfInfoService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Extract PDF metadata and information
   */
  async extractPdfInfo(filePath: string) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      // Get more details using pdf-lib
      const pdfDoc = await PDFDocument.load(dataBuffer);
      
      return {
        title: pdfData.info?.Title || 'Unknown',
        author: pdfData.info?.Author || 'Unknown',
        subject: pdfData.info?.Subject || '',
        keywords: pdfData.info?.Keywords || '',
        creator: pdfData.info?.Creator || '',
        producer: pdfData.info?.Producer || '',
        pageCount: pdfDoc.getPageCount(),
        textContent: pdfData.text,
        fileSize: Math.round(dataBuffer.length / 1024) + ' KB',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to extract PDF info: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get information about a PDF file
   * @param filePath Path to the PDF file
   * @returns Object containing file info (size, pageCount)
   */
  async getPdfInfo(filePath: string): Promise<{ size: string; pageCount: number }> {
    try {
      const fileStats = fs.statSync(filePath);
      const fileSize = Math.round(fileStats.size / 1024) + ' KB';
      
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();
      
      return {
        size: fileSize,
        pageCount,
      };
    } catch (error) {
      console.error(`Error getting PDF info: ${error.message}`);
      return {
        size: 'Unknown',
        pageCount: 0,
      };
    }
  }
}
