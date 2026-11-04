import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDate, formatDateTime } from "../lib/labels";

test("data de calendário permanece no dia gravado, independente do fuso do processo", () => {
  const takenAt = "2026-11-04T00:00:00.000Z";
  assert.equal(formatDate(takenAt), "04/11/2026");
  assert.equal(formatDate(null), "—");
  assert.equal(formatDate("invalid"), "—");
});

test("data e hora usam o horário de São Paulo no servidor e no navegador", () => {
  assert.equal(formatDateTime("2026-11-04T15:30:00.000Z"), "04/11/2026, 12:30");
  assert.equal(formatDate("2026-11-04T02:30:00.000Z", "America/Sao_Paulo"), "03/11/2026");
});
