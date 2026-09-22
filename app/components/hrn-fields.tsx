"use client";

import { useState } from "react";
import type { RiskLevel } from "@prisma/client";
import { classifyHrn } from "@/lib/labels";
import { riskLevelOptions } from "@/lib/labels";
import { RiskBadge } from "./risk-badge";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function HrnField({ name, label, defaultValue, required, disabled = false }: { name: string; label: string; defaultValue?: string | number | null; required?: boolean; disabled?: boolean }) {
  const [value, setValue] = useState(defaultValue == null ? "" : String(defaultValue));
  const level: RiskLevel | null = classifyHrn(value);

  return (
    <label className="hrn-field">
      <span>{label}</span>
      <div className="hrn-control">
        {disabled && <input type="hidden" name={name} value={value} />}
        <input
          className="hrn-input"
          name={name}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(event) => setValue(digitsOnly(event.target.value))}
          required={required}
          disabled={disabled}
          aria-describedby={level ? `${name}-risk` : undefined}
        />
        {level && <span id={`${name}-risk`} aria-live="polite"><RiskBadge level={level} /></span>}
      </div>
    </label>
  );
}

export function HrnFields({
  current,
  residual,
  residualRequired = false,
  riskOrigin = "AUTOMATIC",
  manualRiskLevel,
}: {
  current?: string | number | null;
  residual?: string | number | null;
  residualRequired?: boolean;
  riskOrigin?: "AUTOMATIC" | "MANUAL";
  manualRiskLevel?: RiskLevel | null;
}) {
  const [manual, setManual] = useState(riskOrigin === "MANUAL");
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | "">(manualRiskLevel ?? "");
  return (
    <div className="hrn-risk-fields full">
      <label className="risk-mode-toggle">
        <input type="checkbox" checked={manual} onChange={(event) => setManual(event.target.checked)} />
        <span><strong>Definir nível de risco manualmente</strong><small>Use apenas quando o HRN não representar a classificação aplicável.</small></span>
      </label>
      <input type="hidden" name="riskOrigin" value={manual ? "MANUAL" : "AUTOMATIC"} />
      <div className={`hrn-fields ${manual ? "is-disabled" : ""}`} aria-disabled={manual}>
        <HrnField name="hrnCurrent" label="HRN atual" defaultValue={current} required={!manual} disabled={manual} />
        <HrnField name="hrnResidual" label="HRN residual" defaultValue={residual} required={!manual && residualRequired} disabled={manual} />
      </div>
      {manual ? (
        <label className="manual-risk-field">
          Nível de risco manual
          <select name="manualRiskLevel" required value={selectedRisk} onChange={(event) => setSelectedRisk(event.target.value as RiskLevel)}>
            <option value="">Selecione a classificação</option>
            {riskLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <small>O HRN fica preservado, mas não participa da classificação enquanto o modo manual estiver ativo.</small>
        </label>
      ) : (
        <input type="hidden" name="manualRiskLevel" value={selectedRisk} />
      )}
    </div>
  );
}
