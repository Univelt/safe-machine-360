import { Info } from "lucide-react";

export function InfoHint({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="info-hint">
      <summary aria-label={label} title={label}>
        <Info aria-hidden="true" size={15} />
      </summary>
      <span className="info-hint-popover" role="tooltip">{children}</span>
    </details>
  );
}
