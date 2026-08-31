"use client";

import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Presentation,
  CircleHelp,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth/session";
import { initialsOf, roleLabels } from "@/lib/labels";
import { Brand } from "./brand";

const adminNavigation = [
  { label: "Visão geral", icon: LayoutDashboard, href: "/" },
  { label: "Apresentação", icon: Presentation, href: "/apresentacao" },
  { label: "Máquinas", icon: ClipboardList, href: "/admin/maquinas" },
  { label: "Checklists", icon: ClipboardCheck, href: "/cliente/checklists" },
  { label: "Documentos", icon: FileText, href: "/cliente/documentos" },
  { label: "Atividades", icon: Activity, href: "/cliente/atividades" },
  { label: "Empresas", icon: Building2, divider: true, href: "/admin/empresas" },
  { label: "Usuários", icon: Users, href: "/admin/usuarios" },
  { label: "Histórico", icon: History, href: "/admin/historico" },
  { label: "Configurações", icon: Settings, href: "#" },
];

const clientNavigation = [
  { label: "Visão geral", icon: LayoutDashboard, href: "/cliente" },
  { label: "Máquinas", icon: ClipboardList, href: "/cliente/maquinas" },
  { label: "Checklists", icon: ClipboardCheck, href: "/cliente/checklists" },
  { label: "Documentos", icon: FileText, href: "/cliente/documentos" },
  { label: "Atividades", icon: Activity, href: "/cliente/atividades" },
  { label: "Relatórios", icon: BarChart3, divider: true, href: "/cliente/relatorios" },
  { label: "Suporte Univelt", icon: CircleHelp, href: "mailto:suporte@univelt.com.br" },
];

type PortalShellProps = {
  children: React.ReactNode;
  variant?: "admin" | "client";
  session: SessionUser;
};

export function PortalShell({ children, variant = "admin", session }: PortalShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuUser, setMenuUser] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isClient = variant === "client";
  const navigation = isClient ? clientNavigation : adminNavigation;

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("univelt-sidebar-collapsed") === "1");
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 920px)");
    function onChange() {
      if (!media.matches) setMenuOpen(false);
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function toggleSidebar() {
    if (window.matchMedia("(max-width: 920px)").matches) {
      setMenuOpen((open) => !open);
      return;
    }
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("univelt-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>

      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""} ${collapsed ? "sidebar-collapsed" : ""}`} aria-label="Navegação principal">
        <div className="sidebar-head">
          <Brand compact={collapsed} />
          <button className="icon-button sidebar-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <div className="tenant-card">
          <span className="tenant-kicker">{isClient ? "Sua empresa" : "Escopo administrativo"}</span>
          <div className="tenant-button">
            <span className="tenant-avatar">{(session.companyName ?? "UV").slice(0, 2).toUpperCase()}</span>
            <span>
              <strong>{isClient ? session.companyName ?? "Empresa" : "Visão global Univelt"}</strong>
              <small>{isClient ? session.unitName ?? "Unidade vinculada" : "Todas as empresas"}</small>
            </span>
            {!isClient && <ChevronDown size={16} />}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/"
              ? pathname === "/"
              : item.href === "/cliente"
                ? pathname === "/cliente"
                : pathname.startsWith(item.href);
            return (
              <div key={item.label} className={item.divider ? "nav-with-divider" : undefined}>
                <Link
                  href={item.href}
                  className={`nav-item ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={19} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="security-note">
            <ShieldCheck size={18} />
            <span>
              <strong>{isClient ? "Dados da sua empresa" : "Ambiente protegido"}</strong>
              <small>{isClient ? `Acesso restrito a ${session.companyName}` : "Acesso monitorado"}</small>
            </span>
          </div>
          <span className="version">Portal Univelt · Fase 2</span>
        </div>
      </aside>

      {menuOpen && <button className="sidebar-scrim" type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}

      <div className={`main-column ${collapsed ? "sidebar-is-collapsed" : ""}`}>
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              type="button"
              onClick={toggleSidebar}
              aria-label={menuOpen || collapsed ? "Expandir menu" : "Recolher menu"}
              aria-expanded={menuOpen || !collapsed}
            >
              <Menu size={21} />
            </button>
            <div className="global-search">
              <Search size={18} aria-hidden="true" />
              <label className="sr-only" htmlFor="global-search">Buscar no portal</label>
              <input id="global-search" type="search" placeholder={isClient ? "Buscar máquina, código ou TAG" : "Buscar empresa, máquina ou usuário"} />
              <kbd>⌘ K</kbd>
            </div>
          </div>
          <div className="topbar-actions">
            <span className="demo-pill">{isClient ? "Área do cliente" : "Administração Univelt"}</span>
            <button className="icon-button notification-button" type="button" aria-label="Notificações">
              <Bell size={20} />
            </button>
            <div className="user-menu-wrap">
              <button className="user-menu" type="button" onClick={() => setMenuUser((value) => !value)} aria-label={`Abrir menu de ${session.name}`}>
                <span className="user-avatar">{initialsOf(session.name)}</span>
                <span className="user-copy">
                  <strong>{session.name}</strong>
                  <small>{roleLabels[session.role]}</small>
                </span>
                <ChevronDown size={16} />
              </button>
              {menuUser && (
                <div className="user-dropdown">
                  <p>{session.email}</p>
                  {session.role === "SUPER_ADMIN" && <Link href="/">Painel Univelt</Link>}
                  <Link href="/cliente">Área do cliente</Link>
                  <button type="button" onClick={logout}><LogOut size={15} /> Sair</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className="main-content">{children}</main>
      </div>
    </div>
  );
}
