"use client";

import { Building2, LoaderCircle, Search, UserRound, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type SearchItem = { id: string; label: string; meta: string; href: string };
type SearchPayload = { machines: SearchItem[]; companies: SearchItem[]; users: SearchItem[] };
const EMPTY_RESULTS: SearchPayload = { machines: [], companies: [], users: [] };

export function GlobalSearch({ isClient }: { isClient: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchPayload>(EMPTY_RESULTS);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => [
    { key: "machines" as const, label: "Máquinas", icon: Wrench },
    { key: "companies" as const, label: "Empresas", icon: Building2 },
    { key: "users" as const, label: "Usuários", icon: UserRound },
  ].filter((group) => results[group.key].length > 0), [results]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (event.key === "Escape" && open) {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Falha na busca");
        setResults(await response.json() as SearchPayload);
        setStatus("ready");
      } catch (cause) {
        if ((cause as Error).name !== "AbortError") setStatus("error");
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  const hasResults = groups.length > 0;

  return (
    <div ref={wrapRef} className={`global-search ${open ? "is-open" : ""}`}>
      <button className="global-search-trigger" type="button" aria-label="Abrir busca global" onClick={() => { setOpen(true); requestAnimationFrame(() => inputRef.current?.focus()); }}><Search size={18} aria-hidden="true" /></button>
      <label className="sr-only" htmlFor="global-search">Buscar no portal</label>
      <input
        ref={inputRef}
        id="global-search"
        type="search"
        role="combobox"
        value={query}
        placeholder={isClient ? "Buscar máquina, código ou TAG" : "Buscar empresa, máquina ou usuário"}
        autoComplete="off"
        aria-expanded={open}
        aria-controls="global-search-results"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          if (value.trim().length < 2) {
            setResults(EMPTY_RESULTS);
            setStatus("idle");
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && groups[0]?.key) {
            const first = results[groups[0].key][0];
            if (first) window.location.assign(first.href);
          }
        }}
      />
      {status === "loading" ? <LoaderCircle className="search-spinner spin" size={16} aria-label="Buscando" /> : <kbd>Ctrl K</kbd>}
      {open && (
        <div id="global-search-results" className="search-results" role="listbox">
          {query.trim().length < 2 && <p className="search-hint">Digite pelo menos 2 caracteres para buscar.</p>}
          {status === "loading" && <p className="search-hint">Buscando no portal…</p>}
          {status === "error" && <p className="search-error" role="alert">Não foi possível concluir a busca. Tente novamente.</p>}
          {status === "ready" && !hasResults && <p className="search-hint">Nenhum resultado encontrado para “{query.trim()}”.</p>}
          {groups.map((group) => {
            const Icon = group.icon;
            return (
              <section className="search-group" key={group.key} aria-label={group.label}>
                <strong>{group.label}</strong>
                {results[group.key].map((item) => (
                  <Link key={`${group.key}-${item.id}`} href={item.href} role="option" onClick={() => setOpen(false)}>
                    <Icon size={16} aria-hidden="true" />
                    <span><b>{item.label}</b><small>{item.meta}</small></span>
                  </Link>
                ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
