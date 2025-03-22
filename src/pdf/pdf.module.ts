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
} from './controllers';

import {
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
  ],
  exports: [PdfService],
})
export class PdfModule {}