"use client";

import { useState } from "react";
import type { RiskLevel } from "@prisma/client";
import { classifyHrn } from "@/lib/labels";
import { riskLevelOptions } from "@/lib/labels";
import { RiskBadge } from "./risk-badge";

function decimalOnly(value: string) {
  const normalized = value.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const [integer = "", ...decimals] = normalized.split(",");
  if (!decimals.length) return integer;
  return `${integer || "0"},${decimals.join("")}`;
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
          inputMode="decimal"
          pattern="[0-9]+([,.][0-9]+)?"
          placeholder="Ex.: 12,5"
          value={value}
          onChange={(event) => setValue(decimalOnly(event.target.value))}
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
      <input type="hidden" name="riskOrigin" value={manual ? "MANUAL" : "AUTOMATIC"} />
      <div className={`hrn-fields ${manual ? "is-disabled" : ""}`}>
        <HrnField name="hrnCurrent" label="HRN atual" defaultValue={current} required={!manual} disabled={manual} />
        <HrnField name="hrnResidual" label="HRN residual" defaultValue={residual} required={!manual && residualRequired} disabled={manual} />
        <div className="risk-classification-field">
          <span className="field-label">Classificação de risco</span>
          <label className="risk-mode-toggle">
            <input type="checkbox" checked={manual} onChange={(event) => setManual(event.target.checked)} />
            <span><strong>Definir manualmente</strong><small>Use apenas quando o HRN não representar o risco.</small></span>
          </label>
          {manual ? (
            <label className="manual-risk-field">
              <span className="sr-only">Nível de risco manual</span>
              <select name="manualRiskLevel" required value={selectedRisk} onChange={(event) => setSelectedRisk(event.target.value as RiskLevel)}>
                <option value="">Selecione a classificação</option>
                {riskLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ) : (
            <input type="hidden" name="manualRiskLevel" value={selectedRisk} />
          )}
        </div>
      </div>
    </div>
  );
}
