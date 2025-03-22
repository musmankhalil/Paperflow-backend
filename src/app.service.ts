import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApplicationInfo() {
    return {
      name: 'PaperFlow API',
      description: 'REST API for PDF manipulation and processing',
      version: '1.0.0',
      endpoints: {
        pdf: {
          info: '/api/pdf/info - Get PDF metadata and information',
          merge: '/api/pdf/merge - Merge multiple PDF files',
          split: '/api/pdf/split - Split a PDF into individual pages',
          extractPages: '/api/pdf/extract-pages - Extract specific pages from a PDF',
          rotate: '/api/pdf/rotate - Rotate pages in a PDF',
          compress: '/api/pdf/compress - Compress a PDF to reduce file size',
          download: '/api/pdf/download/:filename - Download a processed file'
        }
      }
    };
  }
}