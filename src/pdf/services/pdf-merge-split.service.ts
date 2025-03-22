import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { MergeOptionsDto } from '../dto/merge-options.dto';

@Injectable()
export class PdfMergeSplitService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Merge multiple PDFs into a single PDF
   */
  async mergePdfs(filePaths: string[], options?: MergeOptionsDto): Promise<string> {
    try {
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // Set document information if provided
      if (options?.documentInfo) {
        const { title, author, subject, keywords } = options.documentInfo;
        if (title) mergedPdf.setTitle(title);
        if (author) mergedPdf.setAuthor(author);
        if (subject) mergedPdf.setSubject(subject);
        if (keywords) mergedPdf.setKeywords(keywords.split(',').map(k => k.trim()));
      }
      
      // Process file order
      let orderedFilePaths = [...filePaths];
      if (options?.fileOrder && options.fileOrder.length === filePaths.length) {
        orderedFilePaths = options.fileOrder.map(index => {
          if (index < 0 || index >= filePaths.length) {
            throw new HttpException(
              `Invalid file index in fileOrder: ${index}`,
              HttpStatus.BAD_REQUEST,
            );
          }
          return filePaths[index];
        });
      }
      
      // Track page counts for bookmarks
      const pageCountMap = new Map<number, number>();
      let currentPageCount = 0;
      
      // Process each PDF file
      for (let i = 0; i < orderedFilePaths.length; i++) {
        const filePath = orderedFilePaths[i];
        const pdfBytes = fs.readFileSync(filePath);
        const pdf = await PDFDocument.load(pdfBytes);
        
        // Store the starting page number for this document
        pageCountMap.set(i, currentPageCount);
        
        // Copy all pages from the current document
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
        
        // Update the current page count
        currentPageCount += pages.length;
      }
      
      // Add bookmarks if requested
      // Note: Bookmarks require low-level PDF manipulation
      // This is a simplified implementation 
      if (options?.addBookmarks && orderedFilePaths.length > 1) {
        // In a real implementation, we would create proper bookmarks here
        // pdf-lib doesn't have high-level support for bookmarks
        // You would need to create a outline dictionary with destinations
        console.log('Bookmarks requested, but not implemented in this version');
      }
      
      // Save the merged PDF
      const outputPath = path.join(this.uploadsDir, `merged-${Date.now()}.pdf`);
      const mergedPdfBytes = await mergedPdf.save();
      fs.writeFileSync(outputPath, mergedPdfBytes);
      
      return outputPath;
    } catch (error) {
      throw new HttpException(
        `Failed to merge PDFs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Split a PDF into multiple PDFs (one per page)
   */
  async splitPdf(filePath: string): Promise<string[]> {
    try {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();
      const outputPaths: string[] = [];
      
      // Create individual PDFs for each page
      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(page);
        
        const outputPath = path.join(this.uploadsDir, `page-${i+1}-${Date.now()}.pdf`);
        const newPdfBytes = await newPdf.save();
        fs.writeFileSync(outputPath, newPdfBytes);
        outputPaths.push(outputPath);
      }
      
      return outputPaths;
    } catch (error) {
      throw new HttpException(
        `Failed to split PDF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Split a PDF with advanced options
   * @param filePath Path to the PDF file
   * @param options Split options including mode and related parameters
   * @returns Array of paths to the split PDF files
   */
  async splitPdfAdvanced(filePath: string, options: any): Promise<string[]> {
    try {
      console.log(`Starting advanced PDF split for file: ${filePath}`);
      console.log(`Split options:`, JSON.stringify(options, null, 2));
      
      const { mode, pages, ranges, everyNPages, preserveBookmarks, filenamePrefix } = options;
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();
      const outputPaths: string[] = [];
      
      // Default filename prefix if not provided
      const prefix = filenamePrefix || 'split';
      const timestamp = Date.now();
      
      switch (mode) {
        case 'pages': {
          // Split at specific page numbers
          if (!pages || pages.length === 0) {
            throw new HttpException(
              'Page numbers are required for "pages" mode. Please provide an array of page numbers where the document should be split.',
              HttpStatus.BAD_REQUEST,
            );
          }
          
          // Sort pages and add document end
          const sortedPages = [...pages].sort((a, b) => a - b);
          if (sortedPages[sortedPages.length - 1] < pageCount) {
            sortedPages.push(pageCount + 1); // Add end marker
          }
          
          let startPage = 1;
          for (let i = 0; i < sortedPages.length; i++) {
            const endPage = sortedPages[i];
            
            if (endPage > startPage && endPage <= pageCount + 1) {
              // Create a PDF for this range
              const newPdf = await PDFDocument.create();
              
              // Copy pages from startPage to endPage-1 (all pages before the split point)
              const pageIndexes = Array.from(
                { length: endPage - startPage },
                (_, i) => startPage - 1 + i
              );
              
              // Only copy valid pages
              const validPageIndexes = pageIndexes.filter(idx => idx < pageCount);
              if (validPageIndexes.length > 0) {
                const copiedPages = await newPdf.copyPages(pdfDoc, validPageIndexes);
                copiedPages.forEach(page => newPdf.addPage(page));
                
                const outputPath = path.join(this.uploadsDir, `${prefix}-${i+1}-${timestamp}.pdf`);
                const newPdfBytes = await newPdf.save();
                fs.writeFileSync(outputPath, newPdfBytes);
                outputPaths.push(outputPath);
              }
            }
            
            startPage = endPage;
          }
          break;
        }
        
        case 'ranges': {
          // Split based on specific page ranges
          if (!ranges || ranges.length === 0) {
            throw new HttpException(
              'Page ranges are required for "ranges" mode. Please provide an array of page ranges with start and end values.',
              HttpStatus.BAD_REQUEST,
            );
          }
          
          for (let i = 0; i < ranges.length; i++) {
            const { start, end } = ranges[i];
            
            // Validate range
            if (start < 1 || end > pageCount || start > end) {
              continue; // Skip invalid ranges
            }
            
            // Create a PDF for this range
            const newPdf = await PDFDocument.create();
            
            // Copy pages from start to end (inclusive)
            const pageIndexes = Array.from(
              { length: end - start + 1 },
              (_, i) => start - 1 + i // Convert to 0-based index
            );
            
            const copiedPages = await newPdf.copyPages(pdfDoc, pageIndexes);
            copiedPages.forEach(page => newPdf.addPage(page));
            
            const outputPath = path.join(this.uploadsDir, `${prefix}-range${i+1}-${timestamp}.pdf`);
            const newPdfBytes = await newPdf.save();
            fs.writeFileSync(outputPath, newPdfBytes);
            outputPaths.push(outputPath);
          }
          break;
        }
        
        case 'everyNPages': {
          // Split every N pages
          if (!everyNPages || everyNPages < 1) {
            throw new HttpException(
              'Valid everyNPages value is required for "everyNPages" mode. Please provide a positive number.',
              HttpStatus.BAD_REQUEST,
            );
          }
          
          const n = everyNPages;
          const chunks = Math.ceil(pageCount / n);
          
          for (let i = 0; i < chunks; i++) {
            const start = i * n;
            const end = Math.min((i + 1) * n, pageCount);
            
            // Create a PDF for this chunk
            const newPdf = await PDFDocument.create();
            
            // Copy pages from start to end-1
            const pageIndexes = Array.from(
              { length: end - start },
              (_, j) => start + j
            );
            
            const copiedPages = await newPdf.copyPages(pdfDoc, pageIndexes);
            copiedPages.forEach(page => newPdf.addPage(page));
            
            const outputPath = path.join(this.uploadsDir, `${prefix}-part${i+1}-${timestamp}.pdf`);
            const newPdfBytes = await newPdf.save();
            fs.writeFileSync(outputPath, newPdfBytes);
            outputPaths.push(outputPath);
          }
          break;
        }
        
        case 'bookmarks': {
          // Split based on bookmarks (outline items)
          // Note: This is a simplified implementation as pdf-lib doesn't have built-in
          // bookmark/outline extraction functionality
          
          // For demonstration, we'll just create a dummy split similar to every 5 pages
          // In a real implementation, you would need to:
          // 1. Access the PDF outline (bookmark structure)
          // 2. Get the page numbers associated with each bookmark
          // 3. Use those as split points
          
          console.log('Bookmark-based splitting requested, falling back to every 5 pages');
          
          const n = 5;
          const chunks = Math.ceil(pageCount / n);
          
          for (let i = 0; i < chunks; i++) {
            const start = i * n;
            const end = Math.min((i + 1) * n, pageCount);
            
            // Create a PDF for this chunk
            const newPdf = await PDFDocument.create();
            
            // Copy pages from start to end-1
            const pageIndexes = Array.from(
              { length: end - start },
              (_, j) => start + j
            );
            
            const copiedPages = await newPdf.copyPages(pdfDoc, pageIndexes);
            copiedPages.forEach(page => newPdf.addPage(page));
            
            const outputPath = path.join(this.uploadsDir, `${prefix}-bookmark${i+1}-${timestamp}.pdf`);
            const newPdfBytes = await newPdf.save();
            fs.writeFileSync(outputPath, newPdfBytes);
            outputPaths.push(outputPath);
          }
          break;
        }
        
        default: {
          // Default: Split into individual pages (same as basic splitPdf)
          for (let i = 0; i < pageCount; i++) {
            const newPdf = await PDFDocument.create();
            const [page] = await newPdf.copyPages(pdfDoc, [i]);
            newPdf.addPage(page);
            
            const outputPath = path.join(this.uploadsDir, `${prefix}-${i+1}-${timestamp}.pdf`);
            const newPdfBytes = await newPdf.save();
            fs.writeFileSync(outputPath, newPdfBytes);
            outputPaths.push(outputPath);
          }
        }
      }
      
      console.log(`PDF split successfully with mode "${mode}". Created ${outputPaths.length} files.`);
      return outputPaths;
    } catch (error) {
      console.error(`Error splitting PDF: ${error.message}`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to split PDF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
