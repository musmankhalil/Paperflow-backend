import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directory exists
const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Injectable()
export class MulterConfigService {
  constructor(private configService: ConfigService) {}
  
  createMulterOptions() {
    const maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 15728640); // Default 15MB
    
    return {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, callback) => {
          // Generate a unique filename with original extension
          const uniqueFilename = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueFilename);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Check file type
        if (file.mimetype !== 'application/pdf') {
          return callback(
            new HttpException(
              'Only PDF files are allowed',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: maxFileSize,
      },
    };
  }
  
  createMultipleFilesOptions() {
    const config = this.createMulterOptions();
    const maxFiles = this.configService.get<number>('MAX_FILES', 10);
    
    return {
      ...config,
      limits: {
        ...config.limits,
        files: maxFiles,
      },
    };
  }
}

// Legacy exports for backward compatibility
export const multerConfig = {
  storage: diskStorage({
    destination: uploadDir,
    filename: (req, file, callback) => {
      const uniqueFilename = `${uuidv4()}${extname(file.originalname)}`;
      callback(null, uniqueFilename);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== 'application/pdf') {
      return callback(
        new HttpException(
          'Only PDF files are allowed',
          HttpStatus.BAD_REQUEST,
        ),
        false,
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
};

export const multipleFilesConfig = {
  ...multerConfig,
  limits: {
    ...multerConfig.limits,
    files: 10, // maximum 10 files at once
  },
};