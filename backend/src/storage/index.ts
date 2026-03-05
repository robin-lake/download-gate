import type { IMediaStorage } from './types.js';
import * as s3Storage from './s3Storage.js';
import { createLocalStorage } from './localStorage.js';

/**
 * When MEDIA_BUCKET is set (e.g. in Lambda from CDK), use S3. Otherwise use local filesystem
 * so you can build and test uploads locally without AWS.
 */
let instance: IMediaStorage | null = null;

export function getStorage(): IMediaStorage {
  if (!instance) {
    const bucket = process.env['MEDIA_BUCKET'];
    if (bucket) {
      instance = {
        upload: s3Storage.upload,
        getDownloadUrl: s3Storage.getDownloadUrl,
      };
    } else {
      instance = createLocalStorage();
    }
  }
  return instance;
}

export type { IMediaStorage, UploadResult } from './types.js';
export { getLocalStorageUploadDir } from './localStorage.js';
export { parseStoredKey, getDownloadUrl as s3GetDownloadUrl } from './s3Storage.js';
