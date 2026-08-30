import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { Brand } from "../components/brand";
import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Acesso seguro",
  description: "Acesso restrito ao Portal Univelt Machine Safety.",
};

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-brand-panel" aria-label="Sobre o Portal Univelt">
        <div className="login-brand-inner">
          <Brand href="/login" />
          <div className="login-message">
            <span className="login-eyebrow"><ShieldCheck size={17} /> Segurança de máquinas, com visão completa</span>
            <h1>Decisões mais seguras começam com informação confiável.</h1>
            <p>Centralize máquinas, riscos, documentos e atividades em um ambiente preparado para a operação industrial.</p>
            <ul>
              <li><CheckCircle2 size={18} /> Controle documental e de validades</li>
              <li><CheckCircle2 size={18} /> Visão de risco por empresa e unidade</li>
              <li><CheckCircle2 size={18} /> Histórico e rastreabilidade operacional</li>
            </ul>
          </div>
          <div className="login-trust"><LockKeyhole size={17} /><span><strong>Acesso corporativo protegido</strong><small>Seus dados permanecem restritos à sua empresa.</small></span></div>
        </div>
      </section>
      <section className="login-form-panel">
        <div className="mobile-login-brand"><Brand href="/login" /></div>
        <LoginForm />
      </section>
    </main>
  );
}
