import { UserFacingError } from "@/lib/friendly-errors";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const PHOTO_MAX_EDGE_PX = 3840;
const PHOTO_JPEG_QUALITY = 92;
const PHOTO_WEBP_QUALITY = 92;
const PRESIGNED_POST_OVERHEAD_BYTES = 1024 * 1024;
const UPLOAD_URL_TTL_SECONDS = 5 * 60;
const DOWNLOAD_URL_TTL_SECONDS = 60;

export type DocumentUploadMetadata = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export type ValidatedDocumentUpload = DocumentUploadMetadata & {
  format: string;
};

const FORMAT_BY_EXTENSION: Record<string, string> = {
  pdf: "PDF",
  png: "PNG",
  jpg: "JPG",
  jpeg: "JPG",
  webp: "WEBP",
  doc: "DOC",
  docx: "DOCX",
  xls: "XLS",
  xlsx: "XLSX",
};

const FORMAT_BY_MIME: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/webp": "WEBP",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
};

const MIME_BY_FORMAT: Record<string, string> = {
  PDF: "application/pdf",
  PNG: "image/png",
  JPG: "image/jpeg",
  JPEG: "image/jpeg",
  WEBP: "image/webp",
  DOC: "application/msword",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  XLS: "application/vnd.ms-excel",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace(".", ",")} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function mimeForFormat(format: string, fileName?: string) {
  const fromFormat = MIME_BY_FORMAT[format.toUpperCase()];
  if (fromFormat) return fromFormat;
  const extension = fileName ? extensionOf(fileName) : "";
  return MIME_BY_FORMAT[FORMAT_BY_EXTENSION[extension] ?? ""] ?? "application/octet-stream";
}

export function getUploadedFile(form: FormData, key: string) {
  return getUploadedFiles(form, key)[0] ?? null;
}

export function getUploadedFiles(form: FormData, key: string) {
  return form.getAll(key).flatMap((value) => {
    if (!value || typeof value === "string") return [];
    const file = value as File;
    return file.size > 0 && typeof file.arrayBuffer === "function" ? [file] : [];
  });
}

const IMAGE_FORMATS = new Set(["PNG", "JPG", "WEBP"]);
const ACTION_PLAN_DOCUMENT_FORMATS = new Set(["PDF", "DOC", "DOCX"]);

export function assertAllowedUpload(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UserFacingError("O anexo deve ter no máximo 20 MB.");
  }
  if (!detectFormat(file)) {
    throw new UserFacingError("Anexe PDF, imagem, Word ou Excel.");
  }
}

export function validateDocumentUploadMetadata(metadata: DocumentUploadMetadata): ValidatedDocumentUpload {
  if (!Number.isSafeInteger(metadata.sizeBytes) || metadata.sizeBytes <= 0) {
    throw new UserFacingError("Selecione um arquivo válido para enviar.");
  }
  if (metadata.sizeBytes > MAX_UPLOAD_BYTES) {
    throw new UserFacingError("O anexo deve ter no máximo 20 MB.");
  }
  const extensionFormat = FORMAT_BY_EXTENSION[extensionOf(metadata.fileName)];
  const mimeFormat = FORMAT_BY_MIME[metadata.contentType.toLowerCase()];
  if (!extensionFormat || !mimeFormat || extensionFormat !== mimeFormat) {
    throw new UserFacingError("Anexe PDF, imagem, Word ou Excel com formato válido.");
  }
  return {
    fileName: sanitizeFileName(metadata.fileName, extensionFormat),
    contentType: MIME_BY_FORMAT[extensionFormat],
    sizeBytes: metadata.sizeBytes,
    format: extensionFormat,
  };
}

export function buildDocumentStorageKey(companyId: string, documentId: string, fileName: string, format: string) {
  return sanitizeRelativePath([
    "documents",
    storageId(companyId),
    storageId(documentId),
    sanitizeFileName(fileName, format),
  ].join("/"));
}

export async function createDocumentUploadPost(input: DocumentUploadMetadata & { companyId: string; documentId: string }) {
  if (!isS3StorageEnabled()) throw new Error("Armazenamento S3 não configurado.");
  const validated = validateDocumentUploadMetadata(input);
  const storageKey = buildDocumentStorageKey(input.companyId, input.documentId, validated.fileName, validated.format);
  const result = await createPresignedPost(s3Client(), {
    Bucket: requireBucket(),
    Key: storageKey,
    Expires: UPLOAD_URL_TTL_SECONDS,
    Fields: {
      "Content-Type": validated.contentType,
      "x-amz-meta-ms360-document-id": input.documentId,
    },
    Conditions: [
      ["content-length-range", 1, MAX_UPLOAD_BYTES + PRESIGNED_POST_OVERHEAD_BYTES],
      ["eq", "$Content-Type", validated.contentType],
      ["eq", "$x-amz-meta-ms360-document-id", input.documentId],
    ],
  });
  return { ...result, ...validated, storageKey };
}

export async function verifyDocumentUpload(input: DocumentUploadMetadata & {
  companyId: string;
  documentId: string;
  storageKey: string;
}) {
  if (!isS3StorageEnabled()) throw new Error("Armazenamento S3 não configurado.");
  const validated = validateDocumentUploadMetadata(input);
  const expectedKey = buildDocumentStorageKey(input.companyId, input.documentId, validated.fileName, validated.format);
  const storageKey = sanitizeRelativePath(input.storageKey);
  if (storageKey !== expectedKey) {
    throw new UserFacingError("A autorização do arquivo não corresponde a este documento.");
  }

  const object = await s3Client().send(new HeadObjectCommand({ Bucket: requireBucket(), Key: storageKey }));
  if (object.ContentLength !== validated.sizeBytes || object.ContentLength > MAX_UPLOAD_BYTES) {
    throw new UserFacingError("O arquivo recebido não corresponde ao tamanho autorizado.");
  }
  if ((object.ContentType ?? "").toLowerCase() !== validated.contentType.toLowerCase()) {
    throw new UserFacingError("O arquivo recebido não corresponde ao formato autorizado.");
  }
  if (object.Metadata?.["ms360-document-id"] !== input.documentId) {
    throw new UserFacingError("Não foi possível confirmar a origem segura do arquivo.");
  }
  return {
    relativePath: storageKey,
    format: validated.format,
    size: formatFileSize(object.ContentLength),
    fileName: validated.fileName,
  };
}

export function assertAllowedImage(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UserFacingError("A foto deve ter no máximo 20 MB.");
  }
  const format = detectFormat(file);
  if (!format || !IMAGE_FORMATS.has(format)) {
    throw new UserFacingError("Anexe uma imagem JPG, PNG ou WEBP.");
  }
}

export function assertAllowedActionPlanDocument(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UserFacingError("O anexo deve ter no máximo 20 MB.");
  }
  const extensionFormat = FORMAT_BY_EXTENSION[extensionOf(file.name)];
  const mimeFormat = FORMAT_BY_MIME[file.type];
  if (!extensionFormat || !mimeFormat || extensionFormat !== mimeFormat || !ACTION_PLAN_DOCUMENT_FORMATS.has(extensionFormat)) {
    throw new UserFacingError("Anexe um arquivo PDF, DOC ou DOCX válido.");
  }
  return extensionFormat;
}

async function persistUpload(file: File, format: string, segments: string[], options: { compactImage?: boolean } = {}) {
  const safeName = sanitizeFileName(file.name, format);
  const relativePath = sanitizeRelativePath([...segments, safeName].join("/"));
  const source = Buffer.from(await file.arrayBuffer());
  const buffer = options.compactImage ? await compactImage(source, format) : source;
  if (isS3StorageEnabled()) {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: requireBucket(),
        Key: relativePath,
        Body: buffer,
        ContentType: mimeForFormat(format, safeName),
      }),
    );
  } else {
    const fullPath = resolveUploadPath(relativePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buffer);
  }
  return { relativePath, format, size: formatFileSize(buffer.length), fileName: safeName };
}

async function compactImage(input: Buffer, format: string) {
  if (!IMAGE_FORMATS.has(format)) return input;
  try {
    const image = sharp(input, { failOn: "error", limitInputPixels: 220_000_000, animated: false }).rotate();
    const metadata = await image.clone().metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    if (!width || !height) throw new UserFacingError("Não foi possível ler a foto enviada.");

    const oversized = width > PHOTO_MAX_EDGE_PX || height > PHOTO_MAX_EDGE_PX;
    const resized = oversized
      ? image.resize({ width: PHOTO_MAX_EDGE_PX, height: PHOTO_MAX_EDGE_PX, fit: "inside", withoutEnlargement: true })
      : image;
    const output = format === "PNG"
      ? await resized.clone().png({ compressionLevel: 9, effort: 7, adaptiveFiltering: true }).toBuffer()
      : format === "WEBP"
        ? await resized.clone().webp({ quality: PHOTO_WEBP_QUALITY, effort: 4, smartSubsample: false }).toBuffer()
        : await resized.clone().jpeg({ quality: PHOTO_JPEG_QUALITY, mozjpeg: true, progressive: true }).toBuffer();

    if (output.length < input.length || oversized) return output;
    return input;
  } catch (error) {
    if (error instanceof UserFacingError) throw error;
    throw new UserFacingError("Não foi possível processar a foto. Envie um JPG, PNG ou WEBP válido.");
  }
}

export async function saveDocumentUpload(file: File, companyId: string, documentId: string) {
  assertAllowedUpload(file);
  return persistUpload(file, detectFormat(file) ?? "PDF", ["documents", companyId, documentId]);
}

export async function saveMachinePhotoUpload(file: File, companyId: string, machineId: string, photoId: string) {
  assertAllowedImage(file);
  return persistUpload(file, detectFormat(file) ?? "JPG", ["photos", companyId, machineId, photoId], { compactImage: true });
}

export async function saveActivityEvidenceUpload(file: File, companyId: string, activityId: string, attachmentId: string) {
  assertAllowedUpload(file);
  const format = detectFormat(file) ?? "PDF";
  return persistUpload(file, format, ["activities", companyId, activityId, attachmentId], { compactImage: IMAGE_FORMATS.has(format) });
}

export async function saveActionPlanAttachmentUpload(file: File, companyId: string, actionPlanId: string, attachmentId: string) {
  const format = assertAllowedActionPlanDocument(file);
  return persistUpload(file, format, ["action-plans", companyId, actionPlanId, attachmentId]);
}

export function evidenceKindForFile(file: File) {
  const format = detectFormat(file);
  return format && IMAGE_FORMATS.has(format) ? "PHOTO" : "DOC";
}

export async function readStoredFile(relativePath: string) {
  const key = sanitizeRelativePath(relativePath);
  if (isS3StorageEnabled()) {
    const response = await s3Client().send(new GetObjectCommand({ Bucket: requireBucket(), Key: key }));
    if (!response.Body) throw new Error("Arquivo não encontrado.");
    return Buffer.from(await response.Body.transformToByteArray());
  }
  return readFile(resolveUploadPath(key));
}

export async function deleteStoredFile(relativePath: string, options: { strict?: boolean } = {}) {
  try {
    const key = sanitizeRelativePath(relativePath);
    if (isS3StorageEnabled()) {
      await s3Client().send(new DeleteObjectCommand({ Bucket: requireBucket(), Key: key }));
      return;
    }
    await unlink(resolveUploadPath(key));
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    const name = error && typeof error === "object" && "name" in error ? error.name : null;
    if (options.strict && code !== "ENOENT" && name !== "NoSuchKey") throw error;
  }
}

export async function createStoredFileDownloadUrl(relativePath: string, options: {
  format: string;
  disposition: "inline" | "attachment";
  fileName?: string;
}) {
  if (!isS3StorageEnabled()) return null;
  const key = sanitizeRelativePath(relativePath);
  const storedName = fileNameFromPath(key);
  const fileName = options.fileName?.trim() || storedName;
  const asciiName = fileName.replace(/[^\x20-\x7e]+/g, "_").replace(/["\\;]/g, "_");
  const contentDisposition = `${options.disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
  return getSignedUrl(
    s3Client(),
    new GetObjectCommand({
      Bucket: requireBucket(),
      Key: key,
      ResponseContentType: mimeForFormat(options.format, storedName),
      ResponseContentDisposition: contentDisposition,
    }),
    { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
  );
}

export function fileNameFromPath(relativePath: string) {
  return path.posix.basename(relativePath.replaceAll("\\", "/"));
}

export function resolveUploadPath(relativePath: string) {
  const root = uploadRoot();
  const normalized = sanitizeRelativePath(relativePath);
  const fullPath = path.resolve(root, ...normalized.split("/"));
  const relative = path.relative(root, fullPath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Caminho de arquivo inválido.");
  }
  return fullPath;
}

function sanitizeRelativePath(relativePath: string) {
  const normalized = relativePath.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((segment) => segment === "" || segment === "..")) {
    throw new Error("Caminho de arquivo inválido.");
  }
  return normalized;
}

function uploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
}

export function isS3StorageEnabled() {
  return Boolean(process.env.S3_BUCKET);
}

function requireBucket() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET não configurado.");
  return bucket;
}

let cachedS3Client: S3Client | null = null;

function s3Client() {
  if (!cachedS3Client) {
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    cachedS3Client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      // sem chaves explícitas o SDK usa a role/credential chain padrão (ex.: ECS/Amplify)
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }
  return cachedS3Client;
}

function detectFormat(file: File) {
  return FORMAT_BY_MIME[file.type] ?? FORMAT_BY_EXTENSION[extensionOf(file.name)] ?? null;
}

function extensionOf(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

function storageId(value: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error("Identificador de armazenamento inválido.");
  return value;
}

function sanitizeFileName(name: string, format: string) {
  const extension = FORMAT_BY_EXTENSION[extensionOf(name)] ? extensionOf(name) : format.toLowerCase();
  const base = path.basename(name, path.extname(name)).replace(/[^\w.\-()+]+/g, "_").replace(/_+/g, "_").slice(0, 80);
  return `${base || "arquivo"}.${extension}`;
}
