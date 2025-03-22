import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PdfXlsxService } from './pdf-xlsx.service';
import { PdfXlsxController } from './pdf-xlsx.controller';
import * as path from 'path';
import * as multer from 'multer';

// Configure multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  },
});

const multerConfig = {
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
};

@Module({
  imports: [
    MulterModule.register(multerConfig),
  ],
  controllers: [PdfXlsxController],
  providers: [PdfXlsxService],
  exports: [PdfXlsxService],
})
export class PdfXlsxModule {}