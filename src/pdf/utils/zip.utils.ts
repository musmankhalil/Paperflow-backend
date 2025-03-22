import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

/**
 * Creates a ZIP file from multiple files
 * @param files Array of file paths to include in the ZIP
 * @param outputPath Path where the ZIP file should be saved
 * @param metadata Optional metadata to include as a JSON file in the ZIP
 * @returns Promise resolving to the path of the created ZIP file
 */
export async function createZipFromFiles(
  files: string[], 
  outputPath: string, 
  metadata?: any
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create a file to stream archive data to
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression level
    });

    // Listen for all archive data to be written
    output.on('close', function() {
      resolve(outputPath);
    });

    // Error handling
    archive.on('error', function(err) {
      reject(err);
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Add each file to the archive
    files.forEach((file) => {
      const filename = path.basename(file);
      archive.file(file, { name: filename });
    });
    
    // Add metadata if provided
    if (metadata) {
      archive.append(JSON.stringify(metadata, null, 2), { name: 'manifest.json' });
    }

    // Finalize the archive (i.e. we are done appending files)
    archive.finalize();
  });
}
