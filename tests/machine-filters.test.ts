import assert from "node:assert/strict";
import test from "node:test";
import { countActiveMachineFilters, filterMachines } from "../lib/machine-filters";

const machines = [
  { id: "1", name: "Prensa 10", code: "P-10", tag: "T10", manufacturer: "Fábrica A", companyName: "Alfa", sector: "Estamparia", risk: "Alto", appreciation: "A vencer", checklist: "Em dia" },
  { id: "2", name: "Prensa 2", code: "P-2", tag: "T2", manufacturer: "Fábrica B", companyName: "Beta", sector: "Estamparia", risk: "Baixo", appreciation: "Sem documento", checklist: "Sem documento" },
  { id: "3", name: "Esteira", code: "E-1", tag: "T1", manufacturer: "Fábrica A", companyName: "Alfa", sector: "Montagem", risk: "Médio", appreciation: "Em dia", checklist: "Sem documento" },
];

test("combines company, sector, risk, documentation, and search filters", () => {
  const result = filterMachines(machines, {
    query: "alfa",
    company: "Alfa",
    sector: "Estamparia",
    risk: "Alto",
    documentation: "A vencer",
  });

  assert.deepEqual(result.map((machine) => machine.id), ["1"]);
});

test("matches no-document only when both displayed document records are missing", () => {
  const result = filterMachines(machines, { documentation: "Sem documento" });
  assert.deepEqual(result.map((machine) => machine.id), ["2"]);
});

test("sorts equipment names alphabetically with natural numeric order", () => {
  assert.deepEqual(filterMachines(machines, { sort: "az" }).map((machine) => machine.id), ["3", "2", "1"]);
  assert.deepEqual(filterMachines(machines, { sort: "za" }).map((machine) => machine.id), ["1", "2", "3"]);
});

test("counts non-default filters so users can clear every active control", () => {
  assert.equal(countActiveMachineFilters({ company: "all", risk: "Todos", sort: "default" }), 0);
  assert.equal(countActiveMachineFilters({ company: "Alfa", risk: "Alto", sort: "za" }), 3);
});
