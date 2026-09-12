# AI Interview Prep Kit

A production-oriented implementation of the Trao Full-Stack Engineering Assessment.

## What it does

The application turns a pasted job description, company website and interview timeline into a research-backed preparation kit:

- company brief
- role breakdown
- stable requirements
- categorized questions
- flashcards
- deterministic study schedule
- deterministic coverage validation
- second-pass gap closure
- editable/reorderable kit builder
- confidence-weighted practice
- Weak Spots report

The generation UI exposes the real pipeline rather than a fake spinner.

## Stack

- Next.js + TypeScript + Tailwind CSS
- Node.js + Express + TypeScript
- MongoDB/Mongoose
- Zod validation
- Motion for UI transitions
- Cheerio for server-side HTML extraction
- bcryptjs + HTTP-only session cookie
- OpenAI-compatible LLM adapter, configurable by environment

The LLM endpoint is intentionally provider-neutral because the assessment does not supply an API key. Set `LLM_BASE_URL`, `LLM_API_KEY` and `LLM_MODEL` to a provider with a genuine free tier.

## Architecture

`apps/web` is the presentation layer. `apps/api` owns authentication, retrieval, research, generation, validation, persistence and the batch command. `packages/shared` contains the exact kit schema and shared types.

The pipeline is:

1. JD analysis
2. requirement extraction
3. company homepage retrieval
4. dynamic link discovery/ranking
5. relevant page retrieval
6. hiring-process discovery
7. public interview discussion lookup when configured
8. company brief
9. role breakdown
10. per-category question generation
11. flashcards
12. deterministic coverage check
13. targeted gap generation
14. second coverage check
15. deterministic schedule allocation
16. final Zod validation
17. persistence

The system never asks the LLM to decide coverage or schedule arithmetic.

## Coverage

A requirement is covered when at least one question contains that requirement's stable ID. The coverage engine is ordinary application code. Uncovered requirements are returned to the generation stage, which creates targeted questions. The pipeline performs up to two gap-generation passes.

## Schedule

The scheduler is deterministic. It creates exactly `days_available` days, distributes questions by priority/difficulty, ensures every must-have requirement appears in at least one scheduled question, and uses integer minute durations.

For very large day counts, it creates useful study days with a minimum allocation rather than asking an LLM to invent arithmetic.

## Edit preservation

Generated entities carry:

- `origin`: generated | user
- `edit_state`: clean | edited
- `pinned`: boolean
- `version`

Regeneration replaces untouched generated content while preserving user-created, edited and pinned entities. Reconciliation is performed server-side rather than replacing whole arrays.

## Research and security

The crawler:

- starts from the supplied homepage
- follows relative links
- ranks links using semantic URL/title signals rather than a hard-coded route list
- respects robots.txt
- limits pages, response size and concurrency
- uses timeout + exponential backoff
- records failed sources without killing a kit

Fetched text is wrapped as untrusted evidence in model prompts. It is never treated as instructions.

Production SSRF protection rejects loopback/private/link-local destinations and validates redirects. The batch evaluator has an explicit `EVALUATION_ALLOWED_HOSTS` escape hatch for controlled local fixtures required by the assessment.

## Thin JDs / missing hiring pages

The system does not invent requirements. A thin JD produces a thin kit. If no hiring process is found, the company brief records that honestly and continues using the evidence that is available.

## Batch command

The required command is:

```bash
npm run evaluate -- --input cases.json --output kits.json
```

Input:

```json
[
  {
    "id": "case-01",
    "jd": "Senior Backend Engineer...",
    "company_url": "http://localhost:8099/acme/",
    "days": 5
  }
]
```

The evaluator uses the same pipeline as the application and continues after individual failures.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Web: http://localhost:3000
API: http://localhost:4000

MongoDB is optional in `DEMO_MODE`. Without MongoDB/LLM credentials the app still runs using an honest deterministic demo adapter, but a real assessment submission should provide real services.

## Tests

```bash
npm test
```

Tests protect:

- coverage calculation
- schedule allocation
- schema validation
- regeneration merge behavior

## Deployment

Deploy `apps/web` and `apps/api` separately or use a platform that supports the workspace. Set environment variables securely. Never expose `LLM_API_KEY`, `MONGODB_URI` or `SESSION_SECRET` to the browser.

## Design trade-offs

The crawler deliberately favors bounded breadth over an unbounded spider so five-case batch runs remain practical. Public interview discussion is provider-neutral: when no search API is configured, the product reports that external discussion lookup was unavailable instead of manufacturing citations.

The UI's readiness score is a derived product metric, not a prediction of hiring probability.

