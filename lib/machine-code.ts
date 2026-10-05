// N/A means the equipment has no internal code. Real codes remain unique per company.
export function isUnassignedMachineCode(value: string) {
  return value.trim().toUpperCase() === "N/A";
}
