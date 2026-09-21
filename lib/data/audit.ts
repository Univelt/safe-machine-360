import { formatDateTime } from "../labels";
import { prisma } from "../prisma";

export type LastChange = {
  at: string;
  by: string;
  summary: string;
};

function toLastChange(log: { createdAt: Date; summary: string; user: { name: string } | null } | null): LastChange | null {
  if (!log) return null;
  return {
    at: formatDateTime(log.createdAt),
    by: log.user?.name || "Portal Univelt",
    summary: log.summary,
  };
}

export async function getLastChange(entity: string | string[], entityId: string): Promise<LastChange | null> {
  const entities = Array.isArray(entity) ? entity : [entity];
  const log = await prisma.auditLog.findFirst({
    where: { entity: { in: entities }, entityId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  return toLastChange(log);
}

export async function getLastPhotoChange(machineId: string): Promise<LastChange | null> {
  const log = await prisma.auditLog.findFirst({
    where: {
      OR: [
        { parentId: machineId, entity: "MachinePhoto" },
        { entityId: machineId, action: { in: ["MACHINE_PHOTO_UPLOADED", "MACHINE_PHOTO_DELETED"] } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  return toLastChange(log);
}
