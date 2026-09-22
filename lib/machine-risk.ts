import type { RiskLevel, RiskOrigin } from "@prisma/client";
import { classifyHrnPair, riskLabels } from "@/lib/labels";

export function resolveMachineRisk({ origin, manualRiskLevel, hrnCurrent, hrnResidual }: { origin: RiskOrigin; manualRiskLevel: RiskLevel | null; hrnCurrent: string; hrnResidual: string | null }) {
  const validManualLevel = manualRiskLevel && manualRiskLevel in riskLabels ? manualRiskLevel : null;
  if (origin === "MANUAL") {
    if (!validManualLevel) throw new Error("Selecione o nível de risco manual.");
    return { riskLevel: validManualLevel, riskOrigin: origin, manualRiskLevel: validManualLevel };
  }
  const riskLevel = classifyHrnPair(hrnCurrent, hrnResidual);
  if (!riskLevel) throw new Error("Informe um HRN atual válido.");
  return { riskLevel, riskOrigin: origin, manualRiskLevel: validManualLevel };
}
