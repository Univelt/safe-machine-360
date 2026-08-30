import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

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

export function assertAllowedUpload(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("O anexo deve ter no máximo 20 MB.");
  }
  if (!detectFormat(file)) {
    throw new Error("Anexe PDF, imagem, Word ou Excel.");
  }
}

export function assertAllowedImage(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("A foto deve ter no máximo 20 MB.");
  }
  const format = detectFormat(file);
  if (!format || !IMAGE_FORMATS.has(format)) {
    throw new Error("Anexe uma imagem JPG, PNG ou WEBP.");
  }
}

async function persistUpload(file: File, format: string, segments: string[]) {
  const safeName = sanitizeFileName(file.name, format);
  const relativePath = [...segments, safeName].join("/");
  const fullPath = resolveUploadPath(relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));
  return { relativePath, format, size: formatFileSize(file.size), fileName: safeName };
}

export async function saveDocumentUpload(file: File, companyId: string, documentId: string) {
  assertAllowedUpload(file);
  return persistUpload(file, detectFormat(file) ?? "PDF", ["documents", companyId, documentId]);
}

export async function saveMachinePhotoUpload(file: File, companyId: string, machineId: string, photoId: string) {
  assertAllowedImage(file);
  return persistUpload(file, detectFormat(file) ?? "JPG", ["photos", companyId, machineId, photoId]);
}

export async function saveActivityEvidenceUpload(file: File, companyId: string, activityId: string, attachmentId: string) {
  assertAllowedUpload(file);
  return persistUpload(file, detectFormat(file) ?? "PDF", ["activities", companyId, activityId, attachmentId]);
}

export function evidenceKindForFile(file: File) {
  const format = detectFormat(file);
  return format && IMAGE_FORMATS.has(format) ? "PHOTO" : "DOC";
}

export async function readStoredFile(relativePath: string) {
  return readFile(resolveUploadPath(relativePath));
}

export async function deleteStoredFile(relativePath: string) {
  try {
    await unlink(resolveUploadPath(relativePath));
  } catch {
    // already gone
  }
}

export function fileNameFromPath(relativePath: string) {
  return path.posix.basename(relativePath.replaceAll("\\", "/"));
}

export function resolveUploadPath(relativePath: string) {
  const root = uploadRoot();
  const normalized = relativePath.replaceAll("\\", "/").replace(/^\/+/, "");
  const fullPath = path.resolve(root, ...normalized.split("/"));
  const relative = path.relative(root, fullPath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Caminho de arquivo inválido.");
  }
  return fullPath;
}

function uploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
}

function detectFormat(file: File) {
  return FORMAT_BY_MIME[file.type] ?? FORMAT_BY_EXTENSION[extensionOf(file.name)] ?? null;
}

function extensionOf(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

function sanitizeFileName(name: string, format: string) {
  const extension = FORMAT_BY_EXTENSION[extensionOf(name)] ? extensionOf(name) : format.toLowerCase();
  const base = path.basename(name, path.extname(name)).replace(/[^\w.\-()+]+/g, "_").replace(/_+/g, "_").slice(0, 80);
  return `${base || "arquivo"}.${extension}`;
}
