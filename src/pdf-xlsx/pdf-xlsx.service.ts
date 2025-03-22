import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { PDFDocument } from 'pdf-lib';

const execPromise = promisify(exec);

export enum TableExtractionMode {
  AUTO = 'auto',
  HEURISTIC = 'heuristic',
  PRECISE = 'precise', 
  STRUCTURED = 'structured',
}

export enum DataRecognitionLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
}

export enum SpreadsheetFormat {
  XLSX = 'xlsx',
  CSV = 'csv',
  ODS = 'ods',
}

export interface ConvertToXlsxOptions {
  extractionMode?: TableExtractionMode;
  recognitionLevel?: DataRecognitionLevel;
  outputFormat?: SpreadsheetFormat;
  tableDetection?: any;
  formatting?: any;
  dataCleanup?: any;
  advanced?: any;
  pageSelection?: any;
}

@Injectable()
export class PdfXlsxService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Check which PDF to XLSX conversion tools are available
   * @returns Object with tool availability flags
   */
  private async getAvailableTools(): Promise<{
    pythonAvailable: boolean;
    tabula: boolean;
    camelot: boolean;
    pdfTables: boolean;
    libreOffice: boolean;
  }> {
    const result = {
      pythonAvailable: false,
      tabula: false,
      camelot: false,
      pdfTables: false,
      libreOffice: false,
    };

    try {
      // Check if Python is available
      const pythonCheck = await execPromise('python3 --version').catch(() => null);
      result.pythonAvailable = !!pythonCheck;

      // Check for Python packages if Python is available
      if (result.pythonAvailable) {
        // Check for tabula-py
        const tabulaCheck = await execPromise('python3 -c "import tabula"').catch(() => null);
        result.tabula = !!tabulaCheck;

        // Check for camelot
        const camelotCheck = await execPromise('python3 -c "import camelot"').catch(() => null);
        result.camelot = !!camelotCheck;

        // Check for pdftables
        const pdfTablesCheck = await execPromise('python3 -c "import pdftables_api"').catch(() => null);
        result.pdfTables = !!pdfTablesCheck;
      }

      // Check if LibreOffice is available
      const libreOfficeCheck = await execPromise('libreoffice --version').catch(() => null);
      result.libreOffice = !!libreOfficeCheck;

      return result;
    } catch (error) {
      console.error('Error checking available tools:', error);
      return result;
    }
  }

  /**
   * Get file path for a file in the uploads directory
   */
  getFilePath(filename: string): string {
    return path.join(this.uploadsDir, filename);
  }
  
  /**
   * Get uploads directory path
   */
  getUploadsDir(): string {
    return this.uploadsDir;
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

  /**
   * Simplified conversion method for external use
   */
  async convertPdfToXlsx(filePath: string): Promise<any> {
    // This is a simplified wrapper around the basic conversion method
    const outputPath = await this.convertPdfToXlsxBasic(filePath);
    
    return {
      success: true,
      filepath: outputPath,
      filename: path.basename(outputPath),
    };
  }

  /**
   * Convert PDF to Excel using LibreOffice
   */
  private async convertWithLibreOffice(filePath: string, outputDir: string): Promise<string> {
    try {
      const filename = path.basename(filePath, '.pdf');
      const outputPath = path.join(outputDir, `${filename}.xlsx`);
      
      // Run LibreOffice to convert PDF to XLSX
      const command = `libreoffice --headless --convert-to xlsx --outdir "${outputDir}" "${filePath}"`;
      await execPromise(command, { timeout: 120000 }); // 2 minute timeout
      
      // Check if the file was created
      if (fs.existsSync(outputPath)) {
        return outputPath;
      }
      
      throw new Error('LibreOffice conversion failed: output file not created');
    } catch (error) {
      console.error('Error converting with LibreOffice:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  private cleanupTempFiles(filePaths: string[]): void {
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Failed to clean up file ${filePath}:`, error);
      }
    }
  }

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
      const tools = await this.getAvailableTools();
      
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
            scriptPath = this.createCamelotScript(filePath, outputPath, options);
          } else {
            scriptPath = this.createTabulaScript(filePath, outputPath, options);
          }

          // Execute the Python script
          const { stderr, stdout } = await execPromise(`python3 "${scriptPath}"`);
          console.log('PDF to XLSX conversion output:', stdout);
          
          if (stderr && !stderr.includes('WARNING')) {
            console.error('PDF to XLSX conversion error:', stderr);
          }
          
          // Clean up temporary script
          this.cleanupTempFiles([scriptPath]);
          
        } else if (tools.libreOffice) {
          // Fall back to LibreOffice if Python tools are not available
          await this.convertWithLibreOffice(filePath, this.uploadsDir);
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
            await this.convertWithLibreOffice(filePath, this.uploadsDir);
            
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
  async convertPdfToXlsxAdvanced(filePath: string, options: ConvertToXlsxOptions = {}): Promise<string> {
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
      const tools = await this.getAvailableTools();
      
      // Check compatibility
      const compatibility = await this.checkPdfCompatibility(filePath);
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
            scriptPath = this.createCamelotScript(filePath, outputPath, options);
          } else if (useTabula) {
            scriptPath = this.createTabulaScript(filePath, outputPath, options);
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
          this.cleanupTempFiles([scriptPath]);
          
        } else if (tools.libreOffice) {
          // Fall back to LibreOffice with limited options support
          console.log('Using LibreOffice for conversion (limited options support)');
          await this.convertWithLibreOffice(filePath, this.uploadsDir);
          
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
            await this.convertWithLibreOffice(filePath, this.uploadsDir);
            
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
      const tools = await this.getAvailableTools();
      
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
      
      // Run our internal compatibility check
      const compatibility = await this.checkPdfCompatibility(filePath);
      
      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      // Check conversion tools
      const tools = await this.getAvailableTools();
      
      // Return a detailed analysis
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

  /**
   * Check PDF compatibility for table extraction
   * @param filePath Path to the PDF file
   * @returns Compatibility check results
   */
  /**
   * Create a Python script for converting PDF to XLSX using Camelot
   * @param filePath Path to the PDF file
   * @param outputPath Path for the output XLSX file
   * @param options Conversion options
   * @returns Path to the created Python script
   */
  private createCamelotScript(filePath: string, outputPath: string, options: ConvertToXlsxOptions): string {
    const scriptPath = path.join(this.uploadsDir, `camelot_convert_${Date.now()}.py`);
    const scriptContent = `#!/usr/bin/env python3
import os
import sys
import pandas as pd
import camelot

try:
    # Input and output paths
    pdf_path = "${filePath.replace(/\\/g, '\\\\')}"
    output_path = "${outputPath.replace(/\\/g, '\\\\')}"
    
    # Extraction mode setting
    flavor = "lattice"  # Default for precise tables with visible lines
    if "${options.extractionMode}" == "structured":
        flavor = "stream"
    
    # Read tables from the PDF
    print(f"Reading tables from {pdf_path} using camelot with {flavor} mode...")
    tables = camelot.read_pdf(
        pdf_path,
        flavor=flavor,
        pages='all'
    )
    
    print(f"Found {len(tables)} tables in the PDF")
    
    if len(tables) == 0:
        print("No tables found, trying alternative mode...")
        # If no tables found with chosen mode, try the alternative
        alt_flavor = "stream" if flavor == "lattice" else "lattice"
        tables = camelot.read_pdf(
            pdf_path,
            flavor=alt_flavor,
            pages='all'
        )
        print(f"Found {len(tables)} tables with alternative mode")
    
    if len(tables) == 0:
        print("Still no tables found, exiting...")
        sys.exit(1)
        
    # Process and combine all tables into a single DataFrame or list of DataFrames
    all_dfs = []
    for i, table in enumerate(tables):
        df = table.df
        
        # Apply data cleanup if needed
        if ${!!options.dataCleanup}:
            # Remove empty rows if requested
            if ${!!options.dataCleanup?.removeEmptyRows}:
                df = df.dropna(how='all')
            
            # Trim whitespace in cells if requested
            if ${!!options.dataCleanup?.trimTextCells}:
                df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)
    
        all_dfs.append(df)
    
    # Export to Excel
    if len(all_dfs) == 1:
        # If only one table, use it directly
        all_dfs[0].to_excel(output_path, index=False)
    else:
        # If multiple tables, create a multi-sheet Excel file
        with pd.ExcelWriter(output_path) as writer:
            for i, df in enumerate(all_dfs):
                df.to_excel(writer, sheet_name=f"Table_{i+1}", index=False)
    
    print(f"Successfully converted PDF to Excel: {output_path}")
    sys.exit(0)
    
except Exception as e:
    print(f"Error converting PDF to Excel: {e}", file=sys.stderr)
    sys.exit(1)
`

    fs.writeFileSync(scriptPath, scriptContent);
    fs.chmodSync(scriptPath, '755'); // Make executable
    return scriptPath;
  }

  /**
   * Create a Python script for converting PDF to XLSX using Tabula
   * @param filePath Path to the PDF file
   * @param outputPath Path for the output XLSX file
   * @param options Conversion options
   * @returns Path to the created Python script
   */
  private createTabulaScript(filePath: string, outputPath: string, options: ConvertToXlsxOptions): string {
    const scriptPath = path.join(this.uploadsDir, `tabula_convert_${Date.now()}.py`);
    const scriptContent = `#!/usr/bin/env python3
import os
import sys
import pandas as pd
import tabula

try:
    # Input and output paths
    pdf_path = "${filePath.replace(/\\/g, '\\\\')}"
    output_path = "${outputPath.replace(/\\/g, '\\\\')}"
    
    # Configure extraction mode
    extraction_mode = "lattice"  # Default for tables with visible lines
    if "${options.extractionMode}" == "auto":
        extraction_mode = "auto"
        
    # Read all tables from the PDF
    print(f"Reading tables from {pdf_path} using tabula with {extraction_mode} mode...")
    dfs = tabula.read_pdf(
        pdf_path,
        pages='all',
        multiple_tables=True,
        lattice=(extraction_mode == "lattice"),
        stream=(extraction_mode == "stream"),
        guess=(extraction_mode == "auto")
    )
    
    print(f"Found {len(dfs)} tables in the PDF")
    
    if len(dfs) == 0:
        print("No tables found, exiting...")
        sys.exit(1)
    
    # Process tables
    for i, df in enumerate(dfs):
        # Apply data cleanup if needed
        if ${!!options.dataCleanup}:
            # Remove empty rows if requested
            if ${!!options.dataCleanup?.removeEmptyRows}:
                dfs[i] = df.dropna(how='all')
            
            # Trim whitespace in cells if requested
            if ${!!options.dataCleanup?.trimTextCells}:
                dfs[i] = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)
    
    # Export to Excel
    if len(dfs) == 1:
        # If only one table, use it directly
        dfs[0].to_excel(output_path, index=False)
    else:
        # If multiple tables, create a multi-sheet Excel file
        with pd.ExcelWriter(output_path) as writer:
            for i, df in enumerate(dfs):
                df.to_excel(writer, sheet_name=f"Table_{i+1}", index=False)
    
    print(f"Successfully converted PDF to Excel: {output_path}")
    sys.exit(0)
    
except Exception as e:
    print(f"Error converting PDF to Excel: {e}", file=sys.stderr)
    sys.exit(1)
`

    fs.writeFileSync(scriptPath, scriptContent);
    fs.chmodSync(scriptPath, '755'); // Make executable
    return scriptPath;
  }

  private async checkPdfCompatibility(filePath: string): Promise<{
    isCompatible: boolean;
    hasVisibleTables: boolean;
    scannedPdfEstimate: boolean;
    needsOcr: boolean;
    recommendedExtractionMode: TableExtractionMode;
    recommendedRecognitionLevel: DataRecognitionLevel;
    warning?: string;
    error?: string;
  }> {
    try {
      // Load PDF and examine it
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();
      
      // Basic compatibility checks
      if (pageCount === 0) {
        return {
          isCompatible: false,
          hasVisibleTables: false,
          scannedPdfEstimate: false,
          needsOcr: false,
          recommendedExtractionMode: TableExtractionMode.AUTO,
          recommendedRecognitionLevel: DataRecognitionLevel.BASIC,
          error: 'PDF has no pages'
        };
      }
      
      // File size check
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      const isLargeFile = fileSizeMB > 50; // Consider files > 50MB as large
      
      // Since we can't do detailed analysis of the PDF content without additional libraries,
      // we'll provide a basic compatibility result with reasonable defaults
      
      // For a real implementation, we would check for:
      // 1. Text elements vs. image-only pages
      // 2. Evidence of tables (e.g., cell borders, grid-like text arrangement)
      // 3. PDF structure and content type
      
      return {
        isCompatible: true,
        hasVisibleTables: true, // Assuming tables exist
        scannedPdfEstimate: false, // Assuming not a scanned PDF
        needsOcr: false, // Assuming OCR not needed
        recommendedExtractionMode: TableExtractionMode.AUTO,
        recommendedRecognitionLevel: DataRecognitionLevel.STANDARD,
        warning: isLargeFile ? 'Large PDF file may take longer to process' : undefined
      };
    } catch (error) {
      console.error('Error checking PDF compatibility:', error);
      return {
        isCompatible: false,
        hasVisibleTables: false,
        scannedPdfEstimate: false,
        needsOcr: false,
        recommendedExtractionMode: TableExtractionMode.AUTO,
        recommendedRecognitionLevel: DataRecognitionLevel.BASIC,
        error: `Failed to analyze PDF: ${error.message}`
      };
    }
  }
}
