"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ChecklistDashboardError({ reset }: { reset: () => void }) {
  return <div className="dashboard"><div className="state-message error"><AlertTriangle size={28} /><strong>Não foi possível carregar o dashboard</strong><p>Tente novamente. Nenhum registro foi alterado.</p><button className="button secondary" type="button" onClick={reset}><RotateCcw size={16} /> Tentar novamente</button></div></div>;
}
