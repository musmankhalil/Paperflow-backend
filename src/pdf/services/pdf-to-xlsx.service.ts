import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { execSync } from 'child_process';
import { ConvertToXlsxDto, TableExtractionMode, DataRecognitionLevel, SpreadsheetFormat } from '../dto/convert-to-xlsx.dto';
import { 
  checkConversionTools, 
  checkPdfCompatibility, 
  createTabulaScript, 
  createCamelotScript, 
  convertWithLibreOffice,
  estimateConversionTime,
  cleanupTempFiles
} from '../utils/pdf-to-xlsx';

const execPromise = promisify(require('child_process').exec);

@Injectable()
export class PdfToXlsxService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Basic PDF to XLSX conversion with simple configuration
   * @param filePath Path to the PDF file
   * @returns Path to the converted XLSX file
   */
  async convertPdfToXlsxBasic(filePath: string): Promise<string> {
    try {
      console.log(`Starting basic PDF to XLSX conversion for: ${filePath}`);
      
      // Ensure the input file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(
          `Input file not found: ${filePath}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if necessary tools are installed
      const tools = await checkConversionTools();
      
      // Choose conversion method based on available tools
      if (!tools.pythonAvailable && !tools.libreOffice) {
        throw new HttpException(
          'Neither Python with table extraction packages nor LibreOffice is installed on the server. Please install required dependencies for PDF to XLSX conversion.',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Generate output file path
      const outputPath = path.join(this.uploadsDir, `converted-${Date.now()}.xlsx`);
      
      // Try different conversion methods based on available tools
      try {
        if (tools.tabula || tools.camelot) {
          // Use Python-based conversion if tabula or camelot is available
          const options = {
            extractionMode: TableExtractionMode.AUTO,
            recognitionLevel: DataRecognitionLevel.STANDARD,
            outputFormat: SpreadsheetFormat.XLSX,
            dataCleanup: {
              removeEmptyRows: true,
              normalizeWhitespace: true,
              trimTextCells: true
            },
            formatting: {
              autoDetectDataTypes: true
            }
          };

          // Generate appropriate script based on available tools
          let scriptPath: string;
          if (tools.camelot) {
            scriptPath = createCamelotScript(filePath, outputPath, options);
          } else {
            scriptPath = createTabulaScript(filePath, outputPath, options);
          }

          // Execute the Python script
          const { stderr, stdout } = await execPromise(`python3 "${scriptPath}"`);
          console.log('PDF to XLSX conversion output:', stdout);
          
          if (stderr && !stderr.includes('WARNING')) {
            console.error('PDF to XLSX conversion error:', stderr);
          }
          
          // Clean up temporary script
          cleanupTempFiles([scriptPath]);
          
        } else if (tools.libreOffice) {
          // Fall back to LibreOffice if Python tools are not available
          await convertWithLibreOffice(filePath, this.uploadsDir);
        }
        
        // Check if conversion was successful
        if (!fs.existsSync(outputPath)) {
          throw new Error('XLSX file not created after conversion');
        }
        
        console.log(`PDF successfully converted to XLSX: ${outputPath}`);
        return outputPath;
      } catch (conversionError) {
        console.error('Error during PDF to XLSX conversion:', conversionError);
        
        // Try LibreOffice as a fallback if Python conversion failed
        if (tools.libreOffice && (tools.tabula || tools.camelot)) {
          try {
            console.log('Attempting conversion with LibreOffice as fallback...');
            await convertWithLibreOffice(filePath, this.uploadsDir);
            
            // Check if conversion was successful
            if (fs.existsSync(outputPath)) {
              console.log(`PDF successfully converted to XLSX with LibreOffice: ${outputPath}`);
              return outputPath;
            }
          } catch (libreOfficeError) {
            console.error('Error during LibreOffice fallback conversion:', libreOfficeError);
          }
        }
        
        throw new HttpException(
          `PDF to XLSX conversion failed with all available methods. Error: ${conversionError.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      console.error('PDF to XLSX basic conversion error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert PDF to XLSX: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Advanced PDF to XLSX conversion with detailed configuration options
   * @param filePath Path to the PDF file
   * @param options Conversion options
   * @returns Path to the converted XLSX file
   */
  async convertPdfToXlsxAdvanced(filePath: string, options: ConvertToXlsxDto = {}): Promise<string> {
    try {
      console.log(`Starting advanced PDF to XLSX conversion for: ${filePath}`);
      console.log(`Conversion options:`, JSON.stringify(options, null, 2));
      
      // Ensure the input file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(
          `Input file not found: ${filePath}`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if necessary tools are installed
      const tools = await checkConversionTools();
      
      // Check compatibility
      const compatibility = await checkPdfCompatibility(filePath);
      if (!compatibility.isCompatible) {
        throw new HttpException(
          `File is not compatible for conversion: ${compatibility.error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Choose conversion method based on available tools and options
      if (!tools.pythonAvailable && !tools.libreOffice) {
        throw new HttpException(
          'Neither Python with table extraction packages nor LibreOffice is installed on the server. Please install required dependencies for PDF to XLSX conversion.',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Set default options if not provided
      const {
        extractionMode = compatibility.recommendedExtractionMode || TableExtractionMode.AUTO,
        recognitionLevel = compatibility.recommendedRecognitionLevel || DataRecognitionLevel.STANDARD,
        outputFormat = SpreadsheetFormat.XLSX,
        tableDetection = {},
        formatting = {},
        dataCleanup = {},
        advanced = {},
        pageSelection = {}
      } = options;

      // Generate output file path with the correct extension
      let outputExt = '.xlsx';
      switch (outputFormat) {
        case SpreadsheetFormat.CSV:
          outputExt = '.csv';
          break;
        case SpreadsheetFormat.ODS:
          outputExt = '.ods';
          break;
        default:
          outputExt = '.xlsx';
      }
      
      const outputPath = path.join(this.uploadsDir, `converted-advanced-${Date.now()}${outputExt}`);
      
      // Try appropriate conversion method based on tools and options
      try {
        // Determine the best Python package to use based on extraction mode and available tools
        const useCamelot = tools.camelot && 
          (extractionMode === TableExtractionMode.PRECISE || extractionMode === TableExtractionMode.STRUCTURED);
          
        const useTabula = tools.tabula && 
          (extractionMode === TableExtractionMode.AUTO || extractionMode === TableExtractionMode.HEURISTIC);
        
        if ((useCamelot || useTabula) && tools.pythonAvailable) {
          // Generate appropriate script based on available tools and options
          let scriptPath: string;
          
          if (useCamelot) {
            scriptPath = createCamelotScript(filePath, outputPath, options);
          } else if (useTabula) {
            scriptPath = createTabulaScript(filePath, outputPath, options);
          } else {
            throw new Error('No compatible table extraction package available');
          }

          // Execute the Python script
          const { stderr, stdout } = await execPromise(`python3 "${scriptPath}"`);
          console.log('PDF to XLSX advanced conversion output:', stdout);
          
          if (stderr && !stderr.includes('WARNING')) {
            console.error('PDF to XLSX advanced conversion error:', stderr);
          }
          
          // Clean up temporary script
          cleanupTempFiles([scriptPath]);
          
        } else if (tools.libreOffice) {
          // Fall back to LibreOffice with limited options support
          console.log('Using LibreOffice for conversion (limited options support)');
          await convertWithLibreOffice(filePath, this.uploadsDir);
          
          // If output format is not XLSX, convert the XLSX to the requested format
          if (outputFormat !== SpreadsheetFormat.XLSX && outputExt !== '.xlsx') {
            // TODO: Implement format conversion if needed
            console.log(`Format conversion from XLSX to ${outputFormat} not implemented yet`);
          }
        } else {
          throw new HttpException(
            'No compatible conversion tools available on the server',
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
        
        // Check if conversion was successful
        if (!fs.existsSync(outputPath)) {
          throw new Error('Output file not created after conversion');
        }
        
        console.log(`PDF successfully converted to ${outputFormat} with advanced options: ${outputPath}`);
        return outputPath;
      } catch (conversionError) {
        console.error('Error during advanced conversion:', conversionError);
        
        // Try LibreOffice as a fallback if Python conversion failed
        if (tools.libreOffice && (tools.tabula || tools.camelot)) {
          try {
            console.log('Attempting conversion with LibreOffice as fallback...');
            await convertWithLibreOffice(filePath, this.uploadsDir);
            
            const filename = path.basename(filePath, '.pdf');
            const libreOfficePath = path.join(this.uploadsDir, `${filename}.xlsx`);
            
            // Rename LibreOffice output to match our expected output path
            if (fs.existsSync(libreOfficePath) && libreOfficePath !== outputPath) {
              fs.copyFileSync(libreOfficePath, outputPath);
              fs.unlinkSync(libreOfficePath);
            }
            
            // Check if conversion was successful
            if (fs.existsSync(outputPath)) {
              console.log(`PDF successfully converted to XLSX with LibreOffice fallback: ${outputPath}`);
              return outputPath;
            }
          } catch (libreOfficeError) {
            console.error('Error during LibreOffice fallback conversion:', libreOfficeError);
          }
        }
        
        throw new HttpException(
          `Advanced PDF to XLSX conversion failed with all available methods. Error: ${conversionError.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      console.error('PDF to XLSX advanced conversion error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to convert PDF to XLSX with advanced options: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check available conversion tools for PDF to XLSX conversion
   * @returns Object with tool availability flags
   */
  async checkXlsxConversionTools(): Promise<any> {
    try {
      const tools = await checkConversionTools();
      
      return {
        pythonAvailable: tools.pythonAvailable,
        tabulaAvailable: tools.tabula,
        camelotAvailable: tools.camelot,
        pdfTablesAvailable: tools.pdfTables,
        libreOfficeAvailable: tools.libreOffice,
        recommendedMethod: tools.camelot ? 'camelot' : 
                           tools.tabula ? 'tabula' : 
                           tools.libreOffice ? 'libreoffice' : 'none',
        canPerformBasicConversion: tools.pythonAvailable || tools.libreOffice,
        canPerformAdvancedConversion: (tools.tabula || tools.camelot) && tools.pythonAvailable,
      };
    } catch (error) {
      console.error('Error checking XLSX conversion tools:', error);
      return {
        error: `Failed to check conversion tools: ${error.message}`,
        canPerformBasicConversion: false,
        canPerformAdvancedConversion: false,
      };
    }
  }

  /**
   * Analyze PDF for table extraction compatibility
   * @param filePath Path to the PDF file
   * @returns Analysis results including table compatibility information
   */
  async analyzePdfForXlsxConversion(filePath: string): Promise<any> {
    try {
      console.log(`Analyzing PDF for table extraction: ${filePath}`);
      
      // Basic file checks
      if (!fs.existsSync(filePath)) {
        return {
          isCompatible: false,
          error: 'File does not exist'
        };
      }
      
      const ext = path.extname(filePath).toLowerCase();
      if (ext !== '.pdf') {
        return {
          isCompatible: false,
          error: 'File must be a PDF document (.pdf)'
        };
      }
      
      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      // Check conversion tools
      const tools = await checkConversionTools();
      
      // Check compatibility
      const compatibility = await checkPdfCompatibility(filePath);
      
      // Estimate conversion time
      const estimatedTimeAuto = await estimateConversionTime(
        filePath, 
        TableExtractionMode.AUTO,
        DataRecognitionLevel.STANDARD
      );
      
      const estimatedTimePrecise = await estimateConversionTime(
        filePath, 
        TableExtractionMode.PRECISE,
        DataRecognitionLevel.ENHANCED
      );
      
      // Generate detailed report
      return {
        filename: path.basename(filePath),
        fileSize: `${fileSizeMB.toFixed(2)} MB`,
        fileFormat: 'PDF',
        tableAnalysis: {
          hasDetectedTables: compatibility.hasVisibleTables,
          isScannedPdf: compatibility.scannedPdfEstimate,
          needsOcr: compatibility.needsOcr,
          isCompatible: compatibility.isCompatible,
          warning: compatibility.warning || null,
          error: compatibility.error || null,
        },
        availableTools: {
          pythonAvailable: tools.pythonAvailable,
          tabulaAvailable: tools.tabula,
          camelotAvailable: tools.camelot,
          pdfTablesAvailable: tools.pdfTables,
          libreOfficeAvailable: tools.libreOffice,
          canPerformBasicConversion: tools.pythonAvailable || tools.libreOffice,
          canPerformAdvancedConversion: (tools.tabula || tools.camelot) && tools.pythonAvailable,
        },
        conversionEstimates: {
          standardMode: `${estimatedTimeAuto} seconds`,
          preciseMode: `${estimatedTimePrecise} seconds`,
        },
        recommendations: {
          recommendedExtractionMode: compatibility.recommendedExtractionMode,
          recommendedRecognitionLevel: compatibility.recommendedRecognitionLevel,
          recommendedConversionTool: tools.camelot ? 'camelot' : 
                                     tools.tabula ? 'tabula' : 
                                     tools.libreOffice ? 'libreoffice' : 'none',
        }
      };
    } catch (error) {
      console.error('Error analyzing PDF for XLSX conversion:', error);
      return {
        isCompatible: false,
        error: `Analysis failed: ${error.message}`
      };
    }
  }
}
