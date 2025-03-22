import { execSync, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const execPromise = util.promisify(exec);

export function isLibreOfficeInstalled(): boolean {
  try {
    execSync('libreoffice --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    try {
      execSync('soffice --version', { stdio: 'ignore' });
      return true;
    } catch (altError) {
      return false;
    }
  }
}

export function isGhostscriptInstalled(): boolean {
  try {
    execSync('gs --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

export function isTesseractInstalled(): boolean {
  try {
    execSync('tesseract --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

export async function convertPdfToDocxViaGhostscript(
  pdfPath: string,
  outputPath: string,
  options: any = {}
): Promise<string> {
  try {
    // Try LibreOffice direct conversion first
    if (isLibreOfficeInstalled()) {
      try {
        console.log('Using LibreOffice for PDF to DOCX conversion...');
        const tempDir = path.dirname(outputPath);
        
        // Convert PDF directly to DOCX using soffice/libreoffice
        let command = '';
        try {
          command = `soffice --headless --convert-to docx --outdir "${tempDir}" "${pdfPath}"`;
          await execPromise(command);
        } catch (error) {
          command = `libreoffice --headless --convert-to docx --outdir "${tempDir}" "${pdfPath}"`;
          await execPromise(command);
        }
        
        // Find the converted file
        const baseName = path.basename(pdfPath, '.pdf');
        const tempDocxPath = path.join(tempDir, `${baseName}.docx`);
        
        if (fs.existsSync(tempDocxPath)) {
          if (tempDocxPath !== outputPath) {
            fs.copyFileSync(tempDocxPath, outputPath);
            fs.unlinkSync(tempDocxPath);
          }
          
          return outputPath;
        }
      } catch (error) {
        console.error('LibreOffice conversion failed, falling back to alternative method:', error);
      }
    }
    
    // Fallback: Use Ghostscript and other tools for conversion
    console.log('Using fallback method for PDF to DOCX conversion...');
    
    // Extract text with ghostscript
    const textOutputPath = `${outputPath}.txt`;
    const gsCommand = `gs -sDEVICE=txtwrite -o "${textOutputPath}" "${pdfPath}"`;
    await execPromise(gsCommand);
    
    // Convert text to DOCX (simplified approach)
    // In a real implementation you'd use a better text-to-docx conversion
    const textContent = fs.readFileSync(textOutputPath, 'utf8');
    
    // This is a very basic approach - in a real app you'd use a library like docx.js
    // Generate a simple XML for Word
    const docxContent = `
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:r>
              <w:t>${textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t>
            </w:r>
          </w:p>
        </w:body>
      </w:document>
    `;
    
    fs.writeFileSync(outputPath, docxContent);
    
    // Clean up
    if (fs.existsSync(textOutputPath)) {
      fs.unlinkSync(textOutputPath);
    }
    
    return outputPath;
  } catch (error) {
    console.error('PDF to DOCX conversion failed:', error);
    throw new Error(`Failed to convert PDF to DOCX: ${error.message}`);
  }
}
