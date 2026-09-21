"use client";

import { AlertTriangle, ChevronDown, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { addChecklistItemAction } from "@/app/actions/records";

type ChecklistItem = { id: string; number: number; description: string };

export function ChecklistTemplateItems({ templateId, items, canEdit }: { templateId: string; items: ChecklistItem[]; canEdit: boolean }) {
  const [query, setQuery] = useState("");
  const normalized = normalize(query);
  const filtered = items.filter((item) => !normalized || String(item.number).includes(normalized) || normalize(item.description).includes(normalized));
  const sections = useMemo(() => groupItems(filtered), [filtered]);
  const duplicates = useMemo(() => findDuplicates(items), [items]);

  return (
    <>
      {canEdit && (
        <form className="checklist-add-item checklist-add-item-top" action={addChecklistItemAction}>
          <input type="hidden" name="templateId" value={templateId} />
          <label>
            Novo item
            <textarea name="description" rows={2} required placeholder="Descrição do item de verificação" />
          </label>
          <button className="button primary" type="submit"><Plus size={16} /> Adicionar item</button>
        </form>
      )}

      <div className="checklist-toolbar">
        <label className="machine-search"><Search size={17} /><span className="sr-only">Buscar item</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por número ou texto" />{query && <button type="button" aria-label="Limpar busca" onClick={() => setQuery("")}><X size={15} /></button>}</label>
        <span><strong>{filtered.length}</strong> de {items.length} itens</span>
      </div>

      {duplicates.length > 0 && (
        <div className="checklist-review-note">
          <AlertTriangle size={18} />
          <p><strong>Possíveis repetições encontradas.</strong> Revise os itens {duplicates.join(", ")}. Nenhum dado foi excluído automaticamente.</p>
        </div>
      )}

      {items.length === 0 ? (
        <p className="empty-copy checklist-empty">Nenhum item cadastrado. Use o formulário acima para criar o primeiro.</p>
      ) : sections.length === 0 ? (
        <div className="state-message"><Search size={24} /><strong>Nenhum item encontrado</strong><p>Tente outro número ou termo.</p><button className="button secondary" type="button" onClick={() => setQuery("")}>Limpar busca</button></div>
      ) : (
        <div className="checklist-sections">
          {sections.map((section) => (
            <details key={section.key} open={Boolean(query) || section.key === sections[0]?.key}>
              <summary><span><strong>{section.title}</strong><small>Itens {section.start}–{section.end}</small></span><span>{section.items.length} itens <ChevronDown size={17} /></span></summary>
              <ol className="checklist-item-list">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <span className="checklist-num">{String(item.number).padStart(2, "0")}</span>
                    <p>{item.description}</p>
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </div>
      )}
      <p className="checklist-structure-note">As seções organizam a leitura pela numeração atual. Os itens e seus identificadores permanecem inalterados no banco.</p>
    </>
  );
}

function groupItems(items: ChecklistItem[]) {
  const groups = new Map<number, ChecklistItem[]>();
  for (const item of items) {
    const index = Math.max(0, Math.floor((item.number - 1) / 10));
    groups.set(index, [...(groups.get(index) ?? []), item]);
  }
  return [...groups.entries()].map(([index, values]) => ({
    key: index,
    title: sectionTitle(index),
    start: index * 10 + 1,
    end: index < 6 ? index * 10 + 10 : Math.max(...values.map((item) => item.number)),
    items: values,
  }));
}

function sectionTitle(index: number) {
  return [
    "Identificação e condições gerais",
    "Comandos e sistemas de segurança",
    "Proteções e zonas de risco",
    "Operação e parada",
    "Manutenção e fontes de energia",
    "Acesso, ergonomia e sinalização",
    "Documentação e capacitação",
  ][index] ?? "Itens complementares";
}

function findDuplicates(items: ChecklistItem[]) {
  const seen = new Map<string, number>();
  const duplicates = new Set<number>();
  for (const item of items) {
    const key = normalize(item.description);
    const previous = seen.get(key);
    if (key && previous) {
      duplicates.add(previous);
      duplicates.add(item.number);
    } else if (key) {
      seen.set(key, item.number);
    }
  }
  return [...duplicates].sort((a, b) => a - b);
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
}
