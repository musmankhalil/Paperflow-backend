import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

export enum PageNumberPosition {
  TOP_LEFT = 'top-left',
  TOP_CENTER = 'top-center',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_CENTER = 'bottom-center',
  BOTTOM_RIGHT = 'bottom-right',
}

export interface PageNumberOptions {
  position: PageNumberPosition;
  startNumber?: number;
  prefix?: string;
  suffix?: string;
  fontSize?: number;
  opacity?: number;
  fontColor?: { r: number; g: number; b: number };
  margin?: number;
  skipFirstPage?: boolean;
  skipLastPage?: boolean;
  pageRange?: { start?: number; end?: number };
}

@Injectable()
export class PdfNumberPagesService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Add page numbers to a PDF document
   */
  async addPageNumbers(filePath: string, options: PageNumberOptions): Promise<string> {
    try {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;
      
      // Set default values for options
      const startNumber = options.startNumber || 1;
      const fontSize = options.fontSize || 12;
      const fontColor = options.fontColor || { r: 0, g: 0, b: 0 }; // Default to black
      const opacity = options.opacity !== undefined ? options.opacity : 1.0;
      const margin = options.margin || 25;
      const prefix = options.prefix || '';
      const suffix = options.suffix || '';
      const skipFirstPage = options.skipFirstPage || false;
      const skipLastPage = options.skipLastPage || false;
      const position = options.position || PageNumberPosition.BOTTOM_CENTER;
      
      // Determine page range
      const startPage = options.pageRange?.start ? Math.max(1, options.pageRange.start) : 1;
      const endPage = options.pageRange?.end ? Math.min(totalPages, options.pageRange.end) : totalPages;
      
      // Embed the font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Add page numbers to each page
      for (let i = startPage - 1; i < endPage; i++) {
        // Skip first or last page if requested
        if ((skipFirstPage && i === 0) || (skipLastPage && i === totalPages - 1)) {
          continue;
        }
        
        const pageNum = i + startNumber;
        const pageNumText = `${prefix}${pageNum}${suffix}`;
        const page = pages[i];
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(pageNumText, fontSize);
        
        // Calculate position based on option
        let x = 0;
        let y = 0;
        
        // X position (horizontal alignment)
        if (position.includes('left')) {
          x = margin;
        } else if (position.includes('right')) {
          x = width - textWidth - margin;
        } else {
          // center
          x = (width - textWidth) / 2;
        }
        
        // Y position (vertical alignment)
        if (position.includes('top')) {
          y = height - margin - fontSize;
        } else if (position.includes('bottom')) {
          y = margin;
        } else {
          // middle (unlikely to be used for page numbers)
          y = (height - fontSize) / 2;
        }
        
        // Draw the page number
        page.drawText(pageNumText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(fontColor.r, fontColor.g, fontColor.b),
          opacity
        });
      }
      
      // Save the modified PDF
      const outputPath = path.join(this.uploadsDir, `numbered-${Date.now()}.pdf`);
      const numberedPdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, numberedPdfBytes);
      
      return outputPath;
    } catch (error) {
      throw new HttpException(
        `Failed to add page numbers: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
