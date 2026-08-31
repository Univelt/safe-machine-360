import { History } from "lucide-react";

export function ChangeLog({ at, by }: { at?: string | null; by?: string | null }) {
  return (
    <p className="change-log">
      <History size={15} />
      {at && by ? (
        <span>Última alteração em <strong>{at}</strong> por <strong>{by.trim()}</strong>.</span>
      ) : (
        <span>Ainda não há registro de alteração.</span>
      )}
    </p>
  );
}
