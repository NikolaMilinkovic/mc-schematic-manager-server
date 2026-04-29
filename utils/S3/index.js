const { randomUUID } = require("node:crypto");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getBucketName() {
  return requiredEnv("AWS_BUCKET");
}

function getRegion() {
  return requiredEnv("AWS_REGION");
}

const s3Client = new S3Client({
  region: getRegion(),
});

function buildS3Url(bucket, region, key) {
  const encodedKey = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
}

function mimeExtension(contentType) {
  const map = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
  };

  return map[contentType] || "bin";
}

async function uploadBufferToS3({
  key,
  buffer,
  contentType = "application/octet-stream",
  metadata,
  cacheControl,
}) {
  if (!key) {
    throw new Error("uploadBufferToS3 requires key");
  }
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("uploadBufferToS3 requires buffer (Node Buffer)");
  }

  const bucket = getBucketName();
  const region = getRegion();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: metadata,
      CacheControl: cacheControl,
    }),
  );

  return {
    bucket,
    key,
    url: buildS3Url(bucket, region, key),
  };
}

async function uploadBase64ImageToS3(dataUri, { keyPrefix = "images" } = {}) {
  if (!dataUri || typeof dataUri !== "string") {
    throw new Error("uploadBase64ImageToS3 requires a data URI string");
  }

  const match = dataUri.match(/^data:([\w/+.-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URI format");
  }

  const contentType = match[1];
  const base64Payload = match[2];
  const buffer = Buffer.from(base64Payload, "base64");
  const extension = mimeExtension(contentType);
  const normalizedPrefix = String(keyPrefix).replace(/\/+$/, "");
  const key = `${normalizedPrefix}/${Date.now()}-${randomUUID()}.${extension}`;

  return uploadBufferToS3({
    key,
    buffer,
    contentType,
  });
}

async function deleteFromS3(key) {
  if (!key) {
    throw new Error("deleteFromS3 requires key");
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    }),
  );

  return { key };
}

async function objectExistsInS3(key) {
  if (!key) {
    return false;
  }

  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: getBucketName(),
        Key: key,
      }),
    );

    return true;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") {
      return false;
    }

    throw error;
  }
}

async function runS3StartupWriteTest() {
  const now = new Date().toISOString();
  const prefix = process.env.S3_STARTUP_TEST_PREFIX || "startup-checks";
  const key = `${prefix}/startup-${now.replace(/[.:]/g, "-")}.txt`;
  const payload = Buffer.from(`S3 startup check OK at ${now}\n`, "utf8");

  return uploadBufferToS3({
    key,
    buffer: payload,
    contentType: "text/plain; charset=utf-8",
    cacheControl: "no-store",
  });
}

async function generatePresignedGetUrl(key, expiresInSeconds = 3600) {
  if (!key) {
    throw new Error("generatePresignedGetUrl requires key");
  }

  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

module.exports = {
  s3Client,
  uploadBufferToS3,
  uploadBase64ImageToS3,
  deleteFromS3,
  objectExistsInS3,
  generatePresignedGetUrl,
  runS3StartupWriteTest,
};
