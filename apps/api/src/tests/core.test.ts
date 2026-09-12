import { describe, it, expect } from "vitest";
import { calculateCoverage } from "../coverage";
import { allocateSchedule } from "../schedule";
import { validateKit } from "@ai-prep/shared";

const reqs:any[] = [
  {id:"r1",text:"React",kind:"technical",priority:"must"},
  {id:"r2",text:"Mentoring",kind:"behavioural",priority:"must"},
  {id:"r3",text:"Domain",kind:"domain",priority:"nice"}
];

describe("coverage", () => {
  it("finds uncovered requirements deterministically", () => {
    expect(calculateCoverage(reqs, [{id:"q1",requirement_ids:["r1"],category:"technical",prompt:"",answer_outline:"",difficulty:2}] as any).uncovered_requirement_ids)
      .toEqual(["r2","r3"]);
  });
});

describe("schedule", () => {
  it("creates exactly N days with integer minutes", () => {
    const qs:any[] = reqs.map((r,i)=>({id:`q${i+1}`,requirement_ids:[r.id],category:"technical",prompt:"",answer_outline:"",difficulty:3}));
    const days = allocateSchedule(reqs as any, qs as any, 5);
    expect(days).toHaveLength(5);
    expect(days.every(d=>Number.isInteger(d.minutes))).toBe(true);
    expect(days.flatMap(d=>d.question_ids)).toEqual(expect.arrayContaining(["q1","q2"]));
  });
  it("supports a 1-day schedule", () => {
    const days = allocateSchedule(reqs as any, [], 1);
    expect(days).toHaveLength(1);
  });
  it("supports a 60-day schedule", () => {
    const days = allocateSchedule(reqs as any, [], 60);
    expect(days).toHaveLength(60);
  });
});

describe("structure validation", () => {
  it("rejects a schedule referencing a missing question", () => {
    const kit:any = {
      source:{company:"x",company_url:"https://x.com",role:"r",location:"",jd_chars:2,researched_at:"",pages_used:[]},
      company_brief:{summary:"",what_they_do:"",sources:[]},
      role:{title:"r",seniority:"",responsibilities:[],requirements:[reqs[0]]},
      questions:[],
      flashcards:[],
      schedule:{days_available:1,days:[{day:1,focus:"",question_ids:["q404"],minutes:20}]},
      coverage:{uncovered_requirement_ids:["r1"],passes:1}
    };
    expect(()=>validateKit(kit)).toThrow();
  });
});
