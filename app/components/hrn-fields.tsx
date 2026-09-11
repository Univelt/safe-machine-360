"use client";

import { useState } from "react";
import type { RiskLevel } from "@prisma/client";
import { classifyHrn } from "@/lib/labels";
import { RiskBadge } from "./risk-badge";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function HrnField({ name, label, defaultValue, required }: { name: string; label: string; defaultValue?: string | number | null; required?: boolean }) {
  const [value, setValue] = useState(defaultValue == null ? "" : String(defaultValue));
  const level: RiskLevel | null = classifyHrn(value);

  return (
    <label className="hrn-field">
      <span>{label}</span>
      <div className="hrn-control">
        <input
          className="hrn-input"
          name={name}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(event) => setValue(digitsOnly(event.target.value))}
          required={required}
          aria-describedby={level ? `${name}-risk` : undefined}
        />
        {level && <span id={`${name}-risk`} aria-live="polite"><RiskBadge level={level} /></span>}
      </div>
    </label>
  );
}

export function HrnFields({ current, residual, residualRequired = false }: { current?: string | number | null; residual?: string | number | null; residualRequired?: boolean }) {
  return (
    <div className="hrn-fields">
      <HrnField name="hrnCurrent" label="HRN atual" defaultValue={current} required />
      <HrnField name="hrnResidual" label="HRN residual" defaultValue={residual} required={residualRequired} />
    </div>
  );
}
