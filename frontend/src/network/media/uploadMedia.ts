const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface UploadMediaResponse {
  url: string;
  key: string;
}

export interface UploadMediaOptions {
  getToken: (() => Promise<string | null>) | null;
}

async function uploadFile(
  endpoint: string,
  file: File,
  options: UploadMediaOptions
): Promise<UploadMediaResponse> {
  const { getToken } = options;
  const token = getToken ? await getToken() : null;
  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const raw: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      raw &&
      typeof raw === 'object' &&
      'error' in raw &&
      typeof (raw as { error: unknown }).error === 'string'
        ? (raw as { error: string }).error
        : `Upload failed: ${response.status}`;
    throw new Error(message);
  }

  if (
    !raw ||
    typeof raw !== 'object' ||
    typeof (raw as UploadMediaResponse).url !== 'string' ||
    typeof (raw as UploadMediaResponse).key !== 'string'
  ) {
    throw new Error('Invalid upload response');
  }

  return raw as UploadMediaResponse;
}

/**
 * Upload cover art image. Allowed: JPEG, PNG, GIF, WebP; max 5 MB.
 */
export function uploadCoverArt(
  file: File,
  options: UploadMediaOptions
): Promise<UploadMediaResponse> {
  return uploadFile('/api/media/upload-cover', file, options);
}

/**
 * Upload audio file. Allowed: MP3, WAV, FLAC, AAC, OGG; max 100 MB.
 */
export function uploadAudio(
  file: File,
  options: UploadMediaOptions
): Promise<UploadMediaResponse> {
  return uploadFile('/api/media/upload-audio', file, options);
}
