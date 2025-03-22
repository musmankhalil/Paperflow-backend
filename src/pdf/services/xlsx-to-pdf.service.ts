import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { PDFDocument } from 'pdf-lib';
import { ConvertToPdfDto, PdfQuality, PdfCompliance } from '../dto/convert-to-pdf.dto';
import { ConvertXlsxToPdfDto } from '../dto/convert-xlsx-to-pdf.dto';

const execPromise = promisify(exec);

export enum XlsxPrintOptions {
  FIT_TO_PAGE = 'fit_to_page',
  ACTUAL_SIZE = 'actual_size',
  SCALE = 'scale',
}

export enum XlsxPaperSize {
  A4 = 'a4',
  LETTER = 'letter',
  LEGAL = 'legal',
  A3 = 'a3',
  TABLOID = 'tabloid',
}

export enum XlsxSheetSelection {
  ALL = 'all',
  SPECIFIC = 'specific',
  RANGE = 'range',
}

export interface XlsxAdvancedOptions {
  printTitle?: boolean;
  printGridlines?: boolean;
  printHeadings?: boolean;
  printComments?: boolean;
  printQuality?: 'draft' | 'normal' | 'high';
  centerHorizontally?: boolean;
  centerVertically?: boolean;
}

@Injectable()
export class XlsxToPdfService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Check available conversion tools for XLSX to PDF conversion
   * @returns Object with tool availability flags
   */
  private async getAvailableTools(): Promise<{
    libreOfficeAvailable: boolean;
    unoconvAvailable: boolean;
    excelJsAvailable: boolean;
    pythonAvailable: boolean;
  }> {
    const result = {
      libreOfficeAvailable: false,
      unoconvAvailable: false,
      excelJsAvailable: true, // We assume the ExcelJS library is available via npm
      pythonAvailable: false,
    };

    try {
      // Check if LibreOffice is available
      const libreOfficeCheck = await execPromise('libreoffice --version').catch(() => null);
      result.libreOfficeAvailable = !!libreOfficeCheck;

      // Check if unoconv is available
      const unoconvCheck = await execPromise('unoconv --version').catch(() => null);
      result.unoconvAvailable = !!unoconvCheck;

      // Check if Python is available
      const pythonCheck = await execPromise('python3 --version').catch(() => null);
      result.pythonAvailable = !!pythonCheck;

      return result;
    } catch (error) {
      console.error('Error checking available XLSX to PDF conversion tools:', error);
      return result;
    }
  }

  /**
   * Check XLSX file compatibility for conversion to PDF
   * @param filePath Path to the XLSX file
   * @returns Compatibility check results
   */
  async checkXlsxCompatibility(filePath: string): Promise<{
    isCompatible: boolean;
    warning?: string;
    error?: string;
    recommendedPaperSize?: XlsxPaperSize;
    recommendedPrintOption?: XlsxPrintOptions;
  }> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          isCompatible: false,
          error: 'File does not exist',
        };
      }

      // Check file extension
      const fileExt = path.extname(filePath).toLowerCase();
      if (fileExt !== '.xlsx' && fileExt !== '.xls') {
        return {
          isCompatible: false,
          error: 'File is not an Excel spreadsheet (must be .xlsx or .xls)',
        };
      }

      // Check file size
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      const isLargeFile = fileSizeMB > 20; // Consider files > 20MB as large

      // Basic compatibility result
      return {
        isCompatible: true,
        warning: isLargeFile
          ? 'Large Excel file may require more processing time and memory'
          : undefined,
        recommendedPaperSize: XlsxPaperSize.A4,
        recommendedPrintOption: XlsxPrintOptions.FIT_TO_PAGE,
      };
    } catch (error) {
      console.error('Error checking XLSX compatibility:', error);
      return {
        isCompatible: false,
        error: `Failed to analyze Excel file: ${error.message}`,
      };
    }
  }

  /**
   * Analyze XLSX file for PDF conversion
   * @param filePath Path to the XLSX file
   * @returns Analysis results with conversion recommendations
   */
  async analyzeXlsxForPdfConversion(filePath: string): Promise<any> {
    try {
      console.log(`Analyzing XLSX for PDF conversion: ${filePath}`);

      // Check file compatibility
      const compatibility = await this.checkXlsxCompatibility(filePath);

      // Check available tools
      const tools = await this.getAvailableTools();

      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);

      // Return detailed analysis
      return {
        filename: path.basename(filePath),
        fileSize: `${fileSizeMB.toFixed(2)} MB`,
        fileFormat: path.extname(filePath).toLowerCase() === '.xlsx' ? 'XLSX' : 'XLS',
        sheetAnalysis: {
          // In a real implementation, we would analyze the sheet structure here
          estimatedSheetCount: 1, // This would be determined by actual analysis
          estimatedPrintableArea: 'Medium', // This would be determined by actual analysis
          hasMacros: false, // This would be determined by actual analysis
          hasImages: false, // This would be determined by actual analysis
          hasTables: true, // This would be determined by actual analysis
        },
        compatibility: {
          isCompatible: compatibility.isCompatible,
          warning: compatibility.warning || null,
          error: compatibility.error || null,
        },
        availableTools: {
          libreOfficeAvailable: tools.libreOfficeAvailable,
          unoconvAvailable: tools.unoconvAvailable,
          excelJsAvailable: tools.excelJsAvailable,
          pythonAvailable: tools.pythonAvailable,
          canPerformBasicConversion: tools.libreOfficeAvailable || tools.unoconvAvailable,
          canPerformAdvancedConversion: tools.libreOfficeAvailable,
        },
        recommendations: {
          recommendedPaperSize: compatibility.recommendedPaperSize || XlsxPaperSize.A4,
          recommendedPrintOption: compatibility.recommendedPrintOption || XlsxPrintOptions.FIT_TO_PAGE,
          recommendedTool: tools.libreOfficeAvailable
            ? 'libreoffice'
            : tools.unoconvAvailable
            ? 'unoconv'
            : tools.pythonAvailable
            ? 'python'
            : 'electron', // Fallback to Electron/ExcelJS approach
        },
      };
    } catch (error) {
      console.error('Error analyzing XLSX for PDF conversion:', error);
      throw new HttpException(
        `Failed to analyze Excel file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Basic XLSX to PDF conversion
   * @param filePath Path to the XLSX file
   * @returns Path to the converted PDF file
   */
  async convertXlsxToPdfBasic(filePath: string): Promise<string> {
    try {
      console.log(`Starting basic XLSX to PDF conversion for: ${filePath}`);

      // Ensure the input file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(`Input file not found: ${filePath}`, HttpStatus.NOT_FOUND);
      }

      // Check file compatibility
      const compatibility = await this.checkXlsxCompatibility(filePath);
      if (!compatibility.isCompatible) {
        throw new HttpException(
          `File is not compatible for conversion: ${compatibility.error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check available tools
      const tools = await this.getAvailableTools();
      if (!tools.libreOfficeAvailable && !tools.unoconvAvailable) {
        throw new HttpException(
          'No compatible conversion tools available. Please install LibreOffice or unoconv.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Generate output file path
      const fileBaseName = path.basename(filePath, path.extname(filePath));
      const outputPath = path.join(this.uploadsDir, `${fileBaseName}-${Date.now()}.pdf`);

      // Try conversion using available tools
      try {
        if (tools.libreOfficeAvailable) {
          await this.convertWithLibreOffice(filePath, outputPath);
        } else if (tools.unoconvAvailable) {
          await this.convertWithUnoconv(filePath, outputPath);
        } else {
          throw new Error('No compatible conversion tools available');
        }

        // Check if conversion was successful
        if (!fs.existsSync(outputPath)) {
          throw new Error('PDF file not created after conversion');
        }

        console.log(`XLSX successfully converted to PDF: ${outputPath}`);
        return outputPath;
      } catch (conversionError) {
        console.error('Error during XLSX to PDF conversion:', conversionError);
        throw conversionError;
      }
    } catch (error) {
      console.error('XLSX to PDF basic conversion error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert XLSX to PDF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Advanced XLSX to PDF conversion with detailed configuration options
   * @param filePath Path to the XLSX file
   * @param options Conversion options
   * @returns Path to the converted PDF file
   */
  async convertXlsxToPdfAdvanced(
    filePath: string,
    options: ConvertXlsxToPdfDto = {},
  ): Promise<string> {
    try {
      console.log(`Starting advanced XLSX to PDF conversion for: ${filePath}`);
      console.log(`Conversion options:`, JSON.stringify(options, null, 2));

      // Ensure the input file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(`Input file not found: ${filePath}`, HttpStatus.NOT_FOUND);
      }

      // Check file compatibility
      const compatibility = await this.checkXlsxCompatibility(filePath);
      if (!compatibility.isCompatible) {
        throw new HttpException(
          `File is not compatible for conversion: ${compatibility.error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check available tools
      const tools = await this.getAvailableTools();
      if (!tools.libreOfficeAvailable && !tools.unoconvAvailable) {
        throw new HttpException(
          'No compatible conversion tools available. Please install LibreOffice or unoconv.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Set default options if not provided
      const {
        quality = PdfQuality.STANDARD,
        compliance = PdfCompliance.PDF_1_7,
        paperSize = compatibility.recommendedPaperSize || XlsxPaperSize.A4,
        printOption = compatibility.recommendedPrintOption || XlsxPrintOptions.FIT_TO_PAGE,
        landscape = false,
        sheetSelection = XlsxSheetSelection.ALL,
        specificSheets = [],
        xlsxAdvanced = {
          printGridlines: true,
          printHeadings: true,
          centerHorizontally: true,
        },
      } = options;

      // Generate output file path
      const fileBaseName = path.basename(filePath, path.extname(filePath));
      const outputPath = path.join(
        this.uploadsDir,
        `${fileBaseName}-${quality}-${Date.now()}.pdf`,
      );

      // Try appropriate conversion method based on tools and options
      try {
        if (tools.libreOfficeAvailable) {
          // LibreOffice provides the most advanced options support
          await this.convertWithLibreOfficeAdvanced(filePath, outputPath, {
            quality,
            compliance,
            paperSize,
            printOption,
            landscape,
            sheetSelection,
            specificSheets,
            xlsxAdvanced,
          });
        } else if (tools.unoconvAvailable) {
          // Unoconv has more limited options support
          await this.convertWithUnoconvAdvanced(filePath, outputPath, {
            quality,
            paperSize,
            landscape,
          });
        } else {
          throw new Error('No compatible conversion tools available');
        }

        // Check if conversion was successful
        if (!fs.existsSync(outputPath)) {
          throw new Error('PDF file not created after conversion');
        }

        // Apply PDF/A compliance if needed and not already applied
        if (
          compliance !== PdfCompliance.PDF_1_7 &&
          tools.libreOfficeAvailable &&
          tools.libreOfficeAvailable // Double check LibreOffice (needed for PDF/A)
        ) {
          const pdfaPath = await this.convertToPdfA(outputPath, compliance);
          return pdfaPath;
        }

        console.log(`XLSX successfully converted to PDF with advanced options: ${outputPath}`);
        return outputPath;
      } catch (conversionError) {
        console.error('Error during advanced conversion:', conversionError);
        throw conversionError;
      }
    } catch (error) {
      console.error('XLSX to PDF advanced conversion error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert XLSX to PDF with advanced options: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Convert XLSX to PDF/A for archival purposes
   * @param filePath Path to the XLSX file (or intermediate PDF)
   * @param pdfaVersion PDF/A version to use
   * @returns Path to the converted PDF/A file
   */
  async convertXlsxToPdfA(
    filePath: string,
    pdfaVersion: '1b' | '2b' | '3b' = '1b',
  ): Promise<string> {
    try {
      console.log(`Converting to PDF/A-${pdfaVersion} from: ${filePath}`);

      // Determine if input is XLSX or already a PDF
      const inputExt = path.extname(filePath).toLowerCase();
      let pdfPath: string;

      if (inputExt === '.xlsx' || inputExt === '.xls') {
        // First convert XLSX to standard PDF
        pdfPath = await this.convertXlsxToPdfBasic(filePath);
      } else if (inputExt === '.pdf') {
        // Already a PDF, use as is
        pdfPath = filePath;
      } else {
        throw new HttpException(
          'Input file must be an Excel spreadsheet (.xlsx/.xls) or PDF',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Now convert the PDF to PDF/A
      return this.convertToPdfA(pdfPath, this.getPdfaCompliance(pdfaVersion));
    } catch (error) {
      console.error('Error converting to PDF/A:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert to PDF/A: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate a preview of the XLSX file as PDF
   * @param filePath Path to the XLSX file
   * @returns Path to the preview PDF
   */
  async generateXlsxPreview(filePath: string): Promise<string> {
    try {
      console.log(`Generating preview for XLSX: ${filePath}`);

      // Use draft quality for previews
      const options: ConvertXlsxToPdfDto = {
        quality: PdfQuality.DRAFT,
        advanced: {
          imageQuality: 75,
          compressImages: true,
          downsampleDpi: 150,
        },
        xlsxAdvanced: {
          printQuality: 'draft',
        },
      };

      // Convert using advanced options but optimized for preview
      return this.convertXlsxToPdfAdvanced(filePath, options);
    } catch (error) {
      console.error('Error generating XLSX preview:', error);
      throw new HttpException(
        `Failed to generate preview: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check available conversion tools for XLSX to PDF conversion
   * @returns Object with tool availability flags
   */
  async checkXlsxToPdfTools(): Promise<any> {
    try {
      const tools = await this.getAvailableTools();

      return {
        libreOfficeAvailable: tools.libreOfficeAvailable,
        unoconvAvailable: tools.unoconvAvailable,
        excelJsAvailable: tools.excelJsAvailable,
        pythonAvailable: tools.pythonAvailable,
        recommendedMethod: tools.libreOfficeAvailable
          ? 'libreoffice'
          : tools.unoconvAvailable
          ? 'unoconv'
          : 'electron',
        canPerformBasicConversion: tools.libreOfficeAvailable || tools.unoconvAvailable,
        canPerformAdvancedConversion: tools.libreOfficeAvailable,
      };
    } catch (error) {
      console.error('Error checking XLSX to PDF conversion tools:', error);
      return {
        error: `Failed to check conversion tools: ${error.message}`,
        canPerformBasicConversion: false,
        canPerformAdvancedConversion: false,
      };
    }
  }

  /**
   * Convert PDF to PDF/A using LibreOffice
   * @param pdfPath Path to the input PDF
   * @param compliance PDF/A compliance level
   * @returns Path to the converted PDF/A
   */
  private async convertToPdfA(pdfPath: string, compliance: PdfCompliance): Promise<string> {
    try {
      const outputDir = this.uploadsDir;
      const fileBaseName = path.basename(pdfPath, '.pdf');
      const outputPath = path.join(
        outputDir,
        `${fileBaseName}-pdfa-${compliance}-${Date.now()}.pdf`,
      );

      // Map compliance to LibreOffice filter option
      let pdfaFilter = 'writer_pdf_Export';
      switch (compliance) {
        case PdfCompliance.PDF_A_1B:
          pdfaFilter = 'writer_pdf_Export PDFVersion=4 SelectPdfVersion=1 UseLosslessCompression=false';
          break;
        case PdfCompliance.PDF_A_2B:
          pdfaFilter = 'writer_pdf_Export PDFVersion=5 SelectPdfVersion=1 UseLosslessCompression=false';
          break;
        case PdfCompliance.PDF_A_3B:
          pdfaFilter = 'writer_pdf_Export PDFVersion=6 SelectPdfVersion=1 UseLosslessCompression=false';
          break;
      }

      // Run LibreOffice conversion with PDF/A filter
      const command = `libreoffice --headless --convert-to pdf:"${pdfaFilter}" --outdir "${outputDir}" "${pdfPath}"`;
      await execPromise(command, { timeout: 120000 }); // 2 minute timeout

      // LibreOffice outputs with original name, so we need to rename
      const libreOfficePath = path.join(outputDir, `${fileBaseName}.pdf`);
      if (fs.existsSync(libreOfficePath) && libreOfficePath !== pdfPath) {
        fs.renameSync(libreOfficePath, outputPath);
      }

      // Check if conversion was successful
      if (!fs.existsSync(outputPath)) {
        throw new Error('PDF/A file not created after conversion');
      }

      console.log(`PDF successfully converted to PDF/A: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('Error converting to PDF/A:', error);
      throw error;
    }
  }

  /**
   * Basic conversion with LibreOffice
   */
  private async convertWithLibreOffice(filePath: string, outputPath: string): Promise<void> {
    try {
      const outputDir = path.dirname(outputPath);
      const outputFilename = path.basename(outputPath);

      // Run LibreOffice to convert XLSX to PDF
      const command = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${filePath}"`;
      await execPromise(command, { timeout: 120000 }); // 2 minute timeout

      // LibreOffice outputs with original name, so we need to rename
      const originalName = path.basename(filePath, path.extname(filePath)) + '.pdf';
      const libreOfficePath = path.join(outputDir, originalName);

      if (fs.existsSync(libreOfficePath) && libreOfficePath !== outputPath) {
        fs.renameSync(libreOfficePath, outputPath);
      }
    } catch (error) {
      console.error('Error converting with LibreOffice:', error);
      throw error;
    }
  }

  /**
   * Advanced conversion with LibreOffice
   */
  private async convertWithLibreOfficeAdvanced(
    filePath: string,
    outputPath: string,
    options: any,
  ): Promise<void> {
    try {
      const outputDir = path.dirname(outputPath);
      const outputFilename = path.basename(outputPath);

      // Create a temporary settings file for LibreOffice conversion
      const settingsPath = path.join(this.uploadsDir, `lo_settings_${Date.now()}.xml`);
      const settingsContent = this.generateLibreOfficeSettings(options);
      fs.writeFileSync(settingsPath, settingsContent);

      // Run LibreOffice with the settings file
      const command = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" --infilter="Calc MS Excel 2007 XML" "${filePath}"`;
      await execPromise(command, { timeout: 180000 }); // 3 minute timeout for advanced conversion

      // Clean up settings file
      fs.unlinkSync(settingsPath);

      // LibreOffice outputs with original name, so we need to rename
      const originalName = path.basename(filePath, path.extname(filePath)) + '.pdf';
      const libreOfficePath = path.join(outputDir, originalName);

      if (fs.existsSync(libreOfficePath) && libreOfficePath !== outputPath) {
        fs.renameSync(libreOfficePath, outputPath);
      }
    } catch (error) {
      console.error('Error converting with LibreOffice advanced:', error);
      throw error;
    }
  }

  /**
   * Basic conversion with unoconv
   */
  private async convertWithUnoconv(filePath: string, outputPath: string): Promise<void> {
    try {
      // Run unoconv to convert XLSX to PDF
      const command = `unoconv -f pdf -o "${outputPath}" "${filePath}"`;
      await execPromise(command, { timeout: 120000 }); // 2 minute timeout
    } catch (error) {
      console.error('Error converting with unoconv:', error);
      throw error;
    }
  }

  /**
   * Advanced conversion with unoconv
   */
  private async convertWithUnoconvAdvanced(
    filePath: string,
    outputPath: string,
    options: any,
  ): Promise<void> {
    try {
      // Build unoconv command with options
      let command = `unoconv -f pdf`;

      // Add paper size if specified
      if (options.paperSize) {
        let paperFormat: string;
        switch (options.paperSize) {
          case XlsxPaperSize.A4:
            paperFormat = 'A4';
            break;
          case XlsxPaperSize.LETTER:
            paperFormat = 'Letter';
            break;
          case XlsxPaperSize.LEGAL:
            paperFormat = 'Legal';
            break;
          case XlsxPaperSize.A3:
            paperFormat = 'A3';
            break;
          case XlsxPaperSize.TABLOID:
            paperFormat = 'Tabloid';
            break;
          default:
            paperFormat = 'A4';
        }
        command += ` -e PageFormat=${paperFormat}`;
      }

      // Add orientation if specified
      if (options.landscape !== undefined) {
        command += ` -e Orientation=${options.landscape ? 'landscape' : 'portrait'}`;
      }

      // Add output path
      command += ` -o "${outputPath}" "${filePath}"`;

      // Run unoconv
      await execPromise(command, { timeout: 180000 }); // 3 minute timeout for advanced conversion
    } catch (error) {
      console.error('Error converting with unoconv advanced:', error);
      throw error;
    }
  }

  /**
   * Generate LibreOffice settings XML based on options
   */
  private generateLibreOfficeSettings(options: any): string {
    // This is a simplified version - in a real implementation,
    // this would create a proper LibreOffice settings XML file
    // based on the conversion options
    return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-settings xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0">
  <office:settings>
    <config:config-item-set config:name="view-settings">
      <config:config-item config:name="ShowGrid" config:type="boolean">${
        options.xlsxAdvanced?.printGridlines ? 'true' : 'false'
      }</config:config-item>
      <config:config-item config:name="HasColumnRowHeaders" config:type="boolean">${
        options.xlsxAdvanced?.printHeadings ? 'true' : 'false'
      }</config:config-item>
    </config:config-item-set>
    <config:config-item-set config:name="print">
      <config:config-item config:name="PrinterName" config:type="string">PDF</config:config-item>
      <config:config-item config:name="PageSize" config:type="string">${options.paperSize || 'A4'}</config:config-item>
      <config:config-item config:name="Orientation" config:type="string">${
        options.landscape ? 'landscape' : 'portrait'
      }</config:config-item>
      <config:config-item config:name="FitToSize" config:type="boolean">${
        options.printOption === XlsxPrintOptions.FIT_TO_PAGE ? 'true' : 'false'
      }</config:config-item>
      <config:config-item config:name="CenterHorizontally" config:type="boolean">${
        options.xlsxAdvanced?.centerHorizontally ? 'true' : 'false'
      }</config:config-item>
      <config:config-item config:name="CenterVertically" config:type="boolean">${
        options.xlsxAdvanced?.centerVertically ? 'true' : 'false'
      }</config:config-item>
    </config:config-item-set>
  </office:settings>
</office:document-settings>`;
  }

  /**
   * Map PDF/A version string to PdfCompliance enum
   */
  private getPdfaCompliance(version: string): PdfCompliance {
    switch (version) {
      case '1b':
        return PdfCompliance.PDF_A_1B;
      case '2b':
        return PdfCompliance.PDF_A_2B;
      case '3b':
        return PdfCompliance.PDF_A_3B;
      default:
        return PdfCompliance.PDF_A_1B;
    }
  }
}
