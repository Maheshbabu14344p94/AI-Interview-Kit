import { KitSchema, validateKit } from "@ai-prep/shared";
import type { Kit, Requirement, Question } from "@ai-prep/shared";
import { researchCompany } from "./research";
import { companyBrief, extractRole, flashcardsFor, gapQuestions, questionsFor } from "./llm";
import { calculateCoverage } from "./coverage";
import { allocateSchedule } from "./schedule";

const categories: Array<Question["category"]> = ["technical", "behavioural", "system-design", "company-fit"];

function fallbackRole(jd: string) {
  const lines = jd.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const title = lines.find(l => /engineer|developer|manager|designer|analyst|scientist/i.test(l)) || "Interview Candidate";
  const reqs: Requirement[] = [];
  const patterns: Array<[RegExp, Requirement["kind"]]> = [
    [/\bReact\b/i, "technical"], [/\bTypeScript\b/i, "technical"], [/\bJavaScript\b/i, "technical"],
    [/\bNode(?:\.js)?\b/i, "technical"], [/\bPython\b/i, "technical"], [/\bSQL\b/i, "technical"],
    [/\bAWS\b|\bAzure\b|\bGCP\b/i, "technical"], [/\bmentor|\blead|\bcollaborat|\bcommunicat/i, "behavioural"]
  ];
  for (const [re, kind] of patterns) if (re.test(jd)) reqs.push({ id: `r${reqs.length+1}`, text: `Experience with ${re.source.replace(/\\b/g,"").replace(/[()]/g,"")}`, kind, priority: "must" });
  if (!reqs.length && jd.length > 80) reqs.push({ id: "r1", text: lines.slice(0,2).join(" "), kind: "domain", priority: "must" });
  return { title, seniority: /senior/i.test(jd) ? "Senior" : /lead/i.test(jd) ? "Lead" : "Unspecified", location: "", responsibilities: lines.slice(0,4), requirements: reqs };
}

function fallbackQuestions(reqs: Requirement[], companyContext: string) {
  const qs: Question[] = [];
  reqs.forEach((r, i) => {
    const category: Question["category"] =
      r.kind === "behavioural" ? "behavioural" :
      /system|architecture|scale|distributed/i.test(r.text) ? "system-design" :
      "technical";
    qs.push({
      id: `q${i+1}`,
      requirement_ids: [r.id],
      category,
      prompt: `How would you demonstrate and apply ${r.text}?`,
      answer_outline: `Define the concept, describe a concrete example, discuss trade-offs, and connect the answer to the role.`,
      difficulty: r.priority === "must" ? 3 : 2
    });
  });
  if (companyContext) qs.push({
    id: `q${qs.length+1}`,
    requirement_ids: reqs.slice(0,1).map(r => r.id),
    category: "company-fit",
    prompt: "Why does this role and company context make this experience relevant?",
    answer_outline: "Connect the role's needs to the candidate's evidence and the researched company context.",
    difficulty: 2
  });
  return qs;
}

export async function runPipeline(input: { jd: string; company_url: string; days: number; evaluation?: boolean }, onProgress?: (event: any) => void): Promise<Kit> {
  const emit = (stage: string, status: string, meta: any = {}) => onProgress?.({ stage, status, ...meta, at: new Date().toISOString() });

  emit("Analyzing job description", "running");
  let role: any;
  try { role = await extractRole(input.jd); } catch { role = fallbackRole(input.jd); }
  if (!role.requirements) role = fallbackRole(input.jd);
  emit("Analyzing job description", "completed", { requirements: role.requirements.length });

  emit("Extracting requirements", "completed", { count: role.requirements.length });

  emit("Researching company", "running");
  const research = await researchCompany(input.company_url, Boolean(input.evaluation));
  emit("Researching company", "completed", { pages: research.pages.length });

  emit("Discovering relevant pages", "completed", { relevant: research.pages.filter(p => p.status === "ok").length });

  const hiring = research.hiringSignals;
  emit("Finding hiring process", hiring.length ? "completed" : "skipped", { found: hiring.length > 0 });

  emit("Researching interview discussions", "skipped", { reason: "No search provider configured" });

  emit("Building company brief", "running");
  let brief: any;
  try {
    brief = await companyBrief(new URL(input.company_url).hostname, research.pages.filter(p => p.status === "ok").slice(0,6).map(p => ({url:p.url,text:p.text})));
  } catch {
    const host = new URL(input.company_url).hostname;
    brief = {
      summary: research.pages[0]?.text?.slice(0,500) || "Company research was unavailable.",
      what_they_do: research.pages[0]?.text?.slice(0,900) || "No reliable company description was found.",
      sources: research.pages.filter(p => p.status === "ok").map(p => p.url)
    };
  }
  emit("Building company brief", "completed");

  emit("Mapping role requirements", "completed");

  let questions: Question[] = [];
  const context = `${brief.summary}\n${brief.what_they_do}\n${hiring.map(p => p.text.slice(0,3000)).join("\n")}`;
  for (const category of categories) {
    emit(`Generating ${category} questions`, "running");
    const targets = role.requirements.filter((r: Requirement) =>
      category === "behavioural" ? r.kind === "behavioural" :
      category === "system-design" ? /system|architecture|scale|distributed/i.test(r.text) :
      category === "technical" ? r.kind === "technical" :
      true
    );
    for (const r of targets.slice(0,8)) {
      try {
        const generated = await questionsFor(r, category, context);
        for (const q of (generated.questions || [])) questions.push({
          id: `q${questions.length+1}`, requirement_ids: [r.id],
          category, prompt: q.prompt, answer_outline: q.answer_outline, difficulty: Math.min(3, Math.max(1, Number(q.difficulty) || 2))
        });
      } catch {
        // fallback is generated below if this category produced no useful question
      }
    }
    emit(`Generating ${category} questions`, "completed");
  }
  if (!questions.length) questions = fallbackQuestions(role.requirements, context);
  else {
    const missing = role.requirements.filter((r: Requirement) => !questions.some(q => q.requirement_ids.includes(r.id)));
    questions.push(...fallbackQuestions(missing, context).map(q => ({...q, id:`q${questions.length+1}`})));
  }

  emit("Creating flashcards", "running");
  let flashcards: any[] = [];
  try { flashcards = (await flashcardsFor(role.requirements, questions)).flashcards || []; } catch {}
  if (!flashcards.length) {
    flashcards = role.requirements.map((r: Requirement, i: number) => ({
      id:`f${i+1}`, front:r.text, back:`Be ready to explain ${r.text} with evidence, trade-offs, and a concrete example.`, requirement_ids:[r.id]
    }));
  }
  emit("Creating flashcards", "completed", { count: flashcards.length });

  emit("Checking question coverage", "running");
  let coverage = calculateCoverage(role.requirements, questions);
  emit("Checking question coverage", "completed", { uncovered: coverage.uncovered_requirement_ids.length });

  let passes = 1;
  while (coverage.uncovered_requirement_ids.length && passes < 3) {
    emit("Closing coverage gaps", "running", { pass: passes + 1 });
    const missing = role.requirements.filter((r: Requirement) => coverage.uncovered_requirement_ids.includes(r.id));
    try {
      const gaps = await gapQuestions(missing, context);
      for (const q of (gaps.questions || [])) questions.push({
        id:`q${questions.length+1}`, requirement_ids:[q.requirement_id],
        category:q.category, prompt:q.prompt, answer_outline:q.answer_outline, difficulty:Math.min(3,Math.max(1,Number(q.difficulty)||2))
      });
    } catch {
      questions.push(...fallbackQuestions(missing, context).map(q => ({...q,id:`q${questions.length+1}`})));
    }
    coverage = calculateCoverage(role.requirements, questions);
    passes++;
    emit("Closing coverage gaps", "completed", { uncovered: coverage.uncovered_requirement_ids.length });
  }

  emit("Checking question coverage", "completed", { uncovered: coverage.uncovered_requirement_ids.length });

  emit("Building study schedule", "running");
  const scheduleDays = allocateSchedule(role.requirements, questions, input.days);
  emit("Building study schedule", "completed");

  emit("Validating kit", "running");
  const kit = validateKit({
    source: {
      company: new URL(input.company_url).hostname,
      company_url: input.company_url,
      role: role.title || "Interview Candidate",
      location: role.location || "",
      jd_chars: input.jd.length,
      researched_at: new Date().toISOString(),
      pages_used: research.pages.filter(p => p.status === "ok").map(p => p.url)
    },
    company_brief: {
      summary: brief.summary || "",
      what_they_do: brief.what_they_do || "",
      sources: brief.sources || []
    },
    role: {
      title: role.title || "Interview Candidate",
      seniority: role.seniority || "Unspecified",
      responsibilities: role.responsibilities || [],
      requirements: role.requirements
    },
    questions,
    flashcards,
    schedule: { days_available: input.days, days: scheduleDays },
    coverage: { uncovered_requirement_ids: coverage.uncovered_requirement_ids, passes }
  });
  emit("Validating kit", "completed");
  emit("Saving interview kit", "completed");
  return kit;
}

export { KitSchema };
