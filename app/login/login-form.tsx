"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
  remember: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  async function handleLogin(values: LoginValues) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json().catch(() => null) as { error?: string; redirectTo?: string } | null;
    if (!response.ok) {
      setError("root", { type: "credentials", message: payload?.error ?? "Não foi possível entrar." });
      return;
    }
    window.location.assign(payload?.redirectTo ?? "/cliente");
  }

  return (
    <div className="login-form-wrap">
      <div className="login-form-heading">
        <span className="eyebrow">Portal do cliente</span>
        <h2>Bem-vindo de volta</h2>
        <p>Entre com suas credenciais corporativas. O acesso é limitado à empresa vinculada, salvo administradores Univelt.</p>
      </div>

      <form onSubmit={handleSubmit(handleLogin)} noValidate>
        <div className="field-group">
          <label htmlFor="email">E-mail corporativo</label>
          <div className={`input-wrap ${errors.email ? "invalid" : ""}`}>
            <Mail size={18} />
            <input id="email" type="email" autoComplete="email" placeholder="nome@empresa.com.br" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} {...register("email")} />
          </div>
          {errors.email && <span className="field-error" id="email-error">{errors.email.message}</span>}
        </div>

        <div className="field-group">
          <div className="field-label-row">
            <label htmlFor="password">Senha</label>
            <button type="button" className="link-button">Esqueci minha senha</button>
          </div>
          <div className={`input-wrap ${errors.password ? "invalid" : ""}`}>
            <LockKeyhole size={18} />
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Digite sua senha" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : undefined} {...register("password")} />
            <button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          {errors.password && <span className="field-error" id="password-error">{errors.password.message}</span>}
        </div>

        <label className="checkbox-row">
          <input type="checkbox" {...register("remember")} />
          <span>Lembrar meu acesso neste dispositivo</span>
        </label>

        {errors.root && <div className="login-error" role="alert">{errors.root.message}</div>}

        <button className="button primary login-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <><LoaderCircle className="spin" size={18} /> Validando acesso...</> : "Entrar no portal"}
        </button>
      </form>

      <p className="login-help">Problemas para acessar? <Link href="mailto:suporte@univelt.com.br">Fale com o suporte</Link></p>
      <div className="login-security"><KeyRound size={16} /> Use as credenciais cadastradas no banco do ambiente atual.</div>
    </div>
  );
}
