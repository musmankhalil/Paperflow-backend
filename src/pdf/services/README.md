# PDF Services Architecture

This directory contains the modular services for the PDF tools API. The code has been organized into logical modules for better maintainability, readability, and scalability.

## Module Structure

- **PdfService**: Core service that coordinates all PDF operations and delegates to specific service modules
- **PdfInfoService**: Handles PDF metadata extraction and information
- **PdfMergeSplitService**: Handles PDF merging and splitting operations
- **PdfExtractRotateService**: Handles PDF page extraction and rotation
- **PdfCompressionService**: Handles PDF compression operations
- **PdfToWordService**: Handles PDF to DOCX conversion
- **DocxToPdfService**: Handles DOCX to PDF conversion
- **PdfToXlsxService**: Handles PDF to XLSX conversion
- **PdfToPptxService**: Handles PDF to PowerPoint conversion
- **PptxToPdfService**: Handles PowerPoint to PDF conversion

## Usage

The main `PdfService` is the entry point for all operations and will delegate to the appropriate service module. You don't need to directly use the individual service modules in most cases.

```typescript
// Example usage in a controller
@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('extract-info')
  async extractPdfInfo(@Body() body): Promise<any> {
    const filePath = body.filePath;
    return this.pdfService.extractPdfInfo(filePath);
  }
}
```

## Extending

To add new functionality:

1. Create a new service module in this directory
2. Add it to the exports in `index.ts`
3. Register it in the module providers in `pdf.module.ts`
4. Add the corresponding methods to `PdfService` to delegate to your new service

## Dependencies

These services depend on various utilities in the `utils/` directory, plus external tools like LibreOffice and Python packages for specific operations.
