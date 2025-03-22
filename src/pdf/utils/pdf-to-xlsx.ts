import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TableExtractionMode, DataRecognitionLevel, SpreadsheetFormat } from '../dto/convert-to-xlsx.dto';

const execPromise = promisify(exec);

/**
 * Check if necessary tools are installed
 * @returns Object with tool availability flags
 */
export async function checkConversionTools(): Promise<{ 
  pdfTables: boolean, 
  tabula: boolean, 
  camelot: boolean, 
  libreOffice: boolean, 
  pythonAvailable: boolean 
}> {
  const tools = {
    pdfTables: false,
    tabula: false,
    camelot: false,
    libreOffice: false,
    pythonAvailable: false
  };

  try {
    // Check if Python is available
    await execPromise('python3 --version');
    tools.pythonAvailable = true;
    
    // Check if relevant Python packages are installed
    try {
      await execPromise('python3 -c "import tabula"');
      tools.tabula = true;
    } catch (e) {
      // Tabula not available
    }
    
    try {
      await execPromise('python3 -c "import camelot"');
      tools.camelot = true;
    } catch (e) {
      // Camelot not available
    }
    
    try {
      await execPromise('python3 -c "import pdftables_api"');
      tools.pdfTables = true;
    } catch (e) {
      // PDFTables not available
    }
  } catch (e) {
    // Python not available
  }

  try {
    // Check if LibreOffice is installed
    await execPromise('libreoffice --version');
    tools.libreOffice = true;
  } catch (e) {
    // LibreOffice not available
  }

  return tools;
}

/**
 * Determine the optimal extraction mode based on document analysis and available tools
 * @param filePath Path to the PDF file
 * @param tools Available conversion tools
 * @returns The recommended extraction mode
 */
export async function getOptimalExtractionMode(
  filePath: string, 
  tools: { pdfTables: boolean, tabula: boolean, camelot: boolean, libreOffice: boolean }
): Promise<TableExtractionMode> {
  // Simple heuristic based on file size and number of pages
  // In a real implementation, this would analyze the PDF structure more deeply
  
  try {
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    // Analyze PDF page count
    const pdfInfo = await analyzePdfPageCount(filePath);
    const { pageCount } = pdfInfo;
    
    // For demo purposes, make a simple decision
    if (fileSizeInMB > 10 && pageCount > 20) {
      // Large complex document
      if (tools.camelot) return TableExtractionMode.PRECISE;
      if (tools.tabula) return TableExtractionMode.HEURISTIC;
    }
    
    if (fileSizeInMB < 2 && pageCount < 5) {
      // Small simple document
      return TableExtractionMode.AUTO;
    }
    
    // Default for medium sized documents
    if (tools.tabula || tools.camelot) {
      return TableExtractionMode.STRUCTURED;
    }
    
    return TableExtractionMode.AUTO;
  } catch (error) {
    console.error('Error determining optimal extraction mode:', error);
    return TableExtractionMode.AUTO; // Fallback to auto mode
  }
}

/**
 * Analyze PDF to get basic information
 * @param filePath Path to the PDF file
 * @returns Object with PDF information
 */
export async function analyzePdfPageCount(filePath: string): Promise<{ pageCount: number }> {
  // Use pdfjsLib or similar to get page count
  // For a simple implementation, we'll use a utility that extracts metadata
  try {
    // This is a placeholder - in a real implementation, you would use a PDF library
    // to extract the actual page count from the PDF
    
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    return {
      pageCount: data.numpages || 0
    };
  } catch (error) {
    console.error('Error analyzing PDF page count:', error);
    return { pageCount: 0 };
  }
}

/**
 * Estimate conversion time based on file size, page count, and selected options
 * @param filePath Path to the PDF file
 * @param extractionMode Selected extraction mode
 * @param recognitionLevel Selected recognition level
 * @returns Estimated time in seconds
 */
export async function estimateConversionTime(
  filePath: string,
  extractionMode: TableExtractionMode,
  recognitionLevel: DataRecognitionLevel
): Promise<number> {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    // Analyze PDF page count
    const pdfInfo = await analyzePdfPageCount(filePath);
    const { pageCount } = pdfInfo;
    
    // Basic time calculation based on size and page count
    let estimatedTime = pageCount * 0.5; // Base time: 0.5 seconds per page
    
    // Adjust based on file size
    estimatedTime += fileSizeInMB * 0.1; // Add 0.1 seconds per MB
    
    // Adjust based on extraction mode
    switch (extractionMode) {
      case TableExtractionMode.PRECISE:
        estimatedTime *= 2.5; // PRECISE is slower
        break;
      case TableExtractionMode.HEURISTIC:
        estimatedTime *= 1.5;
        break;
      case TableExtractionMode.STRUCTURED:
        estimatedTime *= 2;
        break;
      default: // AUTO
        break;
    }
    
    // Adjust based on recognition level
    switch (recognitionLevel) {
      case DataRecognitionLevel.ENHANCED:
        estimatedTime *= 1.8;
        break;
      case DataRecognitionLevel.STANDARD:
        estimatedTime *= 1.2;
        break;
      default: // BASIC
        break;
    }
    
    return Math.round(estimatedTime);
  } catch (error) {
    console.error('Error estimating conversion time:', error);
    return 10; // Default fallback estimate of 10 seconds
  }
}

/**
 * Create a Python script for PDF to Excel conversion using tabula-py
 * @param filePath Path to the PDF file
 * @param outputPath Path for the output Excel file
 * @param options Conversion options
 * @returns Path to the generated Python script
 */
export function createTabulaScript(
  filePath: string,
  outputPath: string,
  options: any
): string {
  const scriptDir = path.dirname(outputPath);
  const scriptPath = path.join(scriptDir, `tabula_convert_${Date.now()}.py`);
  
  const pageRangeOption = options.pageSelection?.ranges ? 
    `pages="${options.pageSelection.ranges}"` : 'all_pages=True';
  
  // Default options
  const lattice = options.extractionMode === TableExtractionMode.STRUCTURED;
  const stream = options.extractionMode === TableExtractionMode.HEURISTIC;
  const guessOption = options.recognitionLevel === DataRecognitionLevel.ENHANCED ? 'True' : 'False';
  
  const script = `
import tabula
import pandas as pd
import os

# PDF file path
pdf_path = "${filePath.replace(/\\/g, '\\\\')}"

# Output file path
output_path = "${outputPath.replace(/\\/g, '\\\\')}"

# Extract tables from PDF
tables = tabula.read_pdf(
    pdf_path,
    ${pageRangeOption},
    lattice=${lattice},
    stream=${stream},
    guess=${guessOption},
    multiple_tables=True
)

print(f"Found {len(tables)} tables in the PDF")

# Process tables if any were found
if tables:
    # Create a Pandas Excel writer
    writer = pd.ExcelWriter(output_path, engine='openpyxl')
    
    # Write each table to a separate worksheet
    for i, table in enumerate(tables):
        # Clean up the table
        if ${options.dataCleanup?.removeEmptyRows || 'True'}:
            table = table.dropna(how='all')
        
        if ${options.dataCleanup?.normalizeWhitespace || 'True'}:
            # Normalize whitespace in string columns
            for col in table.select_dtypes(include=['object']).columns:
                table[col] = table[col].astype(str).str.replace('\\s+', ' ', regex=True)
        
        if ${options.dataCleanup?.trimTextCells || 'True'}:
            # Trim whitespace
            for col in table.select_dtypes(include=['object']).columns:
                table[col] = table[col].astype(str).str.strip()
                
        # Auto-detect data types if enabled
        if ${options.formatting?.autoDetectDataTypes || 'True'}:
            for col in table.columns:
                # Try to convert to numeric, but keep as is if it fails
                try:
                    table[col] = pd.to_numeric(table[col])
                except:
                    pass
                    
                # Try to convert to datetime, but keep as is if it fails
                try:
                    table[col] = pd.to_datetime(table[col])
                except:
                    pass
        
        # Get worksheet name based on page number if enabled
        if ${options.formatting?.pageNumbersAsWorksheetNames || 'True'}:
            sheet_name = f"Table_{i+1}"
        else:
            sheet_name = f"Table_{i+1}"
        
        # Write to Excel
        table.to_excel(writer, sheet_name=sheet_name, index=False)
        
        # Auto-fit columns if enabled
        if ${options.advanced?.autoFitColumns || 'True'}:
            worksheet = writer.sheets[sheet_name]
            for idx, col in enumerate(table.columns):
                max_len = max(
                    table[col].astype(str).str.len().max(),
                    len(str(col))
                ) + 2
                worksheet.column_dimensions[chr(65 + idx)].width = min(max_len, 50)
                
    # Create summary sheet if enabled
    if ${options.formatting?.createSummarySheet || 'False'}:
        summary_df = pd.DataFrame({
            'Information': ['File Name', 'Total Tables', 'Extraction Mode', 'Date Processed'],
            'Value': [
                os.path.basename("${filePath.replace(/\\/g, '\\\\')}"),
                len(tables),
                "${options.extractionMode}",
                pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
            ]
        })
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
    
    # Save the Excel file
    writer.close()
    print(f"Successfully created Excel file: {output_path}")
else:
    print("No tables found in the PDF")
    # Create an empty Excel file with a message
    df = pd.DataFrame({'Message': ['No tables found in the PDF']})
    df.to_excel(output_path, index=False)
    print(f"Created empty Excel file: {output_path}")
  `;
  
  fs.writeFileSync(scriptPath, script);
  return scriptPath;
}

/**
 * Create a Python script for PDF to Excel conversion using camelot-py
 * @param filePath Path to the PDF file
 * @param outputPath Path for the output Excel file
 * @param options Conversion options
 * @returns Path to the generated Python script
 */
export function createCamelotScript(
  filePath: string,
  outputPath: string,
  options: any
): string {
  const scriptDir = path.dirname(outputPath);
  const scriptPath = path.join(scriptDir, `camelot_convert_${Date.now()}.py`);
  
  // Generate page range string
  let pageRangeStr = "'1-end'";
  if (options.pageSelection?.ranges) {
    pageRangeStr = `'${options.pageSelection.ranges}'`;
  } else if (options.pageSelection?.include && options.pageSelection.include.length > 0) {
    pageRangeStr = `'${options.pageSelection.include.join(",")}'`;
  }
  
  // Default options for camelot based on extraction mode
  const flavor = options.extractionMode === TableExtractionMode.STRUCTURED ? 'lattice' : 'stream';
  
  // Determine confidence threshold
  const confidenceThreshold = options.tableDetection?.minConfidence || 75;
  
  const script = `
import camelot
import pandas as pd
import os
import warnings
warnings.filterwarnings('ignore')

# PDF file path
pdf_path = "${filePath.replace(/\\/g, '\\\\')}"

# Output file path
output_path = "${outputPath.replace(/\\/g, '\\\\')}"

# Extract tables from PDF
try:
    print(f"Extracting tables from {pdf_path} using {flavor} method...")
    tables = camelot.read_pdf(
        pdf_path,
        pages=${pageRangeStr},
        flavor='${flavor}',
        flag_size=True,
        copy_text=['v', 'h'],
        process_background=True
    )
    
    print(f"Found {len(tables)} tables in the PDF")
    
    # Filter tables based on confidence threshold
    quality_tables = [table for table in tables if table.accuracy > ${confidenceThreshold / 100}]
    print(f"After filtering by confidence: {len(quality_tables)} tables remain")
    
    # Create a Pandas Excel writer
    writer = pd.ExcelWriter(output_path, engine='openpyxl')
    
    # Process each table
    for i, table in enumerate(quality_tables):
        # Convert table to DataFrame
        df = table.df
        
        # Clean up the table
        if ${options.dataCleanup?.removeEmptyRows || 'True'}:
            df = df.dropna(how='all')
        
        if ${options.dataCleanup?.removeDuplicateHeaders || 'True'}:
            # Attempt to identify and remove duplicate headers
            # This is a simple heuristic
            if len(df) > 2:
                first_row = df.iloc[0].astype(str)
                for idx in range(1, min(5, len(df))):
                    if df.iloc[idx].astype(str).equals(first_row):
                        df = df.drop(df.index[idx])
                        break
                    
        if ${options.dataCleanup?.normalizeWhitespace || 'True'}:
            # Normalize whitespace in all cells
            for col in df.columns:
                df[col] = df[col].astype(str).str.replace('\\s+', ' ', regex=True)
        
        if ${options.dataCleanup?.trimTextCells || 'True'}:
            # Trim whitespace in all cells
            for col in df.columns:
                df[col] = df[col].astype(str).str.strip()
        
        # Auto-detect data types if enabled
        if ${options.formatting?.autoDetectDataTypes || 'True'}:
            # First, ensure proper column headers
            if len(df) > 0:
                # Use first row as header and create a new dataframe
                headers = df.iloc[0].tolist()
                new_df = pd.DataFrame(df.iloc[1:].values, columns=headers)
                df = new_df
                
                # Try to convert columns to appropriate data types
                for col in df.columns:
                    # Try numeric conversion
                    try:
                        df[col] = pd.to_numeric(df[col])
                    except:
                        pass
                    
                    # Try date conversion
                    try:
                        df[col] = pd.to_datetime(df[col])
                    except:
                        pass
        
        # Get worksheet name based on page number if enabled
        if ${options.formatting?.pageNumbersAsWorksheetNames || 'True'}:
            sheet_name = f"Page{table.page}_Table{i+1}"
        else:
            sheet_name = f"Table_{i+1}"
            
        # Ensure sheet name is valid for Excel (31 char limit, no special chars)
        sheet_name = sheet_name[:31].replace(':', '_').replace('\\\\', '_').replace('/', '_')
        
        # Write to Excel
        df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        # Auto-fit columns if enabled
        if ${options.advanced?.autoFitColumns || 'True'}:
            worksheet = writer.sheets[sheet_name]
            for idx, col in enumerate(df.columns):
                max_len = max(
                    df[col].astype(str).str.len().max(),
                    len(str(col))
                ) + 2
                column_letter = chr(65 + idx) if idx < 26 else chr(64 + idx // 26) + chr(65 + idx % 26)
                worksheet.column_dimensions[column_letter].width = min(max_len, 50)
    
    # Create summary sheet if enabled
    if ${options.formatting?.createSummarySheet || 'False'}:
        summary_data = {
            'Information': [
                'File Name', 
                'Total Tables Found', 
                'Tables After Filtering',
                'Extraction Method', 
                'Confidence Threshold', 
                'Date Processed'
            ],
            'Value': [
                os.path.basename("${filePath.replace(/\\/g, '\\\\')}"),
                len(tables),
                len(quality_tables),
                '${flavor.charAt(0).toUpperCase() + flavor.slice(1)}',
                '${confidenceThreshold}%',
                pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
            ]
        }
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
    
    # Save the Excel file
    writer.close()
    
    print(f"Successfully created Excel file: {output_path}")
    
except Exception as e:
    print(f"Error extracting tables: {str(e)}")
    # Create an error Excel file
    df = pd.DataFrame({
        'Error': [f"Failed to extract tables: {str(e)}"],
        'Suggestion': ['Try a different extraction mode or check if the PDF contains extractable tables.']
    })
    df.to_excel(output_path, index=False)
    print(f"Created error report Excel file: {output_path}")
  `;
  
  fs.writeFileSync(scriptPath, script);
  return scriptPath;
}

/**
 * Convert PDF to Excel using LibreOffice (fallback method)
 * @param filePath Path to the PDF file
 * @param outputDir Directory for the output file
 * @returns Path to the converted Excel file
 */
export async function convertWithLibreOffice(
  filePath: string,
  outputDir: string
): Promise<string> {
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
 * Check PDF compatibility for table extraction and provide recommendations
 * @param filePath Path to the PDF file
 * @returns Compatibility information and recommendations
 */
/**
 * Check PDF compatibility for table extraction and provide recommendations
 * @param filePath Path to the PDF file
 * @returns Compatibility information and recommendations
 */
export async function checkPdfCompatibility(filePath: string): Promise<{
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
    // In a real implementation, this would do a deeper analysis of the PDF
    // This is a simplified version for demonstration purposes
    
    // Check basic PDF integrity
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    // Simple heuristic to detect scanned PDFs vs digital PDFs
    // This is an approximation - a real implementation would use more sophisticated methods
    const avgCharsPerPage = pdfData.text.length / pdfData.numpages;
    const isLikelyScanned = avgCharsPerPage < 100; // Very low text content suggests a scanned document
    
    // Estimate if this PDF has visible tables based on text patterns
    // This is a very simplified approach
    const hasTabularPatterns = pdfData.text.includes('\t') || 
                              /\|\s+\|/.test(pdfData.text) || 
                              /[-]{3,}/.test(pdfData.text);
    
    // Make recommendations based on our analysis
    let recommendedMode = TableExtractionMode.AUTO;
    let recommendedLevel = DataRecognitionLevel.STANDARD;
    let warning: string | undefined;
    
    if (isLikelyScanned) {
      recommendedMode = TableExtractionMode.HEURISTIC;
      recommendedLevel = DataRecognitionLevel.ENHANCED;
      warning = 'This appears to be a scanned PDF. Table extraction may be less accurate.';
    } else if (hasTabularPatterns) {
      recommendedMode = TableExtractionMode.STRUCTURED;
    }
    
    if (fileSizeInMB > 20) {
      warning = warning !== undefined ? warning : 'Large PDF detected. Processing may take longer.';
    }
    
    return {
      isCompatible: true, // Assume compatible unless we have clear evidence otherwise
      hasVisibleTables: hasTabularPatterns,
      scannedPdfEstimate: isLikelyScanned,
      needsOcr: isLikelyScanned,
      recommendedExtractionMode: recommendedMode,
      recommendedRecognitionLevel: recommendedLevel,
      warning,
    };
  } catch (error) {
    console.error('Error checking PDF compatibility:', error);
    return {
      isCompatible: false,
      hasVisibleTables: false,
      scannedPdfEstimate: false,
      needsOcr: false,
      recommendedExtractionMode: TableExtractionMode.AUTO,
      recommendedRecognitionLevel: DataRecognitionLevel.STANDARD,
      error: `PDF analysis failed: ${error.message}`,
    };
  }
}

/**
 * Clean up temporary files generated during conversion
 * @param filePaths Array of file paths to clean up
 */
export function cleanupTempFiles(filePaths: string[]): void {
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
