import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Save a base64 data URL to a file and return the file path
   */
  async saveBase64Image(dataUrl: string): Promise<string> {
    // If it's not a data URL, return as-is (might already be a URL)
    if (!dataUrl.startsWith('data:')) {
      return dataUrl;
    }

    // Parse the data URL
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid data URL format');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    
    // Determine file extension from mime type
    const extension = this.getExtensionFromMimeType(mimeType);
    
    // Generate unique filename
    const filename = `${uuidv4()}${extension}`;
    const filePath = path.join(this.uploadDir, filename);

    // Write file
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    // Return the relative URL path (to be served by the backend)
    return `/uploads/${filename}`;
  }

  /**
   * Save an uploaded file and return the file path
   */
  async saveUploadedFile(file: Express.Multer.File): Promise<string> {
    const extension = path.extname(file.originalname) || this.getExtensionFromMimeType(file.mimetype);
    const filename = `${uuidv4()}${extension}`;
    const filePath = path.join(this.uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    return `/uploads/${filename}`;
  }

  /**
   * Delete a file by its URL path
   */
  async deleteFile(urlPath: string): Promise<void> {
    if (!urlPath || !urlPath.startsWith('/uploads/')) {
      return;
    }
    
    const filename = path.basename(urlPath);
    const filePath = path.join(this.uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/bmp': '.bmp',
      'image/ico': '.ico',
      'image/x-icon': '.ico',
    };
    return mimeToExt[mimeType] || '.jpg';
  }
}
