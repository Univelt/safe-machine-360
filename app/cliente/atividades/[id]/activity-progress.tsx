"use client";

import { SafeForm } from "@/app/components/safe-form";
import { useRef, useState } from "react";
import { useSafeFormStatus } from "@/app/components/safe-form";
import { updateActivityProgressAction } from "@/app/actions/safe-records";

const presets = [0, 25, 50, 75, 100];

export function ActivityProgress({ activityId, progress, canMutate }: { activityId: string; progress: number; canMutate: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState(progress);

  function commit(next: number) {
    const clamped = Math.min(100, Math.max(0, Math.round(next)));
    setValue(clamped);
    const input = formRef.current?.elements.namedItem("progress");
    if (input instanceof HTMLInputElement) input.value = String(clamped);
    formRef.current?.requestSubmit();
  }

  return (
    <div className="activity-detail-progress">
      <div><span>Progresso da execução</span><strong>{value}%</strong></div>
      <span className="activity-progress-track"><span style={{ width: `${value}%` }} /></span>
      {canMutate ? (
        <SafeForm ref={formRef} action={updateActivityProgressAction} className="activity-progress-form">
          <input type="hidden" name="activityId" value={activityId} />
          <input type="hidden" name="progress" value={value} />
          <label className="sr-only" htmlFor={`progress-${activityId}`}>Avançar progresso</label>
          <input
            id={`progress-${activityId}`}
            className="progress-slider"
            type="range"
            min={0}
            max={100}
            step={5}
            value={value}
            onChange={(event) => setValue(Number(event.currentTarget.value))}
            onPointerUp={(event) => commit(Number(event.currentTarget.value))}
            onKeyUp={(event) => commit(Number((event.currentTarget as HTMLInputElement).value))}
          />
          <div className="progress-presets">
            {presets.map((preset) => (
              <button key={preset} type="button" className={value === preset ? "active" : undefined} onClick={() => commit(preset)}>{preset}%</button>
            ))}
          </div>
          <ProgressHint />
        </SafeForm>
      ) : <p className="progress-hint">O progresso é atualizado pela equipe responsável pela atividade.</p>}
    </div>
  );
}

function ProgressHint() {
  const { pending } = useSafeFormStatus();
  return <p className="progress-hint">{pending ? "Salvando progresso..." : "Arraste a barra ou toque em um percentual. 100% conclui a atividade."}</p>;
}
