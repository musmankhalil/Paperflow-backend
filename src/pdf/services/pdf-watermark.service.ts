import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { WatermarkOptionsDto, WatermarkPosition, WatermarkType } from '../dto/watermark-options.dto';

@Injectable()
export class PdfWatermarkService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Add watermark to a PDF document
   */
  async addWatermark(filePath: string, options: WatermarkOptionsDto): Promise<string> {
    try {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;
      
      // Set default values for options
      const fontSize = options.fontSize || 48;
      const color = options.color || { r: 0, g: 0, b: 0 }; // Default to black
      const opacity = options.opacity !== undefined ? options.opacity : 0.3;
      const rotation = options.rotation || 45;
      const allPages = options.allPages !== undefined ? options.allPages : true;
      const position = options.position || WatermarkPosition.CENTER;
      const text = options.text || 'CONFIDENTIAL';
      
      // Determine page range if not adding to all pages
      let startPage = 0;
      let endPage = totalPages - 1;
      
      if (!allPages && options.pageRange) {
        startPage = options.pageRange.start ? Math.max(0, options.pageRange.start - 1) : 0;
        endPage = options.pageRange.end ? Math.min(totalPages - 1, options.pageRange.end - 1) : totalPages - 1;
      }
      
      // Embed the font
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Add watermark to each page in range
      for (let i = startPage; i <= endPage; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = fontSize;
        
        // Calculate position based on option
        let x = 0;
        let y = 0;
        
        // X position (horizontal alignment)
        if (position.includes('left')) {
          x = width * 0.1;
        } else if (position.includes('right')) {
          x = width * 0.9 - textWidth;
        } else {
          // center
          x = (width - textWidth) / 2;
        }
        
        // Y position (vertical alignment)
        if (position.includes('top')) {
          y = height * 0.9;
        } else if (position.includes('bottom')) {
          y = height * 0.1;
        } else {
          // middle/center
          y = (height - textHeight) / 2;
        }
        
        // Draw the watermark
        if (options.type === WatermarkType.TEXT) {
          // Draw the watermark text with rotation if needed
          const centerX = width / 2;
          const centerY = height / 2;
          
          if (position === WatermarkPosition.CENTER && rotation) {
            // For centered text with rotation
            page.drawText(text, {
              x: centerX - textWidth / 2,
              y: centerY - textHeight / 2,
              size: fontSize,
              font,
              color: rgb(color.r || 0, color.g || 0, color.b || 0),
              opacity,
              rotate: degrees(rotation),
            });
          } else {
            // For normal positioning without rotation
            page.drawText(text, {
              x: position === WatermarkPosition.CENTER ? centerX - textWidth / 2 : x,
              y: position === WatermarkPosition.CENTER ? centerY - textHeight / 2 : y,
              size: fontSize,
              font,
              color: rgb(color.r || 0, color.g || 0, color.b || 0),
              opacity,
            });
          }
        }
      }
      
      // Save the modified PDF
      const outputPath = path.join(this.uploadsDir, `watermarked-${Date.now()}.pdf`);
      const watermarkedPdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, watermarkedPdfBytes);
      
      return outputPath;
    } catch (error) {
      throw new HttpException(
        `Failed to add watermark: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}