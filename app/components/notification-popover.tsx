"use client";

import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="notification-wrap">
      <button
        ref={buttonRef}
        className="icon-button notification-button"
        type="button"
        aria-label="Notificações"
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={20} />
      </button>
      {open && (
        <div ref={panelRef} id="notification-panel" className="popover-panel notification-panel" role="dialog" aria-label="Notificações">
          <strong>Notificações</strong>
          <div className="popover-empty">
            <Bell size={20} aria-hidden="true" />
            <p>Você não tem notificações.</p>
            <small>Novos avisos operacionais aparecerão aqui.</small>
          </div>
        </div>
      )}
    </div>
  );
}
