"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { ErrorNotice } from "./error-notice";

export function ErrorPanel({ error, reset, title = "Não foi possível abrir esta tela" }: { error: Error & { digest?: string }; reset: () => void; title?: string }) {
  return <main className="friendly-error-page">
    <div className="panel friendly-error-panel">
      <span className="eyebrow">Machine Safety 360</span>
      <h1>{title}</h1>
      <ErrorNotice error={{ code: "FALHA_CARREGAMENTO", title: "Precisamos verificar uma falha no sistema", message: "O sistema encontrou um problema ao carregar as informações desta tela.", nextStep: "Tente abrir a tela novamente. Se o erro continuar, copie a referência e envie ao suporte com o que você estava fazendo.", reference: error.digest ? `MS360-PAGE-${error.digest}` : undefined }} />
      <div className="friendly-error-actions"><button className="button primary" type="button" onClick={reset}><RotateCcw size={16} />Tentar novamente</button><Link className="button secondary" href="/">Voltar ao portal</Link></div>
    </div>
  </main>;
}
