"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, ShieldCheck, Sparkles, Search, Clock3 } from "lucide-react";
import { Button, Panel } from "@/components/ui";
import { api } from "@/lib/api";

export default function Home() {
  const router=useRouter();
  const [mode,setMode]=useState<"login"|"register">("login");
  const [email,setEmail]=useState("demo@example.com"),[password,setPassword]=useState("password123"),[name,setName]=useState("Demo User"),[error,setError]=useState("");
  async function submit(e:any){e.preventDefault();setError("");try{await api(mode==="login"?"/auth/login":"/auth/register",{method:"POST",body:JSON.stringify({email,password,name})});router.push("/dashboard")}catch(e){setError(String((e as Error).message))}}
  return <main className="glow-bg grid-bg min-h-screen">
    <div className="mx-auto flex min-h-screen max-w-6xl items-center gap-14 px-6 py-12 lg:px-10">
      <div className="hidden flex-1 lg:block">
        <div className="mb-5 flex items-center gap-2 text-sm text-white/60"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-black"><BrainCircuit size={17}/></span> AI Interview Prep Kit</div>
        <h1 className="max-w-2xl text-6xl font-semibold leading-[.98] tracking-[-.05em]">Your interview,<br/><span className="accent-gradient">decoded.</span></h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-white/55">Research the company. Extract what matters. Practice what is most likely to matter next.</p>
        <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
          {[["Research","Company intelligence",Search],["Coverage","Requirement mapped",ShieldCheck],["Practice","Weak spots first",Clock3]].map(([t,d,I]:any)=><Panel key={t} className="p-4"><I size={17} className="mb-8 text-violet-300"/><div className="font-medium">{t}</div><div className="mt-1 text-xs text-muted">{d}</div></Panel>)}
        </div>
      </div>
      <Panel className="w-full max-w-md p-7">
        <div className="mb-7 lg:hidden"><div className="flex items-center gap-2 text-sm font-semibold"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-black"><BrainCircuit size={17}/></span> AI Interview Prep Kit</div></div>
        <div className="mb-7"><div className="text-2xl font-semibold">{mode==="login"?"Welcome back":"Create your workspace"}</div><div className="mt-1 text-sm text-muted">{mode==="login"?"Continue preparing with precision.":"Build your first interview intelligence kit."}</div></div>
        <form onSubmit={submit} className="space-y-4">
          {mode==="register"&&<input className="focus-ring w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 outline-none" placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>}
          <input className="focus-ring w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 outline-none" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input className="focus-ring w-full rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 outline-none" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
          {error&&<div className="rounded-xl bg-red-400/10 p-3 text-sm text-red-300">{error}</div>}
          <Button className="w-full" type="submit">{mode==="login"?"Enter workspace":"Create account"} <ArrowRight size={16} className="ml-1 inline"/></Button>
        </form>
        <button className="mt-5 w-full text-center text-sm text-muted hover:text-white" onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"Need an account? Create one":"Already have an account? Sign in"}</button>
        <div className="mt-7 border-t border-white/[.06] pt-5 text-center text-[11px] text-white/30"><Sparkles size={13} className="mr-1 inline"/> Demo-friendly, assessment-oriented workspace</div>
      </Panel>
    </div>
  </main>
}
