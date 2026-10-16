import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { S3Client } from "@aws-sdk/client-s3";
import { signDocumentUploadToken, verifyDocumentUploadToken, type DocumentUploadClaims } from "../lib/document-upload";
import { buildDocumentStorageKey, createDocumentUploadPost, createStoredFileDownloadUrl, deleteStoredFile, MAX_UPLOAD_BYTES, readStoredFile, saveDocumentUpload, validateDocumentUploadMetadata } from "../lib/storage";

const previousSecret = process.env.AUTH_SECRET;
process.env.AUTH_SECRET = "document-upload-test-secret-with-enough-entropy";

after(() => {
  if (previousSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = previousSecret;
});

test("valida metadados e monta chave isolada por empresa e documento", () => {
  const upload = validateDocumentUploadMetadata({
    fileName: "Laudo final 2026.pdf",
    contentType: "application/pdf",
    sizeBytes: 1024,
  });
  assert.deepEqual(upload, {
    fileName: "Laudo_final_2026.pdf",
    contentType: "application/pdf",
    sizeBytes: 1024,
    format: "PDF",
  });
  assert.equal(
    buildDocumentStorageKey("empresa-1", "documento-1", upload.fileName, upload.format),
    "documents/empresa-1/documento-1/Laudo_final_2026.pdf",
  );
  assert.throws(() => buildDocumentStorageKey("../empresa", "documento-1", upload.fileName, upload.format), /Identificador/);
});

test("rejeita tamanho excessivo e divergência entre extensão e MIME", () => {
  assert.throws(
    () => validateDocumentUploadMetadata({ fileName: "laudo.pdf", contentType: "application/pdf", sizeBytes: MAX_UPLOAD_BYTES + 1 }),
    /20 MB/,
  );
  assert.throws(
    () => validateDocumentUploadMetadata({ fileName: "laudo.pdf", contentType: "image/png", sizeBytes: 1024 }),
    /formato válido/,
  );
});

test("token vincula upload a usuário, empresa, máquina e chave", async () => {
  const claims: DocumentUploadClaims = {
    documentId: "documento-1",
    companyId: "empresa-1",
    machineId: "maquina-1",
    userId: "usuario-1",
    storageKey: "documents/empresa-1/documento-1/laudo.pdf",
    fileName: "laudo.pdf",
    contentType: "application/pdf",
    format: "PDF",
    sizeBytes: 2048,
  };
  const token = await signDocumentUploadToken(claims);
  assert.deepEqual(await verifyDocumentUploadToken(token), claims);

  const parts = token.split(".");
  parts[2] = `${parts[2][0] === "a" ? "b" : "a"}${parts[2].slice(1)}`;
  await assert.rejects(() => verifyDocumentUploadToken(parts.join(".")), /expirou ou é inválida/);
});

test("mantém o fallback de armazenamento local quando não há bucket", async () => {
  const previousBucket = process.env.S3_BUCKET;
  const previousUploadDir = process.env.UPLOAD_DIR;
  const uploadDir = await mkdtemp(path.join(tmpdir(), "ms360-document-upload-"));
  delete process.env.S3_BUCKET;
  process.env.UPLOAD_DIR = uploadDir;
  try {
    const content = "%PDF-1.7 fallback local";
    const saved = await saveDocumentUpload(new File([content], "laudo.pdf", { type: "application/pdf" }), "empresa-1", "documento-1");
    assert.equal(saved.relativePath, "documents/empresa-1/documento-1/laudo.pdf");
    assert.equal((await readStoredFile(saved.relativePath)).toString(), content);
    await deleteStoredFile(saved.relativePath);
    await assert.rejects(() => readStoredFile(saved.relativePath));
  } finally {
    if (previousBucket === undefined) delete process.env.S3_BUCKET;
    else process.env.S3_BUCKET = previousBucket;
    if (previousUploadDir === undefined) delete process.env.UPLOAD_DIR;
    else process.env.UPLOAD_DIR = previousUploadDir;
    await rm(uploadDir, { recursive: true, force: true });
  }
});

test("exclusão estrita sinaliza falha no S3 sem ocultar a necessidade de limpeza", async context => {
  const previousBucket = process.env.S3_BUCKET;
  const previousKey = process.env.S3_ACCESS_KEY_ID;
  const previousSecret = process.env.S3_SECRET_ACCESS_KEY;
  process.env.S3_BUCKET = "bucket-de-teste";
  process.env.S3_ACCESS_KEY_ID = "AKIATESTE";
  process.env.S3_SECRET_ACCESS_KEY = "segredo-de-teste";
  const denied = Object.assign(new Error("Denied"), { name: "AccessDenied" });
  const send = context.mock.method(S3Client.prototype, "send", async () => { throw denied; });
  try {
    await assert.rejects(deleteStoredFile("documents/empresa-1/doc-1/laudo.pdf", { strict: true }), error => error === denied);
    await deleteStoredFile("documents/empresa-1/doc-1/laudo.pdf");
    assert.equal(send.mock.callCount(), 2);
  } finally {
    if (previousBucket === undefined) delete process.env.S3_BUCKET;
    else process.env.S3_BUCKET = previousBucket;
    if (previousKey === undefined) delete process.env.S3_ACCESS_KEY_ID;
    else process.env.S3_ACCESS_KEY_ID = previousKey;
    if (previousSecret === undefined) delete process.env.S3_SECRET_ACCESS_KEY;
    else process.env.S3_SECRET_ACCESS_KEY = previousSecret;
    send.mock.restore();
  }
});

test("gera POST temporário com chave, MIME e marcador protegidos pela política", async () => {
  process.env.S3_BUCKET = "bucket-de-teste";
  process.env.S3_REGION = "us-east-1";
  process.env.S3_ACCESS_KEY_ID = "AKIATESTE";
  process.env.S3_SECRET_ACCESS_KEY = "segredo-de-teste";
  try {
    const upload = await createDocumentUploadPost({
      companyId: "empresa-1",
      documentId: "documento-1",
      fileName: "laudo.pdf",
      contentType: "application/pdf",
      sizeBytes: 2048,
    });
    assert.equal(upload.storageKey, "documents/empresa-1/documento-1/laudo.pdf");
    assert.equal(upload.fields.key, upload.storageKey);
    assert.equal(upload.fields["Content-Type"], "application/pdf");
    assert.equal(upload.fields["x-amz-meta-ms360-document-id"], "documento-1");
    const policy = JSON.parse(Buffer.from(upload.fields.Policy, "base64").toString()) as { conditions: unknown[] };
    assert.ok(policy.conditions.some((condition) => Array.isArray(condition) && condition[0] === "content-length-range"));
    const downloadUrl = await createStoredFileDownloadUrl(upload.storageKey, { format: "PDF", disposition: "attachment" });
    assert.ok(downloadUrl);
    const download = new URL(downloadUrl);
    assert.equal(download.searchParams.get("response-content-type"), "application/pdf");
    assert.match(download.searchParams.get("response-content-disposition") ?? "", /^attachment;/);
  } finally {
    delete process.env.S3_BUCKET;
    delete process.env.S3_REGION;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
  }
});
