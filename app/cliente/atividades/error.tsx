"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ActivitiesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="panel state-message" role="alert">
      <AlertTriangle size={26} />
      <strong>Não foi possível carregar as atividades</strong>
      <p>Verifique sua conexão e tente novamente.</p>
      <button className="button secondary" type="button" onClick={reset}><RotateCcw size={16} /> Tentar novamente</button>
    </div>
  );
}
