import type { Question, Requirement } from "@ai-prep/shared";

export function allocateSchedule(requirements: Requirement[], questions: Question[], daysAvailable: number) {
  if (!Number.isInteger(daysAvailable) || daysAvailable < 1) throw new Error("daysAvailable must be a positive integer");
  const priority = new Map(requirements.map(r => [r.id, r.priority === "must" ? 2 : 1]));
  const reqDifficulty = (q: Question) => Math.max(...q.requirement_ids.map(id => priority.get(id) || 1), 1);
  const sorted = [...questions].sort((a,b) => {
    const pa = reqDifficulty(a) * 10 + a.difficulty;
    const pb = reqDifficulty(b) * 10 + b.difficulty;
    return pb - pa || a.id.localeCompare(b.id);
  });

  const buckets: Question[][] = Array.from({ length: daysAvailable }, () => []);
  sorted.forEach((q, i) => buckets[i % daysAvailable].push(q));

  // Ensure every must-have has a scheduled question; move the first covering
  // question into an early bucket when needed.
  const must = requirements.filter(r => r.priority === "must");
  const assigned = new Set(buckets.flat().map(q => q.id));
  for (const r of must) {
    const candidate = sorted.find(q => q.requirement_ids.includes(r.id));
    if (candidate && assigned.has(candidate.id)) continue;
    if (candidate) buckets[0].push(candidate);
  }

  const focusFor = (bucket: Question[]) => {
    if (!bucket.length) return "Review & reflection";
    const counts = new Map<string, number>();
    for (const q of bucket) counts.set(q.category, (counts.get(q.category) || 0) + 1);
    return [...counts.entries()].sort((a,b) => b[1]-a[1])[0][0].replace("-", " ");
  };

  return buckets.map((bucket, i) => ({
    day: i + 1,
    focus: focusFor(bucket),
    question_ids: [...new Set(bucket.map(q => q.id))],
    minutes: Math.max(15, Math.round(bucket.length * 20))
  }));
}
