# Split PDF Manifest File Format

When using the `download=zip` parameter with the split PDF endpoints, a `manifest.json` file is included in the ZIP archive. This file contains metadata about the split operation and information about each split file.

## Basic Split Manifest

```json
{
  "createdAt": "2025-03-21T12:34:56.789Z",
  "originalFile": "document.pdf",
  "originalSize": "1024 KB",
  "totalPages": 5,
  "parts": [
    {
      "filename": "page-1-1616233333.pdf",
      "size": "210 KB",
      "pageCount": 1,
      "pageNumber": 1
    },
    {
      "filename": "page-2-1616233333.pdf",
      "size": "195 KB",
      "pageCount": 1,
      "pageNumber": 2
    },
    {
      "filename": "page-3-1616233333.pdf",
      "size": "205 KB",
      "pageCount": 1,
      "pageNumber": 3
    },
    {
      "filename": "page-4-1616233333.pdf",
      "size": "198 KB",
      "pageCount": 1,
      "pageNumber": 4
    },
    {
      "filename": "page-5-1616233333.pdf",
      "size": "220 KB",
      "pageCount": 1,
      "pageNumber": 5
    }
  ]
}
```

## Advanced Split Manifest

```json
{
  "createdAt": "2025-03-21T12:34:56.789Z",
  "originalFile": "document.pdf",
  "originalSize": "1024 KB",
  "splitMode": "ranges",
  "totalParts": 3,
  "parts": [
    {
      "filename": "chapter-1-1616233333.pdf",
      "size": "125 KB",
      "pageCount": 5
    },
    {
      "filename": "chapter-2-1616233333.pdf",
      "size": "90 KB",
      "pageCount": 3
    },
    {
      "filename": "chapter-3-1616233333.pdf",
      "size": "150 KB",
      "pageCount": 7
    }
  ]
}
```

## Fields

### Root Level

| Field | Type | Description |
|-------|------|-------------|
| `createdAt` | String | ISO timestamp when the ZIP file was created |
| `originalFile` | String | Name of the original PDF file that was split |
| `originalSize` | String | Size of the original PDF file |
| `splitMode` | String | Mode used for splitting (advanced split only) |
| `totalPages` | Number | Total number of pages in the original PDF (basic split only) |
| `totalParts` | Number | Total number of parts created (advanced split only) |
| `parts` | Array | Array of objects containing information about each split part |

### Part Information

| Field | Type | Description |
|-------|------|-------------|
| `filename` | String | Name of the split PDF file |
| `size` | String | Size of the split PDF file |
| `pageCount` | Number | Number of pages in the split PDF file |
| `pageNumber` | Number | Original page number (basic split only) |
