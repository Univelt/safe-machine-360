"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function ChecklistItemsEditor({ initialItems = [""] }: { initialItems?: string[] }) {
  const [items, setItems] = useState(initialItems.length ? initialItems : [""]);

  return (
    <div className="checklist-editor">
      {items.map((item, index) => (
        <label key={index} className="full">
          Item {index + 1}
          <div className="item-row">
            <input
              name="itemDescription"
              required
              value={item}
              onChange={(event) => {
                const next = [...items];
                next[index] = event.target.value;
                setItems(next);
              }}
              placeholder="Descrição do item de verificação"
            />
            {items.length > 1 && (
              <button type="button" className="button secondary" onClick={() => setItems(items.filter((_, current) => current !== index))} aria-label={`Remover item ${index + 1}`}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </label>
      ))}
      <button type="button" className="button secondary" onClick={() => setItems([...items, ""])}>
        <Plus size={16} /> Adicionar item
      </button>
    </div>
  );
}
