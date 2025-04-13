import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from './multer.config';
import {
  PdfInfoController,
  PdfMergeController,
  PdfSplitController,
  PdfExtractController,
  PdfRotateController,
  PdfCompressController,
  PdfProtectController,
  PdfUtilsController,
  PdfConvertController,
  PdfDocxToPdfController,
  PdfToPptxController,
  PptxToPdfController,
  PdfToXlsxController,
  XlsxToPdfController,
  PdfNumberPagesController,
  PdfWatermarkController,
} from './controllers';

import { PdfService } from './pdf.service';
import {
  PdfInfoService,
  PdfMergeSplitService,
  PdfExtractRotateService,
  PdfCompressionService,
  PdfProtectionService,
  PdfToWordService,
  DocxToPdfService,
  PdfToXlsxService,
  PdfToPptxService,
  PptxToPdfService,
  XlsxToPdfService,
  PdfNumberPagesService,
  PdfWatermarkService,
} from './services';

@Module({
  imports: [
    MulterModule.register(multerConfig),
  ],
  controllers: [
    PdfInfoController,
    PdfMergeController,
    PdfSplitController,
    PdfExtractController,
    PdfRotateController,
    PdfCompressController,
    PdfProtectController,
    PdfUtilsController,
    PdfConvertController,
    PdfDocxToPdfController,
    PdfToPptxController,
    PptxToPdfController,
    PdfToXlsxController,
    XlsxToPdfController,
    PdfNumberPagesController,
    PdfWatermarkController,
  ],
  providers: [
    PdfService,
    PdfInfoService,
    PdfMergeSplitService,
    PdfExtractRotateService,
    PdfCompressionService,
    PdfProtectionService,
    PdfToWordService,
    DocxToPdfService,
    PdfToXlsxService,
    PdfToPptxService,
    PptxToPdfService,
    XlsxToPdfService,
    PdfNumberPagesService,
    PdfWatermarkService,
  ],
  exports: [PdfService],
})
export class PdfModule {}