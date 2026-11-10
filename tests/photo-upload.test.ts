import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import sharp from "sharp";
import { readStoredFile, saveActivityEvidenceUpload, saveDocumentUpload, saveMachinePhotoUpload } from "../lib/storage";

const previousBucket = process.env.S3_BUCKET;
const previousUploadDir = process.env.UPLOAD_DIR;
const uploadDir = await mkdtemp(path.join(tmpdir(), "ms360-photo-upload-"));

before(() => {
  delete process.env.S3_BUCKET;
  process.env.UPLOAD_DIR = uploadDir;
});

after(async () => {
  if (previousBucket === undefined) delete process.env.S3_BUCKET;
  else process.env.S3_BUCKET = previousBucket;
  if (previousUploadDir === undefined) delete process.env.UPLOAD_DIR;
  else process.env.UPLOAD_DIR = previousUploadDir;
  await rm(uploadDir, { recursive: true, force: true });
});

test("compacta foto grande antes de gravar e mantém o enquadramento", async () => {
  const source = await detailedJpeg(4200, 1800);
  const saved = await saveMachinePhotoUpload(new File([filePart(source)], "prensa.jpg", { type: "image/jpeg" }), "empresa-1", "maquina-1", "foto-1");
  const stored = await readStoredFile(saved.relativePath);
  const metadata = await sharp(stored).metadata();

  assert.ok(stored.length < source.length);
  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.width, 3840);
  assert.equal(metadata.height, 1646);
});

test("não amplia foto pequena nem troca o formato", async () => {
  const source = await sharp({ create: { width: 640, height: 480, channels: 3, background: "#245c8a" } }).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  const saved = await saveMachinePhotoUpload(new File([filePart(source)], "detalhe.jpg", { type: "image/jpeg" }), "empresa-1", "maquina-1", "foto-2");
  const stored = await readStoredFile(saved.relativePath);
  const metadata = await sharp(stored).metadata();

  assert.ok(stored.length <= source.length);
  assert.equal(metadata.width, 640);
  assert.equal(metadata.height, 480);
  assert.equal(metadata.format, "jpeg");
});

test("compacta PNG de forma lossless e preserva as dimensões", async () => {
  const width = 900;
  const height = 600;
  const raw = Buffer.alloc(width * height * 3);
  for (let offset = 0; offset < raw.length; offset += 3) {
    const pixel = offset / 3;
    raw[offset] = pixel % 251;
    raw[offset + 1] = (pixel * 3) % 251;
    raw[offset + 2] = (pixel * 7) % 251;
  }
  const source = await sharp(raw, { raw: { width, height, channels: 3 } }).png({ compressionLevel: 0 }).toBuffer();
  const saved = await saveMachinePhotoUpload(new File([filePart(source)], "painel.png", { type: "image/png" }), "empresa-1", "maquina-1", "foto-3");
  const stored = await readStoredFile(saved.relativePath);
  const metadata = await sharp(stored).metadata();

  assert.ok(stored.length < source.length);
  assert.equal(stored.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(metadata.width, width);
  assert.equal(metadata.height, height);
  assert.deepEqual(await sharp(stored).raw().toBuffer(), await sharp(source).raw().toBuffer());
});

test("compacta foto enviada como evidência e mantém documento imagem intacto", async () => {
  const photo = await detailedJpeg(4000, 1200);
  const evidence = await saveActivityEvidenceUpload(new File([filePart(photo)], "evidencia.jpg", { type: "image/jpeg" }), "empresa-1", "atividade-1", "anexo-1");
  const storedPhoto = await readStoredFile(evidence.relativePath);
  assert.ok(storedPhoto.length < photo.length);
  assert.equal((await sharp(storedPhoto).metadata()).width, 3840);

  const document = await sharp({ create: { width: 80, height: 40, channels: 3, background: "#101820" } }).jpeg().toBuffer();
  const savedDocument = await saveDocumentUpload(new File([filePart(document)], "laudo.jpg", { type: "image/jpeg" }), "empresa-1", "documento-1");
  assert.deepEqual(await readStoredFile(savedDocument.relativePath), document);
});

test("mantém foto WEBP legível e nas dimensões originais", async () => {
  const source = await sharp({ create: { width: 400, height: 300, channels: 3, background: "#55aa77" } }).webp({ quality: 100 }).toBuffer();
  const saved = await saveMachinePhotoUpload(new File([filePart(source)], "selo.webp", { type: "image/webp" }), "empresa-1", "maquina-1", "foto-5");
  const metadata = await sharp(await readStoredFile(saved.relativePath)).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 400);
  assert.equal(metadata.height, 300);
});

test("rejeita arquivo que não é uma imagem válida", async () => {
  await assert.rejects(
    () => saveMachinePhotoUpload(new File([filePart(Buffer.from("nao-e-imagem"))], "foto.jpg", { type: "image/jpeg" }), "empresa-1", "maquina-1", "foto-4"),
    /Não foi possível processar a foto/,
  );
});

async function detailedJpeg(width: number, height: number) {
  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    const row = y * width * 3;
    for (let x = 0; x < width; x += 1) {
      const offset = row + x * 3;
      raw[offset] = (x * 13 + y) & 255;
      raw[offset + 1] = (y * 7) & 255;
      raw[offset + 2] = ((x ^ y) * 3) & 255;
    }
  }
  return sharp(raw, { raw: { width, height, channels: 3 } }).jpeg({ quality: 97 }).toBuffer();
}

function filePart(data: Uint8Array<ArrayBufferLike>): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return copy;
}
