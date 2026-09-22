export type ChecklistResult = "SIM" | "NAO" | "PARCIAL" | "NA";
export type ComparableAnswer = { itemId: string; result: ChecklistResult; item: { description: string } };

export function summarizeChecklistAnswers(answers: Array<{ result: ChecklistResult }>, expected = answers.length) {
  const yes = answers.filter((answer) => answer.result === "SIM").length;
  const no = answers.filter((answer) => answer.result === "NAO" || answer.result === "PARCIAL").length;
  const na = answers.filter((answer) => answer.result === "NA").length;
  const applicable = yes + no;
  return { yes, no, na, applicable, missing: Math.max(0, expected - answers.length), compliance: applicable ? Math.round(yes / applicable * 100) : 0 };
}

export function checklistExecutionOutcome(results: ChecklistResult[]) {
  return results.some((result) => result === "NAO" || result === "PARCIAL") ? "NAO_CONFORME" as const : "CONFORME" as const;
}

export function compareChecklistAnswers(current: ComparableAnswer[], previous?: ComparableAnswer[]) {
  if (!previous) return { improved: [] as string[], worsened: [] as string[], recurring: [] as string[] };
  const previousByItem = new Map(previous.map((answer) => [answer.itemId, answer.result]));
  const improved: string[] = [];
  const worsened: string[] = [];
  const recurring: string[] = [];
  for (const answer of current) {
    const before = previousByItem.get(answer.itemId);
    const currentRank = resultRank(answer.result);
    const previousRank = resultRank(before);
    if (currentRank < previousRank) improved.push(answer.item.description);
    if (currentRank > previousRank) worsened.push(answer.item.description);
    if (currentRank > 0 && previousRank > 0) recurring.push(answer.item.description);
  }
  return { improved, worsened, recurring };
}

function resultRank(result?: ChecklistResult) {
  if (result === "NAO") return 2;
  if (result === "PARCIAL") return 1;
  return 0;
}
