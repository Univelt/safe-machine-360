export type MachineSortOrder = "default" | "az" | "za";

export type MachineFilterOptions = {
  query?: string;
  company?: string;
  sector?: string;
  risk?: string;
  documentation?: string;
  sort?: MachineSortOrder;
};

type FilterableMachine = {
  name: string;
  code: string;
  tag: string;
  manufacturer: string;
  companyName: string;
  sector: string;
  risk: string;
  appreciation: string;
  checklist: string;
};

const isUnset = (value: string | undefined, defaultValue: string) => !value || value === defaultValue;

export function filterMachines<T extends FilterableMachine>(machines: T[], options: MachineFilterOptions = {}) {
  const query = options.query?.trim().toLocaleLowerCase("pt-BR") ?? "";
  const filtered = machines.filter((machine) => {
    const matchesQuery = !query || [machine.name, machine.code, machine.tag, machine.manufacturer, machine.companyName]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(query));
    const matchesCompany = isUnset(options.company, "all") || machine.companyName === options.company;
    const matchesSector = isUnset(options.sector, "Todos") || machine.sector === options.sector;
    const matchesRisk = isUnset(options.risk, "Todos") || machine.risk === options.risk;
    const matchesDocumentation = isUnset(options.documentation, "Todos")
      || (options.documentation === "Sem documento"
        ? machine.appreciation === "Sem documento" && machine.checklist === "Sem documento"
        : machine.appreciation === options.documentation || machine.checklist === options.documentation);

    return matchesQuery && matchesCompany && matchesSector && matchesRisk && matchesDocumentation;
  });

  if (options.sort === "az" || options.sort === "za") {
    const direction = options.sort === "az" ? 1 : -1;
    filtered.sort((left, right) => direction * (
      left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base", numeric: true })
      || left.code.localeCompare(right.code, "pt-BR", { sensitivity: "base", numeric: true })
    ));
  }

  return filtered;
}

export function countActiveMachineFilters(options: MachineFilterOptions = {}) {
  return [
    Boolean(options.query?.trim()),
    !isUnset(options.company, "all"),
    !isUnset(options.sector, "Todos"),
    !isUnset(options.risk, "Todos"),
    !isUnset(options.documentation, "Todos"),
    !isUnset(options.sort, "default"),
  ].filter(Boolean).length;
}
