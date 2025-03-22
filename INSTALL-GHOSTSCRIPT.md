# Installing Ghostscript for High-Quality PDF Compression

PaperFlow uses Ghostscript for high-quality PDF compression similar to commercial tools like iLovePDF. When Ghostscript is installed, our compression can achieve up to 90-98% size reduction on image-heavy PDFs.

## Installation Instructions

### MacOS

Using Homebrew:
```bash
brew install ghostscript
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install ghostscript
```

### Windows

1. Download the latest Ghostscript installer from the [official website](https://www.ghostscript.com/releases/gsdnld.html)
2. Run the installer and follow the instructions
3. Make sure to add Ghostscript to your PATH environment variable

## Verification

To verify that Ghostscript is installed correctly, run:

```bash
gs --version
```

You should see the Ghostscript version number, such as `9.54.0`.

## Docker

If running PaperFlow in Docker, the Dockerfile already includes Ghostscript installation, so no additional setup is required.

## Troubleshooting

If you see log messages indicating that Ghostscript is not available, check that:

1. Ghostscript is properly installed
2. The `gs` command is available in your PATH
3. The application has the necessary permissions to execute the `gs` command

## Performance

With Ghostscript properly installed, PaperFlow's compression should be comparable to commercial PDF compression tools, with compression ratios of:

- Low compression: 60-70% reduction
- Medium compression: 70-85% reduction
- High compression: 85-95% reduction
- Maximum compression: 90-98% reduction

These ratios are especially noticeable on image-heavy PDFs.
