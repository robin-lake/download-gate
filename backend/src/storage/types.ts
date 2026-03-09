/**
 * Storage abstraction for media (cover art, audio). Implementations:
 * - S3: production (and optional LocalStack when S3_ENDPOINT + MEDIA_BUCKET set).
 * - Local: development when MEDIA_BUCKET is unset; writes to disk and serves via /api/uploads.
 */

export interface UploadResult {
  /** URL to use in DB and for client access (public or signed). */
  url: string;
  /** Internal key/path (for signed URL generation later if needed). */
  key: string;
}

export interface IMediaStorage {
  /**
   * Upload a file. Returns a URL the client can use (and that can be stored in DownloadGate).
   * For S3 this may be a presigned or public URL; for local it is the server's /api/uploads/{key}.
   */
  upload(params: {
    key: string;
    body: Buffer | Uint8Array;
    contentType: string;
  }): Promise<UploadResult>;

  /**
   * Return a URL suitable for downloading the object (e.g. presigned for private S3).
   * For local storage, returns the same URL as upload (already served by Express).
   */
  getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
