import type { Kit } from "@ai-prep/shared";

export function calculateCoverage(requirements: Kit["role"]["requirements"], questions: Kit["questions"]) {
  const covered = new Set<string>();
  for (const q of questions) for (const id of q.requirement_ids) covered.add(id);
  return {
    uncovered_requirement_ids: requirements.filter(r => !covered.has(r.id)).map(r => r.id),
    covered_requirement_ids: requirements.filter(r => covered.has(r.id)).map(r => r.id)
  };
}
