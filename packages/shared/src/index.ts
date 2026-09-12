import { z } from "zod";

export const RequirementSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  kind: z.enum(["technical", "behavioural", "domain"]),
  priority: z.enum(["must", "nice"])
});

export const QuestionSchema = z.object({
  id: z.string().min(1),
  requirement_ids: z.array(z.string()),
  category: z.enum(["technical", "behavioural", "system-design", "company-fit"]),
  prompt: z.string(),
  answer_outline: z.string(),
  difficulty: z.number().int().min(1).max(3)
});

export const FlashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string(),
  back: z.string(),
  requirement_ids: z.array(z.string())
});

export const ScheduleDaySchema = z.object({
  day: z.number().int().min(1),
  focus: z.string(),
  question_ids: z.array(z.string()),
  minutes: z.number().int().min(0)
});

export const KitSchema = z.object({
  source: z.object({
    company: z.string(),
    company_url: z.string(),
    role: z.string(),
    location: z.string(),
    jd_chars: z.number().int().nonnegative(),
    researched_at: z.string(),
    pages_used: z.array(z.string())
  }),
  company_brief: z.object({
    summary: z.string(),
    what_they_do: z.string(),
    sources: z.array(z.string())
  }),
  role: z.object({
    title: z.string(),
    seniority: z.string(),
    responsibilities: z.array(z.string()),
    requirements: z.array(RequirementSchema)
  }),
  questions: z.array(QuestionSchema),
  flashcards: z.array(FlashcardSchema),
  schedule: z.object({
    days_available: z.number().int().min(1),
    days: z.array(ScheduleDaySchema)
  }),
  coverage: z.object({
    uncovered_requirement_ids: z.array(z.string()),
    passes: z.number().int().nonnegative()
  })
});

export type Kit = z.infer<typeof KitSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Flashcard = z.infer<typeof FlashcardSchema>;

export const BatchCaseSchema = z.object({
  id: z.string(),
  jd: z.string(),
  company_url: z.string(),
  days: z.number().int().min(1)
});

export const BatchInputSchema = z.array(BatchCaseSchema);

export function validateKit(kit: unknown): Kit {
  const parsed = KitSchema.parse(kit);
  const reqIds = new Set(parsed.role.requirements.map(r => r.id));
  for (const q of parsed.questions) {
    if (q.requirement_ids.some(id => !reqIds.has(id))) {
      throw new Error(`Question ${q.id} references an unknown requirement`);
    }
  }
  const questionIds = new Set(parsed.questions.map(q => q.id));
  for (const day of parsed.schedule.days) {
    if (day.question_ids.some(id => !questionIds.has(id))) {
      throw new Error(`Schedule day ${day.day} references an unknown question`);
    }
  }
  if (parsed.schedule.days.length !== parsed.schedule.days_available) {
    throw new Error("Schedule must contain exactly days_available days");
  }
  return parsed;
}
