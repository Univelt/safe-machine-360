import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { companyFilter } from "@/lib/data/scope";
import { prisma } from "@/lib/prisma";
import { fileNameFromPath, mimeForFormat, readStoredFile } from "@/lib/storage";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: { id, ...companyFilter(session) },
    select: { fileUrl: true, format: true, name: true },
  });
  if (!document?.fileUrl) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  try {
    const bytes = await readStoredFile(document.fileUrl);
    const fileName = fileNameFromPath(document.fileUrl);
    const download = new URL(request.url).searchParams.get("download") === "1";
    const disposition = download ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mimeForFormat(document.format, fileName),
        "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }
}
