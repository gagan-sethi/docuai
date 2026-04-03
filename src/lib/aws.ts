import { S3Client } from "@aws-sdk/client-s3";

/**
 * S3 configuration uses the dedicated S3 credentials from .env:
 *   AWS_S3_BUCKET, AWS_S3_ACCESS_KEYS, AWS_S3_SECRET_KEYS
 *
 * Falls back to the generic AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
 * if the S3-specific keys are not set.
 */
const s3AccessKey =
  process.env.AWS_S3_ACCESS_KEYS?.trim() ||
  process.env.AWS_ACCESS_KEY_ID?.trim() ||
  "";
const s3SecretKey =
  process.env.AWS_S3_SECRET_KEYS?.trim() ||
  process.env.AWS_SECRET_ACCESS_KEY?.trim() ||
  "";

export const isS3Configured = Boolean(
  process.env.AWS_S3_BUCKET?.trim() && s3AccessKey && s3SecretKey
);

export const S3_BUCKET = process.env.AWS_S3_BUCKET?.trim() || "";

export const MEDIA_BASE_URL = process.env.MEDIA_BASE_URL?.trim() || "";

// Only create the real S3 client when credentials are present
export const s3Client: S3Client | null = isS3Configured
  ? new S3Client({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        accessKeyId: s3AccessKey,
        secretAccessKey: s3SecretKey,
      },
    })
  : null;

if (isS3Configured) {
  console.log(`[aws] S3 client configured (bucket=${S3_BUCKET}, region=${process.env.AWS_REGION || "ap-south-1"})`);
} else {
  console.log("[aws] S3 not configured — running in local/demo mode");
}
