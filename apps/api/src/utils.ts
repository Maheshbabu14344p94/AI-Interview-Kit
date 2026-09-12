import crypto from "crypto";
import dns from "dns/promises";
import net from "net";
import { config } from "./config";

export function fingerprint(jd: string, url: string) {
  return crypto.createHash("sha256")
    .update(`${jd.trim().replace(/\s+/g, " ").toLowerCase()}|${url.trim().replace(/\/+$/, "").toLowerCase()}`)
    .digest("hex");
}

export function safeJsonParse<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a,b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254);
  }
  return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80");
}

export async function validateExternalUrl(raw: string, evaluation = false) {
  const u = new URL(raw);
  if (!["http:", "https:"].includes(u.protocol)) throw new Error("Only HTTP(S) URLs are allowed");
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) {
    if (!(evaluation && config.evaluationAllowedHosts.includes(host))) {
      throw new Error("Loopback host rejected in production mode");
    }
  }
  if (net.isIP(host) && isPrivateIp(host)) {
    if (!(evaluation && config.evaluationAllowedHosts.includes(host))) {
      throw new Error("Private or loopback IP rejected");
    }
  }
  if (!net.isIP(host)) {
    try {
      const addresses = await dns.lookup(host, { all: true });
      if (!evaluation && addresses.some(a => isPrivateIp(a.address))) {
        throw new Error("Hostname resolves to a private address");
      }
      if (evaluation && config.evaluationAllowedHosts.includes(host)) return u;
    } catch (e) {
      if (String((e as Error).message).includes("private address")) throw e;
    }
  }
  return u;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      if (i < attempts - 1) await sleep(250 * (2 ** i) + Math.random() * 200);
    }
  }
  throw last;
}
