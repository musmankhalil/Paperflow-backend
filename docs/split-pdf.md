# Split PDF Functionality

This document describes the split PDF functionality available in the PaperFlow API.

## Basic Splitting

The basic splitting feature divides a PDF into individual pages, creating one PDF file per page.

### Endpoint

```
POST /pdf/split
```

### Parameters

- `file`: The PDF file to split (multipart/form-data)
- `download`: Optional query parameter. Set to `zip` to receive a ZIP file with all pages instead of JSON response

### Response

Without `download=zip`:
```json
{
  "message": "PDF split successfully",
  "pages": 5,
  "paths": [
    "page-1-1616233333.pdf",
    "page-2-1616233333.pdf",
    "page-3-1616233333.pdf",
    "page-4-1616233333.pdf",
    "page-5-1616233333.pdf"
  ]
}
```

With `download=zip`:
- Content-Type: application/zip
- A ZIP file containing all split pages
- Includes a `manifest.json` file with metadata about the split operation and each page (see [Manifest Format](manifest-format.md))

## Advanced Splitting

The advanced splitting feature provides more control over how PDFs are split, including options for specific split points, page ranges, and more.

### Endpoint

```
POST /pdf/split-advanced
```

### Parameters

- `file`: The PDF file to split (multipart/form-data)
- `mode`: Splitting mode (pages, ranges, everyNPages, bookmarks)
- `pages`: Array of page numbers where the PDF should be split (used with mode=pages)
- `ranges`: Array of page ranges to extract as separate PDFs (used with mode=ranges)
- `everyNPages`: Split every N pages (used with mode=everyNPages)
- `preserveBookmarks`: Whether to include bookmark information in split PDFs (if available)
- `filenamePrefix`: Prefix for output filenames
- `download`: Optional query parameter. Set to `zip` to receive a ZIP file with all parts instead of JSON response

### Splitting Modes

#### Pages Mode

Splits the PDF at specific page numbers. For example, if you specify pages [3, 5, 8] for a 10-page document, you'll get:
- PDF 1: pages 1-2
- PDF 2: pages 3-4
- PDF 3: pages 5-7
- PDF 4: pages 8-10

#### Ranges Mode

Creates separate PDFs for each specified page range. For example, with ranges [{start: 1, end: 3}, {start: 7, end: 9}], you'll get:
- PDF 1: pages 1-3
- PDF 2: pages 7-9

#### Every N Pages Mode

Splits the PDF every N pages. For example, with everyNPages=3 for a 10-page document, you'll get:
- PDF 1: pages 1-3
- PDF 2: pages 4-6
- PDF 3: pages 7-9
- PDF 4: page 10

#### Bookmarks Mode

Splits the PDF based on bookmarks/outline items. Note that bookmark-based splitting is a simplified implementation in the current version.

### Response

Without `download=zip`:
```json
{
  "message": "PDF split successfully with advanced options",
  "parts": 3,
  "paths": [
    "chapter-1-1616233333.pdf",
    "chapter-2-1616233333.pdf",
    "chapter-3-1616233333.pdf"
  ],
  "partInfo": [
    {
      "filename": "chapter-1-1616233333.pdf",
      "size": "125 KB",
      "pageCount": 5,
      "pages": [1, 2, 3, 4, 5]
    },
    {
      "filename": "chapter-2-1616233333.pdf",
      "size": "90 KB",
      "pageCount": 3,
      "pages": [6, 7, 8]
    },
    {
      "filename": "chapter-3-1616233333.pdf",
      "size": "150 KB",
      "pageCount": 7,
      "pages": [9, 10, 11, 12, 13, 14, 15]
    }
  ]
}
```

With `download=zip`:
- Content-Type: application/zip
- A ZIP file containing all split parts
- Includes a `manifest.json` file with metadata about the split operation and each part (see [Manifest Format](manifest-format.md))

## Examples

### Basic Split

```bash
curl -X POST "http://localhost:3000/pdf/split" \
  -F "file=@document.pdf"
```

### Advanced Split (using page ranges)

```bash
curl -X POST "http://localhost:3000/pdf/split-advanced?download=zip" \
  -F "file=@document.pdf" \
  -F "mode=ranges" \
  -F "ranges[0][start]=1" \
  -F "ranges[0][end]=5" \
  -F "ranges[1][start]=10" \
  -F "ranges[1][end]=15" \
  -F "filenamePrefix=chapter"
```

This will return a ZIP file containing two PDFs:
1. Chapter 1 (pages 1-5)
2. Chapter 2 (pages 10-15)
