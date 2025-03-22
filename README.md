# PaperFlow API

A REST API backend for PDF manipulation and processing built with NestJS.

## Features

- Extract PDF metadata and information
- Merge multiple PDF files
- Split a PDF into individual pages
- Extract specific pages from a PDF
- Rotate pages in a PDF
- Compress a PDF to reduce file size
- Convert PDF to Word documents (DOCX)

## Installation

```bash
npm install
```

### Requirements

For PDF to Word conversion functionality, you need to have LibreOffice installed on your server:

#### Ubuntu/Debian
```bash
sudo apt-get install libreoffice
```

#### macOS
```bash
brew install libreoffice
```

#### Windows
Download and install from the [LibreOffice website](https://www.libreoffice.org/download/download/)

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## API Organization

The API endpoints are organized into logical groups based on their functionality. For details, see [API Organization](docs/api-organization.md).

## API Endpoints

### PDF Utils

#### Health Check
```
GET /api/pdf/health
```
Check if the PDF service is up and running.

#### Download Processed File
```
GET /api/pdf/download/:filename
```
Download a previously processed file by its filename.

**Response:** PDF file download.

### PDF Info

#### Get PDF Information
```
POST /api/pdf/info
```
Upload a PDF file and extract metadata and content information.

**Request:** Form data with key `file` containing a PDF file.

**Response:** JSON object with PDF metadata and information.

### PDF Merge

#### Merge PDFs
```
POST /api/pdf/merge
```
Upload multiple PDF files and merge them into a single PDF.

**Request:** Form data with key `files[]` containing multiple PDF files.

**Response:** PDF file download of the merged document.

#### Advanced Merge PDFs
```
POST /api/pdf/merge/advanced
```
Upload multiple PDF files and merge them with advanced options.

**Request:** Form data with key `files[]` containing multiple PDF files and advanced merge options.

**Response:** PDF file download of the merged document.

### PDF Split

#### Split PDF
```
POST /api/pdf/split
```
Upload a PDF file and split it into individual pages.

**Request:** 
- Form data with key `file` containing a PDF file
- Optional query parameter `download=zip` to receive a ZIP file with all pages

**Response:** 
- JSON object with information about the split operation, or 
- ZIP file containing all split pages if `download=zip` is specified

#### Advanced Split PDF
```
POST /api/pdf/split/advanced
```
Upload a PDF file and split it with advanced options such as at specific pages, by page ranges, or every N pages.

**Request:**
- Form data with key `file` containing a PDF file
- Parameters for the split operation:
  - `mode`: Splitting mode (pages, ranges, everyNPages, bookmarks)
  - `pages`: Array of page numbers where the PDF should be split (used with mode=pages)
  - `ranges`: Array of page ranges to extract as separate PDFs (used with mode=ranges)
  - `everyNPages`: Split every N pages (used with mode=everyNPages)
  - `filenamePrefix`: Prefix for output filenames
- Optional query parameter `download=zip` to receive a ZIP file with all parts

**Response:**
- JSON object with information about the split operation, or
- ZIP file containing all split parts if `download=zip` is specified

See [Split PDF Documentation](docs/split-pdf.md) for more details and examples. For information about the ZIP manifest format, see [Manifest Format Documentation](docs/manifest-format.md).

### PDF Extract

#### Extract Specific Pages
```
POST /api/pdf/extract/pages
```
Extract specific pages from a PDF file.

**Request:** 
- Form data with key `file` containing a PDF file
- JSON body with page numbers to extract:
```json
{
  "pages": [1, 3, 5]
}
```

**Response:** PDF file download with only the specified pages.

### PDF Rotate

#### Rotate Pages
```
POST /api/pdf/rotate
```
Rotate specific pages in a PDF file.

**Request:**
- Form data with key `file` containing a PDF file
- JSON body with rotation instructions:
```json
{
  "rotations": [
    { "page": 1, "degrees": 90 },
    { "page": 2, "degrees": 180 }
  ]
}
```

**Response:** PDF file download with rotated pages.

### PDF Compress

#### Compress PDF
```
POST /api/pdf/compress
```
Compress a PDF file to reduce its size.

**Request:** Form data with key `file` containing a PDF file.

**Response:** PDF file download of the compressed document.

### PDF Conversion

#### Convert PDF to Word (Basic)
```
POST /api/pdf/convert/to-word/basic
```
Convert a PDF file to a Word document (.docx) with basic settings.

**Request:** Form data with key `file` containing a PDF file.

**Response:** JSON with information about the converted file and download link.

#### Convert PDF to Word (Advanced)
```
POST /api/pdf/convert/to-word/advanced
```
Convert a PDF file to a Word document (.docx) with advanced formatting options.

**Request:** 
- Form data with key `file` containing a PDF file
- JSON body with conversion options:
```json
{
  "options": {
    "quality": "standard", // "basic", "standard", "enhanced", or "precise"
    "fontHandling": "substitute", // "substitute", "embed", or "fallback_only"
    "formatting": {
      "preserveImages": true,
      "preserveLinks": true,
      "preserveTables": true,
      "defaultFontFamily": "Arial"
    },
    "advanced": {
      "detectLists": true,
      "detectHeadings": true,
      "preserveColorProfile": true,
      "optimizeForAccessibility": false
    }
  }
}
```

**Response:** JSON with information about the converted file and download link.

#### Download Converted Document
```
GET /api/pdf/convert/download/:filename
```
Download a previously converted document by its filename.

**Response:** Word document (.docx) file download.

## Example Usage with cURL

### PDF Info

**Get PDF Information:**
```bash
curl -X POST http://localhost:3000/api/pdf/info \
  -F "file=@/path/to/your/document.pdf"
```

### PDF Merge

**Merge PDFs:**
```bash
curl -X POST http://localhost:3000/api/pdf/merge \
  -F "files=@/path/to/first.pdf" \
  -F "files=@/path/to/second.pdf" \
  -o merged.pdf
```

**Advanced Merge PDFs:**
```bash
curl -X POST http://localhost:3000/api/pdf/merge/advanced \
  -F "files=@/path/to/first.pdf" \
  -F "files=@/path/to/second.pdf" \
  -F "documentInfo[title]=Merged Document" \
  -F "documentInfo[author]=PaperFlow API" \
  -F "addBookmarks=true" \
  -o merged_advanced.pdf
```

### PDF Split

**Split PDF into Individual Pages:**
```bash
curl -X POST http://localhost:3000/api/pdf/split \
  -F "file=@/path/to/document.pdf"
```

**Split PDF into Individual Pages and Download as ZIP:**
```bash
curl -X POST http://localhost:3000/api/pdf/split?download=zip \
  -F "file=@/path/to/document.pdf" \
  -o split_pages.zip
```

**Advanced Split PDF by Page Ranges:**
```bash
curl -X POST http://localhost:3000/api/pdf/split/advanced \
  -F "file=@/path/to/document.pdf" \
  -F "mode=ranges" \
  -F "ranges[0][start]=1" \
  -F "ranges[0][end]=5" \
  -F "ranges[1][start]=10" \
  -F "ranges[1][end]=15" \
  -F "filenamePrefix=chapter"
```

**Advanced Split PDF Every N Pages and Download as ZIP:**
```bash
curl -X POST http://localhost:3000/api/pdf/split/advanced?download=zip \
  -F "file=@/path/to/document.pdf" \
  -F "mode=everyNPages" \
  -F "everyNPages=3" \
  -F "filenamePrefix=section" \
  -o split_sections.zip
```

### PDF Extract

**Extract Specific Pages:**
```bash
curl -X POST http://localhost:3000/api/pdf/extract/pages \
  -F "file=@/path/to/document.pdf" \
  -F "pages=[1, 3, 5]" \
  -o extracted.pdf
```

### PDF Rotate

**Rotate Specific Pages:**
```bash
curl -X POST http://localhost:3000/api/pdf/rotate \
  -F "file=@/path/to/document.pdf" \
  -F "rotations[0][page]=1" \
  -F "rotations[0][degrees]=90" \
  -F "rotations[1][page]=2" \
  -F "rotations[1][degrees]=180" \
  -o rotated.pdf
```

### PDF Compress

**Compress PDF:**
```bash
curl -X POST http://localhost:3000/api/pdf/compress \
  -F "file=@/path/to/document.pdf" \
  -o compressed.pdf
```

### PDF Conversion

**Convert PDF to Word (Basic):**
```bash
curl -X POST http://localhost:3000/api/pdf/convert/to-word/basic \
  -F "file=@/path/to/document.pdf"
```

**Convert PDF to Word (Advanced):**
```bash
curl -X POST http://localhost:3000/api/pdf/convert/to-word/advanced \
  -F "file=@/path/to/document.pdf" \
  -F 'options={"quality":"enhanced","formatting":{"preserveImages":true,"preserveTables":true},"advanced":{"detectHeadings":true}}'
```

**Download Converted Document:**
```bash
curl -X GET http://localhost:3000/api/pdf/convert/download/converted-1234567890.docx \
  -o converted.docx
```

### PDF Utils

**Download Processed File:**
```bash
curl -X GET http://localhost:3000/api/pdf/download/processed-file.pdf \
  -o downloaded.pdf
```

**Check Service Health:**
```bash
curl -X GET http://localhost:3000/api/pdf/health
```

## License

[MIT](LICENSE)