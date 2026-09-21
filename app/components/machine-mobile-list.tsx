import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { MachineView } from "@/lib/data/types";
import { documentTone } from "@/lib/labels";
import { MachineThumbnail } from "./machine-thumbnail";
import { RiskBadge } from "./risk-badge";

export function MachineMobileList({ machines }: { machines: MachineView[] }) {
  return (
    <div className="machine-mobile-list">
      {machines.map((machine) => (
        <Link className="machine-mobile-card" key={machine.id} href={`/cliente/maquinas/${machine.id}`} aria-label={`Abrir ${machine.name}, código ${machine.code}`}>
          <header>
            <MachineThumbnail photos={machine.photos} />
            <span><strong>{machine.name}</strong><small>{machine.code} · TAG {machine.tag || "não informada"}</small></span>
            <ChevronRight size={19} aria-hidden="true" />
          </header>
          <dl>
            <div><dt>Empresa</dt><dd>{machine.companyName}</dd></div>
            <div><dt>Setor</dt><dd>{machine.sector}</dd></div>
          </dl>
          <div className="machine-mobile-statuses">
            <RiskBadge level={machine.riskLevel} hrn={machine.hrn} />
            <span className={`operation-status ${machine.status === "Operacional" ? "online" : machine.status === "Interditada" ? "blocked" : "maintenance"}`}><span />{machine.status}</span>
          </div>
          <div className="machine-mobile-docs">
            <span className={`doc-pill ${documentTone(machine.appreciation)}`}>APR: {machine.appreciation}</span>
            <span className={`doc-pill ${documentTone(machine.checklist)}`}>Checklist: {machine.checklist}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
