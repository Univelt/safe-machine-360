import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { canDeleteDocuments, deleteDocumentRecord, type DeletionTransaction, type DocumentDeletionDatabase } from "../lib/document-deletion";
import { describeError } from "../lib/friendly-errors";

test("exclusão de documentos protege empresas, mantém outros registros e exige auditoria atômica", async () => {
  const db = new PGlite();
  let failAudit = false;
  // Exercise the same service with a PostgreSQL transaction, without a production connection.
  const database: DocumentDeletionDatabase = {
    $transaction: action => db.transaction(async sql => action({
      document: {
        findFirst: async ({ where }: { where: { id: string; companyId?: string } }) => {
          const result = await sql.query(`SELECT id,name,"companyId","machineId","fileUrl" FROM "Document" WHERE id=$1${where.companyId ? ' AND "companyId"=$2' : ''}`, where.companyId ? [where.id, where.companyId] : [where.id]);
          return result.rows[0] ?? null;
        },
        delete: async ({ where }: { where: { id: string; companyId: string } }) => {
          const result = await sql.query(`DELETE FROM "Document" WHERE id=$1 AND "companyId"=$2 RETURNING *`, [where.id, where.companyId]);
          assert.equal(result.rows.length, 1);
          return result.rows[0];
        },
      },
      auditLog: {
        create: async ({ data }: { data: { companyId: string; userId: string; action: string; operation: string; entity: string; entityId: string; parentId: string; summary: string } }) => {
          if (failAudit) throw new Error("Auditoria indisponível");
          await sql.query(`INSERT INTO "AuditLog" (id,"companyId","userId",action,operation,entity,"entityId","parentId",summary) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [`audit-${data.entityId}`, data.companyId, data.userId, data.action, data.operation, data.entity, data.entityId, data.parentId, data.summary]);
          return data;
        },
      },
    } as unknown as DeletionTransaction)),
  };
  const admin = { id: "user-a", role: "CLIENT_ADMIN" as const, companyId: "a" };
  try {
    const migrations = join(process.cwd(), "prisma/migrations");
    for (const entry of (await readdir(migrations, { withFileTypes: true })).filter(item => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      await db.exec(await readFile(join(migrations, entry.name, "migration.sql"), "utf8"));
    }
    await db.exec(`
      INSERT INTO "Company" (id,name,"legalName",cnpj,city,manager,"updatedAt") VALUES ('a','Empresa A','Empresa A','a','SP','Equipe',NOW()),('b','Empresa B','Empresa B','b','SP','Equipe',NOW());
      INSERT INTO "Unit" (id,"companyId",name,city) VALUES ('ua','a','Matriz','SP'),('ub','b','Matriz','SP');
      INSERT INTO "User" (id,name,email,"passwordHash",role,"companyId","updatedAt") VALUES ('user-a','Admin','a@example.test','unused','CLIENT_ADMIN','a',NOW());
      INSERT INTO "Machine" (id,"companyId","unitId",code,name,tag,serial,manufacturer,model,year,sector,area,"hrnCurrent","riskLevel","energySources",description,"updatedAt") VALUES
        ('ma','a','ua','A','Máquina A','TAG','Série','Fab','Modelo','2020','Setor','Área','1','BAIXO','Elétrica','Máquina preservada',NOW()),
        ('mb','b','ub','B','Máquina B','TAG','Série','Fab','Modelo','2020','Setor','Área','1','BAIXO','Elétrica','Máquina preservada',NOW());
      INSERT INTO "Document" (id,"companyId","machineId",name,type,version,"issueDate",responsible,description,"fileUrl","updatedAt") VALUES
        ('da','a','ma','Laudo A','LAUDO','1',NOW(),'Equipe','Documento A','documents/a/da/laudo.pdf',NOW()),
        ('da2','a','ma','Outro A','MANUAL','1',NOW(),'Equipe','Documento mantido',NULL,NOW()),
        ('db','b','mb','Laudo B','LAUDO','1',NOW(),'Equipe','Documento B',NULL,NOW());
    `);

    for (const role of ["CLIENT_MANAGER", "VIEWER"] as const) {
      assert.equal(canDeleteDocuments({ role }), false);
      await assert.rejects(deleteDocumentRecord(database, { ...admin, role }, "da"), error => describeError(error).code === "ACESSO_RESTRITO");
    }
    await assert.rejects(deleteDocumentRecord(database, admin, "db"), error => describeError(error).code === "REGISTRO_NAO_ENCONTRADO");
    await assert.rejects(deleteDocumentRecord(database, { ...admin, companyId: null }, "da"), /sem acesso/);
    await assert.rejects(deleteDocumentRecord(database, { ...admin, role: "SUPER_ADMIN" }, "db"), /sem acesso/);
    await assert.rejects(deleteDocumentRecord(database, admin, ""), /Selecione/);

    failAudit = true;
    await assert.rejects(deleteDocumentRecord(database, admin, "da"), /Auditoria indisponível/);
    assert.equal((await db.query(`SELECT id FROM "Document" WHERE id='da'`)).rows.length, 1);
    assert.equal((await db.query(`SELECT id FROM "AuditLog"`)).rows.length, 0);
    failAudit = false;

    const deleted = await deleteDocumentRecord(database, admin, "da");
    assert.equal(deleted.fileUrl, "documents/a/da/laudo.pdf");
    assert.deepEqual((await db.query(`SELECT id FROM "Document" ORDER BY id`)).rows, [{ id: "da2" }, { id: "db" }]);
    assert.equal((await db.query(`SELECT id FROM "Machine"`)).rows.length, 2);
    const audit = await db.query(`SELECT "companyId","userId",action,operation,entity,"entityId","parentId" FROM "AuditLog"`);
    assert.deepEqual(audit.rows[0], { companyId: "a", userId: "user-a", action: "DOCUMENT_DELETED", operation: "DELETE", entity: "Document", entityId: "da", parentId: "ma" });
    await assert.rejects(deleteDocumentRecord(database, admin, "da"), /não encontrado/);
    assert.equal((await db.query(`SELECT id FROM "AuditLog"`)).rows.length, 1);

    assert.equal((await deleteDocumentRecord(database, admin, "da2")).fileUrl, null);
    assert.equal(canDeleteDocuments({ role: "SUPER_ADMIN" }), true);
    assert.equal((await deleteDocumentRecord(database, { ...admin, role: "SUPER_ADMIN", companyId: null }, "db")).companyId, "b");
  } finally { await db.close(); }
});
