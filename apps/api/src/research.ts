import * as cheerio from "cheerio";
import robotsParser from "robots-parser";
import { validateExternalUrl, withRetry } from "./utils";

export type ResearchPage = { url: string; title: string; text: string; links: string[]; status: "ok" | "skipped" | "failed"; error?: string };

const MAX_PAGES = 10;
const MAX_BYTES = 1_500_000;
const TIMEOUT = 9000;

function scoreLink(url: string, label: string) {
  const s = `${url} ${label}`.toLowerCase();
  let score = 0;
  const terms: Record<string, number> = {
    careers: 8, career: 8, jobs: 7, hiring: 9, interview: 10,
    engineering: 6, handbook: 7, culture: 5, company: 4, about: 5,
    team: 4, people: 3, blog: 2
  };
  for (const [term, weight] of Object.entries(terms)) if (s.includes(term)) score += weight;
  return score;
}

async function fetchPage(url: string, evaluation = false): Promise<ResearchPage> {
  try {
    const u = await validateExternalUrl(url, evaluation);
    const response = await withRetry(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT);
      try {
        return await fetch(u, {
          signal: controller.signal,
          headers: { "User-Agent": "AI-Interview-Prep-Kit/1.0 research bot" },
          redirect: "follow"
        });
      } finally { clearTimeout(timer); }
    }, 3);
    const type = response.headers.get("content-type") || "";
    if (!type.includes("text/html") && !type.includes("text/plain")) {
      return { url, title: "", text: "", links: [], status: "skipped", error: "Unsupported content type" };
    }
    const buf = Buffer.from(await response.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) return { url, title: "", text: "", links: [], status: "skipped", error: "Response exceeded size limit" };
    if (!response.ok) return { url, title: "", text: "", links: [], status: "skipped", error: `HTTP ${response.status}` };
    const html = buf.toString("utf8");
    const $ = cheerio.load(html);
    $("script,style,noscript,svg").remove();
    const title = $("title").first().text().trim();
    const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 12000);
    const links = $("a").map((_, el) => {
      const href = $(el).attr("href");
      if (!href) return null;
      try { return new URL(href, u).toString(); } catch { return null; }
    }).get().filter(Boolean);
    return { url: response.url, title, text, links, status: "ok" };
  } catch (e) {
    return { url, title: "", text: "", links: [], status: "failed", error: String((e as Error).message) };
  }
}

async function allowedByRobots(home: string, target: string) {
  try {
    const u = new URL(home);
    const robotsUrl = `${u.origin}/robots.txt`;
    const r = await fetch(robotsUrl, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return true;
    const txt = await r.text();
    return robotsParser(robotsUrl, txt).isAllowed(target, "*") !== false;
  } catch { return true; }
}

export async function researchCompany(companyUrl: string, evaluation = false) {
  const home = await fetchPage(companyUrl, evaluation);
  if (home.status !== "ok") {
    return { pages: [home], hiringSignals: [], publicDiscussion: [], errors: [{ url: companyUrl, error: home.error || "unreachable" }] };
  }
  const base = new URL(home.url).origin;
  const candidates = Array.from(new Set(home.links))
    .filter(link => { try { return new URL(link).origin === base; } catch { return false; } })
    .map(link => ({ url: link, score: scoreLink(link, link) }))
    .sort((a,b) => b.score - a.score)
    .slice(0, MAX_PAGES - 1);

  const pages: ResearchPage[] = [home];
  const errors: {url:string,error:string}[] = [];
  for (const c of candidates) {
    if (!(await allowedByRobots(home.url, c.url))) {
      errors.push({ url: c.url, error: "Blocked by robots.txt" });
      continue;
    }
    const page = await fetchPage(c.url, evaluation);
    pages.push(page);
    if (page.status !== "ok") errors.push({ url: c.url, error: page.error || "skipped" });
  }

  const hiringSignals = pages.filter(p => /career|hiring|interview|jobs|handbook/i.test(`${p.url} ${p.title} ${p.text}`));
  return { pages, hiringSignals, publicDiscussion: [], errors };
}
