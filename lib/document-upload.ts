import { jwtVerify, SignJWT } from "jose";
import { UserFacingError } from "@/lib/friendly-errors";

const TOKEN_ISSUER = "machine-safety-360";
const TOKEN_AUDIENCE = "document-upload";
const TOKEN_TTL = "10m";

export type DocumentUploadClaims = {
  documentId: string;
  companyId: string;
  machineId: string;
  userId: string;
  storageKey: string;
  fileName: string;
  contentType: string;
  format: string;
  sizeBytes: number;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado.");
  return new TextEncoder().encode(secret);
}

export async function signDocumentUploadToken(claims: DocumentUploadClaims) {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setSubject(claims.userId)
    .setJti(claims.documentId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey());
}

export async function verifyDocumentUploadToken(token: string): Promise<DocumentUploadClaims> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      algorithms: ["HS256"],
    });
    const claims = {
      documentId: stringClaim(payload.documentId),
      companyId: stringClaim(payload.companyId),
      machineId: stringClaim(payload.machineId),
      userId: stringClaim(payload.userId),
      storageKey: stringClaim(payload.storageKey),
      fileName: stringClaim(payload.fileName),
      contentType: stringClaim(payload.contentType),
      format: stringClaim(payload.format),
      sizeBytes: numberClaim(payload.sizeBytes),
    };
    if (payload.sub !== claims.userId || payload.jti !== claims.documentId) throw new Error("Upload token mismatch.");
    return claims;
  } catch {
    throw new UserFacingError("A autorização para enviar o arquivo expirou ou é inválida. Selecione o arquivo e tente novamente.");
  }
}

function stringClaim(value: unknown) {
  if (typeof value !== "string" || !value) throw new Error("Invalid upload claim.");
  return value;
}

function numberClaim(value: unknown) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) throw new Error("Invalid upload claim.");
  return value;
}
