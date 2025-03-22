import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec, execSync } from 'child_process';
import { ProtectOptionsDto, EncryptionLevel } from '../dto/protect-options.dto';
import * as crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';

const execPromise = promisify(exec);

// Check if qpdf is installed
function isQpdfInstalled(): boolean {
  try {
    execSync('qpdf --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

@Injectable()
export class PdfProtectionService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');
  private readonly permissions: string[] = [];

  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Protects a PDF file with password and permissions
   * 
   * @param filePath Path to the PDF file to protect
   * @param options Protection options including passwords and permissions
   * @returns Path to the protected PDF file
   */
  async protectPdfWithPassword(filePath: string, options: ProtectOptionsDto): Promise<string> {
    try {
      // Verify the file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(
          `File not found: ${path.basename(filePath)}`,
          HttpStatus.NOT_FOUND
        );
      }

      // Verify it's a PDF file
      if (path.extname(filePath).toLowerCase() !== '.pdf') {
        throw new HttpException(
          'Only PDF files can be password protected',
          HttpStatus.BAD_REQUEST
        );
      }

      // Create output filename
      const filename = path.basename(filePath, '.pdf');
      const outputPath = path.join(
        this.uploadsDir,
        `${filename}_protected_${Date.now()}.pdf`
      );

      // Check if qpdf is installed and use it if available
      if (isQpdfInstalled()) {
        try {
          // Build permission flags for qpdf
          const permissionsFlags = this.buildPermissionsFlags(options);
          
          // Determine encryption parameters based on encryption level
          const encryptionParams = this.getEncryptionParams(options.encryptionLevel || EncryptionLevel.HIGH);

          // Build QPDF command
          const ownerPasswordArg = options.ownerPassword 
            ? `--owner-password=${options.ownerPassword}` 
            : `--owner-password=${options.userPassword}`;
            
          // Get permission flags as array
          const permissionFlagsArray = this.buildPermissionsFlags(options);
          
          // Build command parts
          const commandParts = [
            'qpdf',
            '--encrypt',
            `--user-password=${options.userPassword}`,
            ownerPasswordArg,
            encryptionParams
          ];
          
          // Add permission flags if any
          if (permissionFlagsArray.length > 0) {
            commandParts.push(...permissionFlagsArray);
          }
          
          // Add file arguments
          commandParts.push(
            '--',  // Separate options from file arguments
            filePath,
            outputPath
          );
          
          // Join the command parts
          const qpdfCommand = commandParts.join(' ');

          // Execute qpdf command
          await execPromise(qpdfCommand);

          // Verify the protected file exists
          if (fs.existsSync(outputPath)) {
            return outputPath;
          }
          
          // If we got here, qpdf failed to create the output file
          console.warn('qpdf failed to create the protected PDF file. Falling back to alternative method.');
        } catch (error) {
          console.warn(`qpdf error: ${error.message}. Falling back to alternative method.`);
        }
      } else {
        console.log('qpdf is not installed. Using fallback method for PDF protection.');
      }
      
      // Fallback method using pdf-lib for encryption
      try {
        console.log('Using pdf-lib fallback method for PDF protection');
        
        // Read the PDF file
        const fileBytes = fs.readFileSync(filePath);
        
        // Load the PDF document
        const pdfDoc = await PDFDocument.load(fileBytes);
        
        // Unfortunately, pdf-lib v1.17.1 doesn't have built-in encryption
        // We'll rely on qpdf instead and save an unencrypted version first
        const tempOutputPath = path.join(
          this.uploadsDir,
          `${filename}_temp_${Date.now()}.pdf`
        );
        
        // Save the PDF without encryption first
        const savedBytes = await pdfDoc.save();
        fs.writeFileSync(tempOutputPath, savedBytes);
        
        // Then use qpdf to encrypt it
        const permissionsFlags = this.buildPermissionsFlags(options);
        const encryptionParams = this.getEncryptionParams(options.encryptionLevel || EncryptionLevel.HIGH);
        const ownerPasswordArg = options.ownerPassword 
          ? `--owner-password=${options.ownerPassword}` 
          : `--owner-password=${options.userPassword}`;
            
        // Get permission flags as array
        const permissionFlagsArray = this.buildPermissionsFlags(options);
        
        // Build command parts
        const commandParts = [
          'qpdf',
          '--encrypt',
          `--user-password=${options.userPassword}`,
          ownerPasswordArg,
          encryptionParams
        ];
        
        // Add permission flags if any
        if (permissionFlagsArray.length > 0) {
          commandParts.push(...permissionFlagsArray);
        }
        
        // Add file arguments
        commandParts.push(
          '--',  // Separate options from file arguments
          tempOutputPath,
          outputPath
        );
        
        // Join the command parts
        const qpdfCommand = commandParts.join(' ');

        try {
          // Execute qpdf command
          await execPromise(qpdfCommand);
          
          // Clean up the temporary file
          fs.unlinkSync(tempOutputPath);
          
          if (fs.existsSync(outputPath)) {
            console.log('Successfully encrypted PDF using pdf-lib + qpdf');
            return outputPath;
          } else {
            throw new Error('Failed to create encrypted PDF');
          }
        } catch (error) {
          console.error('Error encrypting with qpdf:', error);
          throw new HttpException(
            `Failed to encrypt PDF with qpdf: ${error.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      } catch (error) {
        console.error('Error using pdf-lib for encryption:', error);
        throw new HttpException(
          `Failed to protect PDF with pdf-lib: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error) {
      // If the error is already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // Otherwise, throw a generic error
      throw new HttpException(
        `Failed to protect PDF: ${error.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Remove password protection from a PDF file
   * 
   * @param filePath Path to the PDF file
   * @param password Password to unlock the PDF
   * @returns Path to the unprotected PDF file
   */
  async removePasswordProtection(filePath: string, password: string): Promise<string> {
    try {
      // Verify the file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(
          `File not found: ${path.basename(filePath)}`,
          HttpStatus.NOT_FOUND
        );
      }

      // Verify it's a PDF file
      if (path.extname(filePath).toLowerCase() !== '.pdf') {
        throw new HttpException(
          'Only PDF files can have password protection removed',
          HttpStatus.BAD_REQUEST
        );
      }

      // Create output filename
      const filename = path.basename(filePath, '.pdf');
      const outputPath = path.join(
        this.uploadsDir,
        `${filename}_unprotected_${Date.now()}.pdf`
      );

      // Check if qpdf is installed
      if (isQpdfInstalled()) {
        try {
          // Build qpdf command for decryption
          // We'll try with the password as both user and owner password
          const qpdfCommand = `qpdf --password=${password} --decrypt ${filePath} ${outputPath}`;

          try {
            // Execute qpdf command
            await execPromise(qpdfCommand);
            
            // Verify the unprotected file exists
            if (fs.existsSync(outputPath)) {
              return outputPath;
            }
          } catch (error) {
            // If decryption fails, it's likely due to an incorrect password
            if (error.stderr && error.stderr.includes('password')) {
              throw new HttpException(
                'Incorrect password. Unable to remove protection.',
                HttpStatus.UNAUTHORIZED
              );
            }
            
            // For other errors, try the fallback method
            console.warn(`qpdf error: ${error.message}. Trying fallback method.`);
          }
        } catch (error) {
          console.warn(`qpdf process error: ${error.message}. Using fallback method.`);
        }
      } else {
        console.log('qpdf is not installed. Using fallback method for removing PDF protection.');
      }
      
      // Fallback method using pdf-lib
      try {
        console.log('Using pdf-lib fallback method for removing PDF protection');
        
        // We need to use qpdf to decrypt it first since pdf-lib doesn't support password loading directly
        const tempDecryptedPath = path.join(
          this.uploadsDir,
          `${filename}_temp_decrypted_${Date.now()}.pdf`
        );
        
        // Use qpdf to decrypt the file
        const qpdfCommand = `qpdf --password=${password} --decrypt ${filePath} ${tempDecryptedPath}`;
        await execPromise(qpdfCommand);
        
        // Then load the decrypted file with pdf-lib
        const decryptedBytes = fs.readFileSync(tempDecryptedPath);
        const pdfDoc = await PDFDocument.load(decryptedBytes);
        
        // Save the PDF again to ensure it's properly structured
        const unprotectedPdf = await pdfDoc.save();
        
        // Clean up the temporary file
        fs.unlinkSync(tempDecryptedPath);
        
        // Write the unprotected PDF to the output path
        fs.writeFileSync(outputPath, unprotectedPdf);
        
        console.log('Successfully removed PDF protection using pdf-lib');
        return outputPath;
      } catch (error) {
        // If loading with password fails, it's likely due to an incorrect password
        console.error('Error using pdf-lib for removing protection:', error);
        throw new HttpException(
          'Incorrect password or unable to remove protection with pdf-lib',
          HttpStatus.UNAUTHORIZED
        );
      }
    } catch (error) {
      // If the error is already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // Otherwise, throw a generic error
      throw new HttpException(
        `Failed to remove protection: ${error.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Check if a PDF file is password protected
   * 
   * @param filePath Path to the PDF file
   * @returns Information about the PDF protection
   */
  async checkPdfProtection(filePath: string): Promise<any> {
    try {
      // Verify the file exists
      if (!fs.existsSync(filePath)) {
        throw new HttpException(
          `File not found: ${path.basename(filePath)}`,
          HttpStatus.NOT_FOUND
        );
      }

      // Verify it's a PDF file
      if (path.extname(filePath).toLowerCase() !== '.pdf') {
        throw new HttpException(
          'Only PDF files can be checked for password protection',
          HttpStatus.BAD_REQUEST
        );
      }

      // Check if qpdf is installed
      if (isQpdfInstalled()) {
        // Use qpdf to check the encryption status
        const qpdfCommand = `qpdf --show-encryption ${filePath}`;

        try {
          // Execute qpdf command
          const { stdout } = await execPromise(qpdfCommand);
          
          // Parse output to determine protection status
          const isEncrypted = !stdout.includes('File is not encrypted');
          
          let encryptionInfo = {
            isEncrypted,
            userPasswordRequired: false,
            ownerPasswordRequired: false,
            encryptionLevel: null as EncryptionLevel | null,
            restrictions: [] as string[]
          };
          
          if (isEncrypted) {
            // Parse encryption details
            if (stdout.includes('user password: required')) {
              encryptionInfo.userPasswordRequired = true;
            }
            
            if (stdout.includes('owner password: required')) {
              encryptionInfo.ownerPasswordRequired = true;
            }
            
            // Determine encryption level
            if (stdout.includes('40-bit')) {
              encryptionInfo.encryptionLevel = EncryptionLevel.LOW;
            } else if (stdout.includes('128-bit')) {
              encryptionInfo.encryptionLevel = EncryptionLevel.MEDIUM;
            } else if (stdout.includes('256-bit')) {
              encryptionInfo.encryptionLevel = EncryptionLevel.HIGH;
            }
            
            // Parse restrictions
            const restrictionsMap = {
              'Printing': 'print',
              'Modifying': 'modify',
              'Copying': 'copy',
              'Annotating': 'annotate',
              'Form filling': 'fillForms',
              'Screen readers': 'screenReaders',
              'Assembly': 'assembly',
              'High-quality printing': 'highQualityPrint'
            };
            
            for (const [restriction, value] of Object.entries(restrictionsMap)) {
              if (stdout.includes(`${restriction}: not allowed`)) {
                encryptionInfo.restrictions.push(value);
              }
            }
          }
          
          return encryptionInfo;
        } catch (error) {
          // If the command fails but doesn't indicate a password issue,
          // it might be a general issue with the file
          if (error.stderr && error.stderr.includes('encrypted')) {
            return {
              isEncrypted: true,
              userPasswordRequired: true,
              encryptionLevel: null,
              restrictions: []
            };
          }
          
          // Fall back to alternative method if qpdf has an issue
          console.warn(`qpdf error: ${error.message}. Falling back to alternative method.`);
        }
      }
      
      // Since qpdf is not available, use direct PDF binary reading
      try {
        console.log('Using binary inspection to check PDF encryption status');
        
        // Read the first 2000 bytes of the file
        const fileData = fs.readFileSync(filePath);
        const fileString = fileData.toString('utf-8', 0, Math.min(2000, fileData.length));
        
        // Check for common encryption dictionary markers in PDF
        const hasEncryptMarker = /\/Encrypt\s+\d+\s+\d+\s+R/i.test(fileString);
        
        // Look for additional indicators
        const hasEncryptionDictionary = fileString.includes('/Encrypt');
        const hasStandardFilter = fileString.includes('/StdCF') || fileString.includes('/Standard');
        
        const isEncrypted = hasEncryptMarker || hasEncryptionDictionary || hasStandardFilter;
        
        return {
          isEncrypted,
          userPasswordRequired: isEncrypted,
          ownerPasswordRequired: isEncrypted,
          encryptionLevel: null, // Cannot determine without qpdf
          restrictions: [],      // Cannot determine without qpdf
          message: 'PDF encryption status determined by binary inspection. For detailed analysis, install qpdf.'
        };
      } catch (error) {
        console.error('Alternative PDF protection check failed:', error);
        
        // Return a basic response as last resort
        return {
          isEncrypted: false,
          userPasswordRequired: false,
          ownerPasswordRequired: false,
          encryptionLevel: null,
          restrictions: [],
          note: 'Basic check only - install qpdf for detailed analysis'
        };
      }
    } catch (error) {
      // If the error is already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // Otherwise, throw a generic error
      throw new HttpException(
        `Failed to check PDF protection: ${error.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Build the permissions flags for qpdf based on the provided options
   * 
   * @param options Protection options
   * @returns String of permission flags for qpdf
   */
  private buildPermissionsFlags(options: ProtectOptionsDto): string[] {
    const permissions: string[] = [];

    // Add permissions based on options
    if (options.allowPrinting) permissions.push('print');
    if (options.allowModifying) permissions.push('modify');
    if (options.allowCopying) permissions.push('copy');
    if (options.allowAnnotating) permissions.push('annotate');
    if (options.allowFillingForms) permissions.push('form');
    if (options.allowScreenReaders) permissions.push('screen');
    if (options.allowAssembly) permissions.push('assemble');
    if (options.allowDegradedPrinting) permissions.push('all');

    // Join permissions for qpdf format
    if (permissions.length > 0) {
      return [`--permissions=${permissions.join(',')}`];
    } else {
      // If no permissions, don't add any flags and rely on qpdf defaults
      return [];
    }
  }

  /**
   * Get encryption parameters based on encryption level
   * 
   * @param encryptionLevel The desired encryption level
   * @returns String of encryption parameters for qpdf
   */
  private getEncryptionParams(encryptionLevel: EncryptionLevel): string {
    // In qpdf 10.x, the encryption level needs to be specified differently
    switch (encryptionLevel) {
      case EncryptionLevel.LOW:
        return '--bits=40'; // 40-bit RC4
      case EncryptionLevel.MEDIUM:
        return '--bits=128'; // 128-bit RC4
      case EncryptionLevel.HIGH:
        return '--bits=256'; // 256-bit AES
      default:
        return '--bits=256'; // Default to highest security
    }
  }
}