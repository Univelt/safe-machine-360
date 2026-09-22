"use client";

import { AlertTriangle, ChevronDown, MoreVertical, Pencil, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addChecklistItemAction, setChecklistItemActiveAction, updateChecklistItemAction, type ChecklistMutationState } from "@/app/actions/records";

type ChecklistItem = { id: string; number: number; description: string; isActive: boolean; _count: { answers: number } };

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
          <span><strong>{filtered.filter((item) => item.isActive).length}</strong> ativos de {items.length} itens</span>
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
                    <div className="checklist-item-copy"><p>{item.description}</p>{!item.isActive && <span className="doc-pill neutral">Desativado</span>}</div>
                    {canEdit && <ChecklistItemActions item={item} />}
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

const initialState: ChecklistMutationState = { ok: false, message: "" };

function ChecklistItemActions({ item }: { item: ChecklistItem }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editState, editAction, editPending] = useActionState(updateChecklistItemAction, initialState);
  const [statusState, statusAction, statusPending] = useActionState(setChecklistItemActiveAction, initialState);

  useEffect(() => {
    if (editState.ok) {
      router.refresh();
    }
  }, [editState.ok, router]);
  useEffect(() => {
    if (statusState.ok) router.refresh();
  }, [statusState.ok, router]);

  return (
    <div className="checklist-item-actions">
      {editing && (
        <form action={editAction} className="inline-item-edit">
          <input type="hidden" name="itemId" value={item.id} />
          <label><span className="sr-only">Descrição do item {item.number}</span><textarea name="description" required rows={2} defaultValue={item.description} /></label>
          <button className="button primary" type="submit" disabled={editPending}>{editPending ? "Salvando..." : "Salvar"}</button>
          <button className="button secondary" type="button" onClick={() => setEditing(false)}>Cancelar</button>
        </form>
      )}
      <button className="icon-button" type="button" aria-label={`Editar item ${item.number}`} onClick={() => setEditing((value) => !value)}><Pencil size={15} /></button>
      <details className="actions-menu">
        <summary className="icon-button" aria-label={`Mais ações do item ${item.number}`}><MoreVertical size={16} /></summary>
        <div>
          <form action={statusAction} onSubmit={(event) => {
            if (!item.isActive) return;
            const impact = item._count.answers > 0
              ? `Este item possui ${item._count.answers} resposta(s). Ele será desativado e as execuções anteriores continuarão intactas.`
              : "O item será excluído se não possuir histórico; caso contrário, será desativado.";
            if (!window.confirm(`${impact}\n\nDeseja continuar?`)) event.preventDefault();
          }}>
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="intent" value={item.isActive ? "remove" : "restore"} />
            <button type="submit" disabled={statusPending} className={item.isActive ? "danger-action" : undefined}>
              {item.isActive ? <Trash2 size={15} /> : <RotateCcw size={15} />}
              {statusPending ? "Processando..." : item.isActive ? "Excluir ou desativar" : "Reativar item"}
            </button>
          </form>
        </div>
      </details>
      {(editState.message || statusState.message) && <p className={`form-feedback ${(editState.ok || statusState.ok) ? "success" : "error"}`} role="status">{editState.message || statusState.message}</p>}
    </div>
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
