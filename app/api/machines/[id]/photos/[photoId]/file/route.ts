import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { companyFilter } from "@/lib/data/scope";
import { prisma } from "@/lib/prisma";
import { fileNameFromPath, mimeForFormat, readStoredFile } from "@/lib/storage";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id, photoId } = await params;
  const photo = await prisma.machinePhoto.findFirst({
    where: { id: photoId, machineId: id, machine: companyFilter(session) },
    select: { url: true },
  });
  if (!photo?.url) {
    return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
  }

  try {
    const bytes = await readStoredFile(photo.url);
    const fileName = fileNameFromPath(photo.url);
    const download = new URL(request.url).searchParams.get("download") === "1";

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mimeForFormat("", fileName),
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
  }
}
