import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { companyFilter } from "@/lib/data/scope";
import { prisma } from "@/lib/prisma";
import { fileNameFromPath, mimeForFormat, readStoredFile } from "@/lib/storage";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id, attachmentId } = await params;
  const attachment = await prisma.actionPlanAttachment.findFirst({ where: { id: attachmentId, actionPlanId: id, actionPlan: companyFilter(session) }, select: { fileUrl: true, format: true, name: true } });
  if (!attachment?.fileUrl) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  try {
    const bytes = await readStoredFile(attachment.fileUrl);
    const fileName = fileNameFromPath(attachment.fileUrl);
    const download = new URL(request.url).searchParams.get("download") === "1";
    return new NextResponse(new Uint8Array(bytes), { headers: { "Content-Type": mimeForFormat(attachment.format, fileName), "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(attachment.name)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }
}
