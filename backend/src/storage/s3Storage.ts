import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucket = process.env['MEDIA_BUCKET']!;
const region = process.env['AWS_REGION'] ?? 'us-east-1';
const endpoint = process.env['S3_ENDPOINT']; // Optional: for LocalStack or custom endpoint

const client = new S3Client({
  region,
  ...(endpoint && { endpoint }),
  ...(endpoint?.includes('localhost') && {
    forcePathStyle: true,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  }),
});

/** Prefix for all media keys (e.g. "media/" or "gates/"). */
const KEY_PREFIX = 'media/';

export async function upload(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ url: string; key: string }> {
  const key = KEY_PREFIX + params.key;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );
  // Store a stable URL that the backend resolves to a presigned URL when accessed (GET /api/media/stream?key=...).
  const baseUrl = process.env['BASE_URL'] ?? '';
  const url = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/api/media/stream?key=${encodeURIComponent(key)}`
    : `s3://${bucket}/${key}`;
  return { url, key };
}

export async function getDownloadUrl(
  keyOrFullKey: string,
  expiresInSeconds = 3600
): Promise<string> {
  const key = keyOrFullKey.startsWith(KEY_PREFIX) ? keyOrFullKey : KEY_PREFIX + keyOrFullKey;
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Extract the S3 key from a stored value. Accepts either full key or "s3://bucket/key" format.
 */
export function parseStoredKey(storedUrlOrKey: string): string {
  if (storedUrlOrKey.startsWith('s3://')) {
    const match = /^s3:\/\/[^/]+\/(.+)$/.exec(storedUrlOrKey);
    return match ? match[1] : storedUrlOrKey;
  }
  return storedUrlOrKey.startsWith(KEY_PREFIX) ? storedUrlOrKey : KEY_PREFIX + storedUrlOrKey;
}
