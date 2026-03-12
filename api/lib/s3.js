/**
 * S3-compatible asset storage for Grudge Studio.
 *
 * Works with Railway Object Storage, Cloudflare R2, AWS S3, MinIO, etc.
 * Requires env vars: BUCKET_NAME, BUCKET_ENDPOINT, BUCKET_ACCESS_KEY, BUCKET_SECRET_KEY
 * Optional: BUCKET_REGION (defaults to 'us-east-1')
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ── Lazy singleton ──────────────────────────────────────────────────────────
let _client;

function getClient() {
  if (!_client) {
    const endpoint = (process.env.BUCKET_ENDPOINT || '').trim();
    const accessKeyId = (process.env.BUCKET_ACCESS_KEY || '').trim();
    const secretAccessKey = (process.env.BUCKET_SECRET_KEY || '').trim();

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error('S3 not configured — missing BUCKET_ENDPOINT, BUCKET_ACCESS_KEY, or BUCKET_SECRET_KEY');
    }

    _client = new S3Client({
      region: (process.env.BUCKET_REGION || 'us-east-1').trim(),
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true, // Required for most S3-compatible providers
    });
  }
  return _client;
}

function bucket() {
  const b = (process.env.BUCKET_NAME || '').trim();
  if (!b) throw new Error('S3 not configured — missing BUCKET_NAME');
  return b;
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Check whether S3 env vars are present. Does NOT test connectivity. */
export function isConfigured() {
  return !!(
    process.env.BUCKET_NAME &&
    process.env.BUCKET_ENDPOINT &&
    process.env.BUCKET_ACCESS_KEY &&
    process.env.BUCKET_SECRET_KEY
  );
}

/** Upload a buffer/stream to S3. Returns { key, bucket, size }. */
export async function upload(key, body, contentType = 'application/octet-stream', metadata = {}) {
  await getClient().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  }));
  const size = Buffer.isBuffer(body) ? body.length : undefined;
  return { key, bucket: bucket(), size };
}

/** Download an object. Returns the S3 GetObjectCommandOutput (Body is a readable stream). */
export async function download(key) {
  return getClient().send(new GetObjectCommand({
    Bucket: bucket(),
    Key: key,
  }));
}

/** Delete a single object. */
export async function remove(key) {
  await getClient().send(new DeleteObjectCommand({
    Bucket: bucket(),
    Key: key,
  }));
}

/** List objects under a prefix. Returns array of { Key, Size, LastModified }. */
export async function list(prefix = '', maxKeys = 1000, continuationToken = undefined) {
  const resp = await getClient().send(new ListObjectsV2Command({
    Bucket: bucket(),
    Prefix: prefix,
    MaxKeys: maxKeys,
    ContinuationToken: continuationToken,
  }));
  return {
    objects: (resp.Contents || []).map(o => ({
      key: o.Key,
      size: o.Size,
      lastModified: o.LastModified,
    })),
    truncated: resp.IsTruncated || false,
    nextToken: resp.NextContinuationToken || null,
    count: resp.KeyCount || 0,
  };
}

/** Head an object (metadata only, no body). */
export async function head(key) {
  const resp = await getClient().send(new HeadObjectCommand({
    Bucket: bucket(),
    Key: key,
  }));
  return {
    key,
    contentType: resp.ContentType,
    size: resp.ContentLength,
    lastModified: resp.LastModified,
    metadata: resp.Metadata || {},
  };
}

/** Copy an object within the same bucket. */
export async function copy(sourceKey, destKey) {
  await getClient().send(new CopyObjectCommand({
    Bucket: bucket(),
    CopySource: `${bucket()}/${sourceKey}`,
    Key: destKey,
  }));
  return { source: sourceKey, dest: destKey };
}

/** Generate a presigned GET URL (download). Default 1 hour expiry. */
export async function presignedDownloadUrl(key, expiresIn = 3600) {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn },
  );
}

/** Generate a presigned PUT URL (upload). Default 1 hour expiry. */
export async function presignedUploadUrl(key, contentType = 'application/octet-stream', expiresIn = 3600) {
  const url = await getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }),
    { expiresIn },
  );
  return { url, key, contentType, expiresIn };
}
