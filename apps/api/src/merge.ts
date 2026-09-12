import type { Kit } from "@ai-prep/shared";

export type EntityMeta = { origin?: "generated"|"user"; edit_state?: "clean"|"edited"; pinned?: boolean; version?: number };

export function mergeQuestions(previous: (Kit["questions"] & EntityMeta)[], next: Kit["questions"]) {
  const locked = new Map(previous.filter(q => q.origin === "user" || q.edit_state === "edited" || q.pinned).map(q => [q.id, q]));
  const generated = next.filter(q => !locked.has(q.id));
  return [...locked.values(), ...generated];
}
