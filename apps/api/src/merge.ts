import type { Question } from "@ai-prep/shared";

type EditableQuestion = Question & {
  origin?: "generated" | "user";
  edit_state?: "clean" | "edited";
  pinned?: boolean;
};

export function mergeGeneratedQuestions(
  previous: EditableQuestion[],
  generated: Question[]
): Question[] {
  const locked = new Map<string, EditableQuestion>(
    previous
      .filter(
        (q) =>
          q.origin === "user" ||
          q.edit_state === "edited" ||
          q.pinned === true
      )
      .map((q) => [q.id, q])
  );

  return generated.map((question) => {
    const existing = locked.get(question.id);

    if (!existing) {
      return question;
    }

    return {
      ...question,
      prompt: existing.prompt,
      answer_outline: existing.answer_outline,
      difficulty: existing.difficulty,
    };
  });
}