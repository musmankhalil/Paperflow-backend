# PPTX to PDF Conversion API

This document describes the API endpoints for converting PowerPoint (PPTX/PPT) files to PDF format.

## Endpoints

### Basic Conversion

Convert a PowerPoint file to PDF using standard settings.

**URL**: `/pdf/pptx-to-pdf/basic`

**Method**: `POST`

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file`: PowerPoint file to convert (PPTX or PPT)

**Response**:
```json
{
  "message": "PPTX successfully converted to PDF",
  "convertedFilePath": "converted-1234567890.pdf",
  "originalFile": "file-1234567890.pptx"
}
```

### Advanced Conversion

Convert a PowerPoint file to PDF with customized settings.

**URL**: `/pdf/pptx-to-pdf/advanced`

**Method**: `POST`

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file`: PowerPoint file to convert (PPTX or PPT)
- `options`: JSON object with conversion options:
  ```json
  {
    "quality": "standard", // "draft", "standard", "high", or "premium"
    "compliance": "pdf-1.7", // "pdf-1.5", "pdf-1.6", "pdf-1.7", "pdf/a-1b", "pdf/a-2b", or "pdf/a-3b"
    "imageHandling": "preserve", // "preserve", "optimize", or "compress"
    "slideOptions": {
      "includeSlideNumbers": true,
      "includeNotes": false,
      "includeHiddenSlides": false,
      "includeAnimations": false
    },
    "security": {
      "encrypt": false,
      "userPassword": "",
      "ownerPassword": "",
      "allowPrinting": true,
      "allowCopying": true,
      "allowEditing": false
    },
    "metadata": {
      "title": "My Presentation",
      "author": "John Doe",
      "subject": "Presentation Subject",
      "keywords": "presentation, pdf, convert",
      "creator": "PaperFlow API",
      "includeCreationDate": true
    },
    "advanced": {
      "optimizeForWeb": false,
      "compressPdf": true,
      "preserveHyperlinks": true,
      "createBookmarks": true,
      "imageQuality": 90,
      "downsampleDpi": 300
    },
    "slideSelection": [1, 2, 5, 10] // Specific slides to include (empty means all slides)
  }
  ```

**Response**:
```json
{
  "message": "PPTX successfully converted to PDF with advanced options",
  "convertedFilePath": "converted-advanced-1234567890.pdf",
  "originalFile": "file-1234567890.pptx",
  "appliedOptions": {
    "quality": "standard",
    "compliance": "pdf-1.7",
    // ... (the options that were applied)
  }
}
```

### PDF/A Conversion (Archiving)

Convert a PowerPoint file to PDF/A format for long-term archiving.

**URL**: `/pdf/pptx-to-pdf/archive?version=1b`

**Method**: `POST`

**Content-Type**: `multipart/form-data`

**Request Parameters**:
- `version`: PDF/A version (optional, default: "1b")
  - Possible values: "1b", "2b", "3b"

**Request Body**:
- `file`: PowerPoint file to convert (PPTX or PPT)

**Response**:
```json
{
  "message": "PPTX successfully converted to PDF/A-1b",
  "convertedFilePath": "converted-1234567890.pdf",
  "originalFile": "file-1234567890.pptx",
  "pdfaVersion": "1b"
}
```

### Preview Generation

Generate a web-optimized PDF preview from a PowerPoint file.

**URL**: `/pdf/pptx-to-pdf/preview`

**Method**: `POST`

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file`: PowerPoint file to convert (PPTX or PPT)

**Response**:
```json
{
  "message": "PPTX preview generated successfully",
  "previewFilePath": "preview-1234567890.pdf",
  "originalFile": "file-1234567890.pptx"
}
```

### Conversion Analysis

Analyze a PowerPoint file for conversion compatibility and get recommendations.

**URL**: `/pdf/pptx-to-pdf/analyze`

**Method**: `POST`

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file`: PowerPoint file to analyze (PPTX or PPT)

**Response**:
```json
{
  "message": "PPTX analyzed successfully",
  "analysis": {
    "filename": "presentation.pptx",
    "fileSize": "5.43 MB",
    "fileFormat": "PPTX",
    "conversionStatus": {
      "isCompatible": true,
      "error": null,
      "warning": "Large file size may result in longer conversion time"
    },
    "availableTools": {
      "libreOffice": true,
      "otherTools": false,
      "canPerformBasicConversion": true,
      "canPerformAdvancedConversion": true
    },
    "conversionEstimates": {
      "standardQuality": "12 seconds",
      "highQuality": "25 seconds"
    },
    "recommendations": {
      "recommendedQuality": "standard",
      "recommendedCompliance": "pdf-1.7",
      "imageHandling": "optimize"
    }
  },
  "originalFile": "file-1234567890.pptx"
}
```

### Download Converted File

Download a converted PDF file.

**URL**: `/pdf/pptx-to-pdf/download/{filename}`

**Method**: `GET`

**URL Parameters**:
- `filename`: Name of the file to download

**Response**: The file is downloaded as an attachment.

## Error Responses

### File Not Found
```json
{
  "message": "File not found"
}
```

### Invalid File Type
```json
{
  "message": "Only PowerPoint files (PPTX, PPT) are allowed"
}
```

### Conversion Failed
```json
{
  "message": "Conversion failed: LibreOffice is required for PPTX to PDF conversion but is not installed on the server"
}
```
