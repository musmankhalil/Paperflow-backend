import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { PdfInfoService } from './pdf-info.service';
import { PdfMergeSplitService } from './pdf-merge-split.service';
import { PdfExtractRotateService } from './pdf-extract-rotate.service';
import { PdfCompressionService } from './pdf-compression.service';
import { PdfToWordService } from './pdf-to-word.service';
import { DocxToPdfService } from './docx-to-pdf.service';
import { PdfToXlsxService } from './pdf-to-xlsx.service';
import { PdfToPptxService } from './pdf-to-pptx.service';
import { PptxToPdfService } from './pptx-to-pdf.service';
import { XlsxToPdfService } from './xlsx-to-pdf.service';
import { PdfProtectionService } from './pdf-protection.service';
import { PdfNumberPagesService } from './pdf-number-pages.service';
import { MergeOptionsDto } from '../dto/merge-options.dto';
import { CompressOptionsDto } from '../dto/compress-options.dto';
import { ConvertToWordDto } from '../dto/convert-to-word.dto';
import { ConvertToPdfDto } from '../dto/convert-to-pdf.dto';
import { ConvertToPptxDto } from '../dto/convert-to-pptx.dto';
import { ConvertPptxToPdfDto } from '../dto/convert-pptx-to-pdf.dto';
import { ConvertToXlsxDto } from '../dto/convert-to-xlsx.dto';
import { ConvertXlsxToPdfDto } from '../dto/convert-xlsx-to-pdf.dto';

@Injectable()
export class PdfService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(
    private readonly pdfInfoService: PdfInfoService,
    private readonly pdfMergeSplitService: PdfMergeSplitService,
    private readonly pdfExtractRotateService: PdfExtractRotateService,
    private readonly pdfCompressionService: PdfCompressionService,
    private readonly pdfToWordService: PdfToWordService,
    private readonly docxToPdfService: DocxToPdfService,
    private readonly pdfToXlsxService: PdfToXlsxService,
    private readonly pdfToPptxService: PdfToPptxService,
    private readonly pptxToPdfService: PptxToPdfService,
    private readonly xlsxToPdfService: XlsxToPdfService,
    private readonly pdfProtectionService: PdfProtectionService,
    private readonly pdfNumberPagesService: PdfNumberPagesService,
  ) {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  // ---------- PDF Info Methods ----------
  
  async extractPdfInfo(filePath: string) {
    return this.pdfInfoService.extractPdfInfo(filePath);
  }

  async getPdfInfo(filePath: string) {
    return this.pdfInfoService.getPdfInfo(filePath);
  }

  // ---------- PDF Merge/Split Methods ----------
  
  async mergePdfs(filePaths: string[], options?: MergeOptionsDto) {
    return this.pdfMergeSplitService.mergePdfs(filePaths, options);
  }

  async splitPdf(filePath: string) {
    return this.pdfMergeSplitService.splitPdf(filePath);
  }

  async splitPdfAdvanced(filePath: string, options: any) {
    return this.pdfMergeSplitService.splitPdfAdvanced(filePath, options);
  }

  // ---------- PDF Extract/Rotate Methods ----------
  
  async extractPages(filePath: string, pages: number[]) {
    return this.pdfExtractRotateService.extractPages(filePath, pages);
  }

  async rotatePdfPages(filePath: string, rotations: { page: number; degrees: number }[]) {
    return this.pdfExtractRotateService.rotatePdfPages(filePath, rotations);
  }

  // ---------- PDF Compression Methods ----------
  
  async compressPdf(filePath: string, options?: CompressOptionsDto) {
    return this.pdfCompressionService.compressPdf(filePath, options);
  }

  async analyzePdfCompression(filePath: string) {
    return this.pdfCompressionService.analyzePdfCompression(filePath);
  }
  
  // ---------- PDF Protection Methods ----------
  
  async protectPdfWithPassword(filePath: string, options: any): Promise<string> {
    return this.pdfProtectionService.protectPdfWithPassword(filePath, options);
  }
  
  async removePasswordProtection(filePath: string, password: string): Promise<string> {
    return this.pdfProtectionService.removePasswordProtection(filePath, password);
  }
  
  async checkPdfProtection(filePath: string): Promise<any> {
    return this.pdfProtectionService.checkPdfProtection(filePath);
  }

  // ---------- PDF to Word Methods ----------
  
  async convertPdfToWordBasic(filePath: string) {
    return this.pdfToWordService.convertPdfToWordBasic(filePath);
  }

  async convertPdfToWordAdvanced(filePath: string, options?: ConvertToWordDto) {
    return this.pdfToWordService.convertPdfToWordAdvanced(filePath, options);
  }

  // ---------- DOCX to PDF Methods ----------
  
  async convertDocxToPdfBasic(filePath: string) {
    return this.docxToPdfService.convertDocxToPdfBasic(filePath);
  }

  async convertDocxToPdfAdvanced(filePath: string, options?: ConvertToPdfDto) {
    return this.docxToPdfService.convertDocxToPdfAdvanced(filePath, options);
  }

  async convertDocxToPdfA(filePath: string, pdfaVersion: '1b' | '2b' | '3b' = '1b') {
    return this.docxToPdfService.convertDocxToPdfA(filePath, pdfaVersion);
  }

  async generateDocxPreview(filePath: string) {
    return this.docxToPdfService.generateDocxPreview(filePath);
  }

  async analyzeDocxConversion(filePath: string) {
    return this.docxToPdfService.analyzeDocxConversion(filePath);
  }

  // ---------- PDF to XLSX Methods ----------
  
  async convertPdfToXlsxBasic(filePath: string) {
    return this.pdfToXlsxService.convertPdfToXlsxBasic(filePath);
  }

  async convertPdfToXlsxAdvanced(filePath: string, options?: ConvertToXlsxDto) {
    return this.pdfToXlsxService.convertPdfToXlsxAdvanced(filePath, options);
  }

  async analyzePdfForXlsxConversion(filePath: string) {
    return this.pdfToXlsxService.analyzePdfForXlsxConversion(filePath);
  }

  async checkXlsxConversionTools() {
    return this.pdfToXlsxService.checkXlsxConversionTools();
  }

  // ---------- PDF to PPTX Methods ----------
  
  async convertPdfToPptxBasic(filePath: string) {
    return this.pdfToPptxService.convertPdfToPptxBasic(filePath);
  }

  async convertPdfToPptxAdvanced(filePath: string, options?: ConvertToPptxDto) {
    return this.pdfToPptxService.convertPdfToPptxAdvanced(filePath, options);
  }

  async createCustomPresentation(filePath: string, options?: any) {
    return this.pdfToPptxService.createCustomPresentation(filePath, options);
  }

  // ---------- PPTX to PDF Methods ----------
  
  async convertPptxToPdfBasic(filePath: string) {
    return this.pptxToPdfService.convertPptxToPdfBasic(filePath);
  }

  async convertPptxToPdfAdvanced(filePath: string, options?: ConvertPptxToPdfDto) {
    return this.pptxToPdfService.convertPptxToPdfAdvanced(filePath, options);
  }

  async convertPptxToPdfA(filePath: string, version: '1b' | '2b' | '3b' = '1b') {
    // Use the advanced conversion with the appropriate PDF/A compliance option
    const options: ConvertPptxToPdfDto = {
      compliance: version === '1b' 
        ? 'pdf/a-1b' as any // Using type assertion since we don't have the enums here
        : version === '2b' 
          ? 'pdf/a-2b' as any
          : 'pdf/a-3b' as any
    };
    return this.pptxToPdfService.convertPptxToPdfAdvanced(filePath, options);
  }

  async generatePptxPreview(filePath: string) {
    // Create a lower-quality preview version
    const options: ConvertPptxToPdfDto = {
      quality: 'draft' as any,
      imageHandling: 'compress' as any
    };
    return this.pptxToPdfService.convertPptxToPdfAdvanced(filePath, options);
  }

  async analyzePptxConversion(filePath: string) {
    // Basic analysis for now - in a real implementation, we would
    // call appropriate utility functions to analyze the PPTX file
    try {
      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      return {
        filename: path.basename(filePath),
        fileSize: `${fileSizeMB.toFixed(2)} MB`,
        fileFormat: path.extname(filePath).toLowerCase() === '.pptx' ? 'PPTX' : 'PPT',
        compatibility: {
          isCompatible: true,
          warning: fileSizeMB > 20 ? 'Large file size may result in longer conversion time' : null,
          error: null,
          recommendedQuality: fileSizeMB > 50 ? 'draft' : 'standard'
        },
        conversionTools: {
          libreOfficeAvailable: true, // We assume LibreOffice is available
          otherToolsAvailable: false,
          canPerformBasicConversion: true,
          canPerformAdvancedConversion: true
        },
        estimatedConversionTime: Math.max(1, Math.round(fileSizeMB * 0.2))
      };
    } catch (error) {
      throw new HttpException(
        `Failed to analyze PPTX file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ---------- XLSX to PDF Methods ----------
  
  async convertXlsxToPdfBasic(filePath: string) {
    return this.xlsxToPdfService.convertXlsxToPdfBasic(filePath);
  }

  async convertXlsxToPdfAdvanced(filePath: string, options?: ConvertXlsxToPdfDto) {
    return this.xlsxToPdfService.convertXlsxToPdfAdvanced(filePath, options);
  }

  async convertXlsxToPdfA(filePath: string, pdfaVersion: '1b' | '2b' | '3b' = '1b') {
    return this.xlsxToPdfService.convertXlsxToPdfA(filePath, pdfaVersion);
  }

  async generateXlsxPreview(filePath: string) {
    return this.xlsxToPdfService.generateXlsxPreview(filePath);
  }

  async analyzeXlsxForPdfConversion(filePath: string) {
    return this.xlsxToPdfService.analyzeXlsxForPdfConversion(filePath);
  }

  async checkXlsxToPdfTools() {
    return this.xlsxToPdfService.checkXlsxToPdfTools();
  }

  // ---------- Common Utility Methods ----------
  
  getFilePath(filename: string): string {
    return path.join(this.uploadsDir, filename);
  }
  
  getUploadsDir(): string {
    return this.uploadsDir;
  }

  cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to clean up file ${filePath}:`, error);
    }
  }
}