import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@univelt.com.br";
const adminPassword = process.env.ADMIN_PASSWORD ?? "Univelt@Admin2026";

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.complianceSnapshot.deleteMany();
  await prisma.actionPlanItem.deleteMany();
  await prisma.actionPlan.deleteMany();
  await prisma.checklistItemAnswer.deleteMany();
  await prisma.checklistExecution.deleteMany();
  await prisma.checklistTemplateItem.deleteMany();
  await prisma.checklistTemplate.deleteMany();
  await prisma.activityAttachment.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.machinePhoto.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.user.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.company.deleteMany();

  const passwordHash = await hash(adminPassword, 12);

  await prisma.user.create({
    data: {
      name: "Admin Univelt",
      email: adminEmail,
      passwordHash: passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      lastAccessAt: new Date(),
    },
  });

  console.log(`Banco resetado. Usuário admin disponível: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

