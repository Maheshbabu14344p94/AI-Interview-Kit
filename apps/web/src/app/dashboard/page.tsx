"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BrainCircuit, Plus, LogOut, Layers3 } from "lucide-react";
import { Button, Panel, Badge } from "@/components/ui";
import { api } from "@/lib/api";

export default function Dashboard(){
 const router=useRouter(); const [kits,setKits]=useState<any[]>([]); const [user,setUser]=useState<any>();
 useEffect(()=>{api("/auth/me").then(x=>setUser(x.user)).catch(()=>router.push("/"));api("/kits").then(x=>setKits(x.kits||[])).catch(()=>{})},[]);
 return <main className="min-h-screen glow-bg">
  <header className="sticky top-0 z-20 border-b border-white/[.06] bg-[#07080d]/80 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black"><BrainCircuit size={18}/></span><span className="font-semibold">Interview Prep Kit</span></div><div className="flex items-center gap-3"><span className="hidden text-sm text-muted sm:block">{user?.name}</span><button className="focus-ring rounded-lg p-2 text-white/45 hover:bg-white/5 hover:text-white" onClick={async()=>{await api("/auth/logout",{method:"POST"});router.push("/")}}><LogOut size={17}/></button></div></div></header>
  <div className="mx-auto max-w-7xl px-5 py-10">
   <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="text-sm text-violet-300">AI RESEARCH WORKSPACE</div><h1 className="mt-2 text-4xl font-semibold tracking-[-.04em]">Your interview, <span className="accent-gradient">decoded.</span></h1><p className="mt-3 max-w-xl text-muted">Turn a job description into a focused plan built from evidence, coverage and practice.</p></div><Button onClick={()=>router.push("/kits/new")}><Plus size={16} className="mr-2 inline"/> Create Interview Kit</Button></div>
   <div className="mt-10 grid gap-4 md:grid-cols-4">{[["Active kits",kits.length],["Questions",kits.reduce((n,k)=>n+(k.kit?.questions?.length||0),0)],["Flashcards",kits.reduce((n,k)=>n+(k.kit?.flashcards?.length||0),0)],["Practice","Ready"]].map(([a,b])=><Panel className="p-5" key={a as string}><div className="text-xs uppercase tracking-wider text-muted">{a}</div><div className="mt-3 text-3xl font-semibold">{b}</div></Panel>)}</div>
   <div className="mt-10 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Recent kits</h2><p className="text-sm text-muted">Pick up where you left off.</p></div></div>
   {!kits.length?<Panel className="mt-5 flex min-h-72 flex-col items-center justify-center p-8 text-center"><Layers3 size={28} className="text-violet-300"/><div className="mt-4 text-xl font-semibold">Your interview intelligence starts here.</div><p className="mt-2 max-w-md text-sm text-muted">Paste a JD, add the company site and watch the research pipeline build a practice-ready kit.</p><Button className="mt-6" onClick={()=>router.push("/kits/new")}>Build first kit <ArrowRight size={15} className="ml-2 inline"/></Button></Panel>
   :<div className="mt-5 grid gap-4 md:grid-cols-2">{kits.map(k=><Panel key={String(k._id)} className="p-5 hover:border-violet-400/20"><div className="flex justify-between"><Badge tone="accent">Interview kit</Badge><span className="text-xs text-muted">{new Date(k.updatedAt).toLocaleDateString()}</span></div><div className="mt-5 text-xl font-semibold">{k.kit?.source?.company||new URL(k.input?.company_url||"https://example.com").hostname}</div><div className="mt-1 text-sm text-muted">{k.kit?.role?.title||"Preparing…"}</div><div className="mt-5 grid grid-cols-3 gap-3 text-xs"><div><div className="text-muted">Questions</div><div className="mt-1 font-semibold">{k.kit?.questions?.length||0}</div></div><div><div className="text-muted">Days</div><div className="mt-1 font-semibold">{k.input?.days||"-"}</div></div><div><div className="text-muted">Coverage</div><div className="mt-1 font-semibold">{k.kit?`${Math.round((1-(k.kit.coverage.uncovered_requirement_ids.length/Math.max(1,k.kit.role.requirements.length)))*100)}%`:"—"}</div></div></div></Panel>)}</div>}
  </div>
 </main>
}
