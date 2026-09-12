"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2, CalendarDays, FileText, Upload, Sparkles } from "lucide-react";
import { Button, Panel, Badge } from "@/components/ui";
import { api } from "@/lib/api";

export default function NewKit(){
 const router=useRouter(); const [jd,setJd]=useState(""); const [url,setUrl]=useState("https://"); const [days,setDays]=useState(5); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
 async function create(){setError("");setLoading(true);try{const r=await api("/kits",{method:"POST",body:JSON.stringify({jd,company_url:url,days})});sessionStorage.setItem("generationInput",JSON.stringify({jd,company_url:url,days,id:r.id}));router.push(`/kits/${r.id}/generate`)}catch(e){setError(String((e as Error).message))}finally{setLoading(false)}}
 return <main className="min-h-screen glow-bg"><div className="mx-auto max-w-5xl px-5 py-10">
  <div className="mb-10"><Badge tone="accent">01 / Build intelligence</Badge><h1 className="mt-4 text-4xl font-semibold tracking-[-.04em]">Build your interview intelligence.</h1><p className="mt-3 max-w-2xl text-muted">The research starts with what you know: the role description, the company site and the time you have.</p></div>
  <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
   <Panel className="p-6"><div className="flex items-center gap-3"><FileText size={18} className="text-violet-300"/><div><div className="font-semibold">Job description</div><div className="text-xs text-muted">Paste the posting exactly as you received it.</div></div></div><textarea className="focus-ring mt-5 min-h-[360px] w-full resize-y rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 outline-none" placeholder="Paste the complete job description…" value={jd} onChange={e=>setJd(e.target.value)}/><div className="mt-2 text-right text-xs text-muted">{jd.length.toLocaleString()} characters</div></Panel>
   <div className="space-y-5">
    <Panel className="p-6"><div className="flex items-center gap-3"><Link2 size={18} className="text-cyan-300"/><div><div className="font-semibold">Company website</div><div className="text-xs text-muted">Research begins here.</div></div></div><input className="focus-ring mt-5 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none" placeholder="https://company.com" value={url} onChange={e=>setUrl(e.target.value)}/><div className="mt-2 text-xs text-muted">The crawler follows relevant links dynamically.</div></Panel>
    <Panel className="p-6"><div className="flex items-center gap-3"><CalendarDays size={18} className="text-amber-300"/><div><div className="font-semibold">Time to interview</div><div className="text-xs text-muted">Exactly this many study days.</div></div></div><div className="mt-5 grid grid-cols-3 gap-2">{[1,3,5,7,14,30].map(n=><button key={n} onClick={()=>setDays(n)} className={`focus-ring rounded-xl border px-3 py-2.5 text-sm ${days===n?"border-violet-400/40 bg-violet-400/10":"border-white/10 bg-white/[.02]"}`}>{n}d</button>)}</div><input type="number" min={1} max={60} value={days} onChange={e=>setDays(Number(e.target.value))} className="focus-ring mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none"/></Panel>
    <Panel className="p-6"><div className="flex items-center gap-3"><Upload size={18} className="text-emerald-300"/><div><div className="font-semibold">Batch entry</div><div className="text-xs text-muted">The repository also exposes the required CLI.</div></div></div><div className="mt-4 text-xs leading-5 text-muted">Use <code className="rounded bg-white/5 px-1.5 py-0.5 text-white/70">npm run evaluate -- --input cases.json --output kits.json</code> for multi-role evaluation.</div></Panel>
   </div>
  </div>
  {error&&<div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">{error}</div>}
  <div className="mt-6 flex justify-end"><Button disabled={loading||jd.trim().length<2||!url.startsWith("http")} onClick={create}>{loading?"Creating…":"Generate Interview Kit"} <ArrowRight size={16} className="ml-2 inline"/></Button></div>
 </div></main>
}
