import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { 
  checkPptxCompatibility, 
  checkConversionTools, 
  estimateConversionTime 
} from './utils/pptx-to-pdf';
import { MergeOptionsDto } from './dto/merge-options.dto';
import { CompressOptionsDto } from './dto/compress-options.dto';
import { ConvertToWordDto } from './dto/convert-to-word.dto';
import { ConvertToPdfDto } from './dto/convert-to-pdf.dto';
import { ConvertToPptxDto } from './dto/convert-to-pptx.dto';
import { ConvertPptxToPdfDto, PptxPdfQuality, PptxPdfCompliance, PptxImageHandling } from './dto/convert-pptx-to-pdf.dto';
import { ConvertToXlsxDto } from './dto/convert-to-xlsx.dto';
import { PageNumberOptionsDto } from './dto/page-number-options.dto';
import { PdfInfoService } from './services/pdf-info.service';
import { PdfMergeSplitService } from './services/pdf-merge-split.service';
import { PdfExtractRotateService } from './services/pdf-extract-rotate.service';
import { PdfCompressionService } from './services/pdf-compression.service';
import { PdfProtectionService } from './services/pdf-protection.service';
import { PdfToWordService } from './services/pdf-to-word.service';
import { DocxToPdfService } from './services/docx-to-pdf.service';
import { PdfToXlsxService } from './services/pdf-to-xlsx.service';
import { PdfToPptxService } from './services/pdf-to-pptx.service';
import { PptxToPdfService } from './services/pptx-to-pdf.service';
import { XlsxToPdfService } from './services/xlsx-to-pdf.service';
import { PdfNumberPagesService, PageNumberOptions } from './services/pdf-number-pages.service';
import { PdfWatermarkService } from './services/pdf-watermark.service';
import { PdfToImageService } from './services/pdf-to-image.service';
import { WatermarkOptionsDto } from './dto/watermark-options.dto';

@Injectable()
export class PdfService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(
    private readonly pdfInfoService: PdfInfoService,
    private readonly pdfMergeSplitService: PdfMergeSplitService,
    private readonly pdfExtractRotateService: PdfExtractRotateService,
    private readonly pdfCompressionService: PdfCompressionService,
    private readonly pdfProtectionService: PdfProtectionService,
    private readonly pdfToWordService: PdfToWordService,
    private readonly docxToPdfService: DocxToPdfService,
    private readonly pdfToXlsxService: PdfToXlsxService,
    private readonly pdfToPptxService: PdfToPptxService,
    private readonly pptxToPdfService: PptxToPdfService,
    private readonly xlsxToPdfService: XlsxToPdfService,
    private readonly pdfNumberPagesService: PdfNumberPagesService,
    private readonly pdfWatermarkService: PdfWatermarkService,
    private readonly pdfToImageService: PdfToImageService,
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
        ? PptxPdfCompliance.PDF_A_1B 
        : version === '2b' 
          ? PptxPdfCompliance.PDF_A_2B 
          : PptxPdfCompliance.PDF_A_3B
    };
    return this.pptxToPdfService.convertPptxToPdfAdvanced(filePath, options);
  }

  async generatePptxPreview(filePath: string) {
    // Create a lower-quality preview version
    const options: ConvertPptxToPdfDto = {
      quality: PptxPdfQuality.DRAFT,
      imageHandling: PptxImageHandling.COMPRESS
    };
    return this.pptxToPdfService.convertPptxToPdfAdvanced(filePath, options);
  }

  async analyzePptxConversion(filePath: string) {
    // Check for compatibility issues and return analysis
    try {
      const compatibility = await checkPptxCompatibility(filePath);
      const tools = checkConversionTools();
      
      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      return {
        filename: path.basename(filePath),
        fileSize: `${fileSizeMB.toFixed(2)} MB`,
        fileFormat: path.extname(filePath).toLowerCase() === '.pptx' ? 'PPTX' : 'PPT',
        compatibility: {
          isCompatible: compatibility.isCompatible,
          warning: compatibility.warning || null,
          error: compatibility.error || null,
          recommendedQuality: compatibility.recommendedQuality || PptxPdfQuality.STANDARD
        },
        conversionTools: {
          libreOfficeAvailable: tools.libreOffice,
          otherToolsAvailable: tools.otherTools,
          canPerformBasicConversion: tools.libreOffice || tools.otherTools,
          canPerformAdvancedConversion: tools.libreOffice
        },
        estimatedConversionTime: estimateConversionTime(filePath, PptxPdfQuality.STANDARD)
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

  async convertXlsxToPdfAdvanced(filePath: string, options?: any) {
    return this.xlsxToPdfService.convertXlsxToPdfAdvanced(filePath, options);
  }

  async convertXlsxToPdfA(filePath: string, version: '1b' | '2b' | '3b' = '1b') {
    return this.xlsxToPdfService.convertXlsxToPdfA(filePath, version);
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

  // ---------- PDF Page Numbering Methods ----------
  
  async addPageNumbers(filePath: string, options: PageNumberOptionsDto): Promise<string> {
    // Convert DTO to PageNumberOptions
    const pageNumberOptions: PageNumberOptions = {
      position: options.position,
      startNumber: options.startNumber,
      prefix: options.prefix,
      suffix: options.suffix,
      fontSize: options.fontSize,
      opacity: options.opacity,
      margin: options.margin,
      skipFirstPage: options.skipFirstPage,
      skipLastPage: options.skipLastPage,
      pageRange: options.pageRange,
    };
    
    // Handle fontColor (ensure all properties are defined if any is provided)
    if (options.fontColor) {
      pageNumberOptions.fontColor = {
        r: options.fontColor.r ?? 0, // Default to black if not provided
        g: options.fontColor.g ?? 0,
        b: options.fontColor.b ?? 0
      };
    }
    
    return this.pdfNumberPagesService.addPageNumbers(filePath, pageNumberOptions);
  }

  // ---------- PDF Watermark Methods ----------
  
  async addWatermark(filePath: string, options: WatermarkOptionsDto): Promise<string> {
    return this.pdfWatermarkService.addWatermark(filePath, options);
  }

  // ---------- PDF to Image Methods ----------
  
  async convertPdfToImage(filePath: string, options?: any): Promise<{ zipPath: string; pageCount: number }> {
    return this.pdfToImageService.convertPdfToImage(filePath, options);
  }

  async convertPdfPageToImage(filePath: string, pageNumber: number, options?: any): Promise<string> {
    return this.pdfToImageService.convertSinglePage(filePath, pageNumber, options);
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
