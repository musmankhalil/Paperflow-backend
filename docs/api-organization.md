# API Organization

The PaperFlow API endpoints are organized into logical groups based on their functionality. This makes the API more intuitive to use and the documentation easier to navigate.

## API Endpoint Groups

| Group | Route Base | Description |
|-------|------------|-------------|
| PDF Info | `/api/pdf/info` | Extract metadata and information from PDF files |
| PDF Merge | `/api/pdf/merge` | Merge multiple PDF files into a single document |
| PDF Split | `/api/pdf/split` | Split PDF files into multiple documents |
| PDF Extract | `/api/pdf/extract` | Extract specific pages from PDF files |
| PDF Rotate | `/api/pdf/rotate` | Rotate pages in PDF files |
| PDF Compress | `/api/pdf/compress` | Compress PDF files to reduce size |
| PDF Utils | `/api/pdf` | Utility operations like health check and download |

## Swagger Documentation

The Swagger UI organizes endpoints into these groups, making it easier to find the functionality you need.

For example, if you're looking for operations related to splitting PDFs, you can simply focus on the "pdf-split" section in the Swagger documentation.

## Example Routes

- PDF Info: 
  - `POST /api/pdf/info` - Extract PDF metadata

- PDF Merge:
  - `POST /api/pdf/merge` - Merge multiple PDFs
  - `POST /api/pdf/merge/advanced` - Merge with advanced options

- PDF Split:
  - `POST /api/pdf/split` - Split PDF into pages
  - `POST /api/pdf/split/advanced` - Split with advanced options

- PDF Extract:
  - `POST /api/pdf/extract/pages` - Extract specific pages

- PDF Rotate:
  - `POST /api/pdf/rotate` - Rotate PDF pages

- PDF Compress:
  - `POST /api/pdf/compress` - Compress PDF

- PDF Utils:
  - `GET /api/pdf/health` - Check service health
  - `GET /api/pdf/download/:filename` - Download processed file

## Benefits of This Organization

1. **Improved documentation clarity:** Endpoints are grouped logically by function
2. **Easier API navigation:** Users can quickly find the endpoints they need
3. **Better code organization:** Controllers are modular and focused on specific functionality
4. **Simpler maintenance:** Each feature area can be maintained independently
