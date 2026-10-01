import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { describeError, isActionFailure, UserFacingError } from "../lib/friendly-errors";
import { runSafeAction } from "../lib/action-errors";

test("descreve código duplicado da máquina e e-mail sem expor o erro do banco", () => {
  const duplicate = describeError({ code: "P2002", meta: { target: ["companyId", "code"] }, message: "SQL INSERT confidential" });
  assert.equal(duplicate.code, "CODIGO_MAQUINA_DUPLICADO");
  assert.match(duplicate.message, /Outra máquina desta empresa/);
  assert.doesNotMatch(JSON.stringify(duplicate), /SQL|confidential/);
  assert.match(describeError({ code: "P2002", meta: { target: ["email"] } }).message, /usuário com esse e-mail/);
});

test("explica validações, acesso, registros removidos e indisponibilidade", () => {
  assert.equal(describeError(new UserFacingError("Informe um HRN atual válido.")).message, "Informe um HRN atual válido.");
  assert.equal(describeError(new UserFacingError("Sem permissão para editar máquinas.")).code, "ACESSO_RESTRITO");
  assert.equal(describeError({ code: "P2025" }).code, "REGISTRO_NAO_ENCONTRADO");
  assert.equal(describeError({ code: "P1001" }).code, "SERVICO_INDISPONIVEL");
  assert.equal(describeError(new TypeError("Failed to fetch")).code, "FALHA_CONEXAO");
});

test("falhas desconhecidas ocultam mensagens, caminhos e credenciais", () => {
  const description = describeError(new Error("postgres://admin:secret@internal-host/private/database"));
  assert.equal(description.code, "FALHA_INESPERADA");
  assert.doesNotMatch(JSON.stringify(description), /secret|internal-host|postgres|database/);
});

test("ações retornam erro amigável com a mesma referência registrada no servidor", async () => {
  const logger = mock.method(console, "error", () => undefined);
  try {
    const result = await runSafeAction("machine.update", async () => { throw new UserFacingError("Informe o nome da foto."); });
    assert.ok(isActionFailure(result));
    assert.match(result.error.reference!, /^MS360-[0-9a-f-]{36}$/);
    const logged = logger.mock.calls[0].arguments[1] as { reference: string; operation: string };
    assert.equal(logged.reference, result.error.reference);
    assert.equal(logged.operation, "machine.update");
    assert.equal(await runSafeAction("example", async () => 42), 42);
  } finally { logger.mock.restore(); }
});

test("tratamento de erro preserva redirecionamentos de login e de sucesso", async () => {
  const redirect = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/login;307;" });
  await assert.rejects(runSafeAction("machine.create", async () => { throw redirect; }), (error) => error === redirect);
});
