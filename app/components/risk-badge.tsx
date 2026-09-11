import type { RiskLevel } from "@prisma/client";
import { riskLabels, riskTones } from "@/lib/labels";

export function RiskBadge({ level, hrn }: { level: RiskLevel | null | undefined; hrn?: string | number | null }) {
  if (!level) return null;
  return <span className={`badge ${riskTones[level]}`}><span />{riskLabels[level]}{hrn !== undefined && hrn !== null && hrn !== "" ? ` · HRN ${hrn}` : ""}</span>;
}
