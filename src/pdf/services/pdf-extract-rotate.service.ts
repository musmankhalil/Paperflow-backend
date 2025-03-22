import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PDFDocument, degrees } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfExtractRotateService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Extract specific pages from a PDF
   */
  async extractPages(filePath: string, pages: number[]): Promise<string> {
    try {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const newPdf = await PDFDocument.create();
      
      // Validate page numbers
      const pageCount = pdfDoc.getPageCount();
      const validPages = pages.filter(pageNum => pageNum > 0 && pageNum <= pageCount);
      
      if (validPages.length === 0) {
        throw new HttpException(
          `Invalid page numbers. PDF has ${pageCount} pages.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      
      // Copy the specified pages to the new document
      for (const pageNum of validPages) {
        const [page] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);  // -1 because pages are 0-indexed
        newPdf.addPage(page);
      }
      
      // Save the new PDF with extracted pages
      const outputPath = path.join(this.uploadsDir, `extracted-${Date.now()}.pdf`);
      const newPdfBytes = await newPdf.save();
      fs.writeFileSync(outputPath, newPdfBytes);
      
      return outputPath;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to extract pages: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Rotate specific pages of a PDF
   */
  async rotatePdfPages(filePath: string, rotations: { page: number; degrees: number }[]): Promise<string> {
    try {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();
      
      // Apply rotations
      for (const { page, degrees: rotationDegrees } of rotations) {
        if (page > 0 && page <= pageCount) {
          const pdfPage = pdfDoc.getPage(page - 1);  // -1 because pages are 0-indexed
          const normalizedDegrees = ((rotationDegrees % 360) + 360) % 360; // Normalize to 0, 90, 180, 270
          pdfPage.setRotation(degrees(normalizedDegrees));
        }
      }
      
      // Save the rotated PDF
      const outputPath = path.join(this.uploadsDir, `rotated-${Date.now()}.pdf`);
      const rotatedPdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, rotatedPdfBytes);
      
      return outputPath;
    } catch (error) {
      throw new HttpException(
        `Failed to rotate PDF pages: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
