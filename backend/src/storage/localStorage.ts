import fs from 'fs/promises';
import path from 'path';
import type { IMediaStorage, UploadResult } from './types.js';

const UPLOAD_DIR = process.env['LOCAL_STORAGE_DIR'] ?? path.join(process.cwd(), 'local-storage');
const BASE_URL = process.env['STORAGE_BASE_URL'] ?? 'http://localhost:3000';

/**
 * Local filesystem storage for development. Files are written under LOCAL_STORAGE_DIR
 * and served at GET /api/uploads/:key. Set STORAGE_BASE_URL to match your dev server
 * (e.g. http://localhost:3000) so returned URLs work from the frontend.
 */
export function createLocalStorage(): IMediaStorage {
  return {
    async upload(params: {
      key: string;
      body: Buffer | Uint8Array;
      contentType: string;
    }): Promise<UploadResult> {
      const key = params.key;
      const filePath = path.join(UPLOAD_DIR, key);
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, params.body);
      const url = `${BASE_URL.replace(/\/$/, '')}/api/uploads/${key}`;
      return { url, key };
    },

    async getDownloadUrl(key: string): Promise<string> {
      return `${BASE_URL.replace(/\/$/, '')}/api/uploads/${key}`;
    },
  };
}

export function getLocalStorageUploadDir(): string {
  return UPLOAD_DIR;
}
