"use client";

export const MACHINE_PAGE_SIZE = 20;

export function paginateItems<T>(items: T[], page: number, pageSize = MACHINE_PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);

  return {
    items: slice,
    page: current,
    totalPages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
  };
}

function visiblePages(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const unique = [...new Set([1, total, current - 1, current, current + 1].filter((value) => value >= 1 && value <= total))].sort((a, b) => a - b);
  const items: Array<number | "gap"> = [];

  for (const value of unique) {
    const previous = items[items.length - 1];
    if (typeof previous === "number" && value - previous > 1) items.push("gap");
    items.push(value);
  }

  return items;
}

export function TablePagination({
  from,
  to,
  total,
  page,
  totalPages,
  onPageChange,
  noun = "máquinas",
}: {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  noun?: string;
}) {
  if (total === 0) return null;

  return (
    <footer className="table-footer">
      <span>Exibindo {from}–{to} de {total} {noun}</span>
      {totalPages > 1 && (
        <div>
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Página anterior">Anterior</button>
          {visiblePages(page, totalPages).map((item, index) => (
            item === "gap"
              ? <span key={`gap-${index}`}>…</span>
              : item === page
                ? <strong key={item} aria-current="page">{item}</strong>
                : <button key={item} type="button" onClick={() => onPageChange(item)} aria-label={`Página ${item}`}>{item}</button>
          ))}
          <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Próxima página">Próxima</button>
        </div>
      )}
    </footer>
  );
}
