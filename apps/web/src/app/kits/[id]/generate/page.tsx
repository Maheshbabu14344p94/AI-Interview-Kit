"use client";
import { useEffect,useState } from "react";
import { useParams,useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, Activity } from "lucide-react";
import { Panel, PipelineStage, Progress } from "@/components/ui";
import { api } from "@/lib/api";

const names=["Analyzing job description","Extracting requirements","Researching company","Discovering relevant pages","Finding hiring process","Researching interview discussions","Building company brief","Mapping role requirements","Generating technical questions","Generating behavioural questions","Generating system-design questions","Generating company-fit questions","Creating flashcards","Checking question coverage","Closing coverage gaps","Building study schedule","Validating kit","Saving interview kit"];

export default function Generate(){
 const {id}=useParams(); const router=useRouter(); const [events,setEvents]=useState<any[]>([]); const [status,setStatus]=useState("Starting pipeline"); const [error,setError]=useState("");
 useEffect(()=>{const raw=sessionStorage.getItem("generationInput");if(!raw){router.push("/kits/new");return}const input=JSON.parse(raw);let mounted=true;(async()=>{try{const r=await api(`/kits/${id}/generate`,{method:"POST",body:JSON.stringify(input)});if(mounted){setEvents(r.events||[]);setStatus("Interview intelligence ready");sessionStorage.setItem(`kit-${id}`,JSON.stringify(r.kit));setTimeout(()=>router.push(`/kits/${id}`),700)}}catch(e){if(mounted){setError(String((e as Error).message));setStatus("Generation stopped")}}})();return()=>{mounted=false}},[id]);
 const completed=new Set(events.filter(e=>e.status==="completed"||e.status==="skipped").map(e=>e.stage)); const current=events.slice().reverse().find(e=>e.status==="running")?.stage; const pct=Math.round(completed.size/names.length*100);
 return <main className="min-h-screen glow-bg grid-bg"><div className="mx-auto max-w-4xl px-5 py-10">
  <div className="flex items-center gap-3 text-sm text-muted"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black"><BrainCircuit size={18}/></span> Research engine <span className="text-white/20">/</span> Live pipeline</div>
  <div className="mt-12 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-violet-400/20 bg-violet-400/10"><Activity className="text-violet-300"/></div><h1 className="mt-6 text-4xl font-semibold tracking-[-.04em]">{status}</h1><p className="mt-3 text-muted">Every stage is connected to evidence discovered before it.</p></div>
  <Panel className="mt-10 p-5"><div className="flex justify-between text-sm"><span className="font-medium">Research intelligence</span><span className="text-muted">{pct}%</span></div><div className="mt-3"><Progress value={pct}/></div><div className="mt-3 flex justify-between text-xs text-muted"><span>{completed.size} stages completed</span><span>{events.length} events</span></div></Panel>
  {error&&<div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">{error}</div>}
  <div className="mt-5 space-y-2">{names.map(name=>{const ev=events.find(e=>e.stage===name && e.status!=="running")||events.find(e=>e.stage===name);const st=ev?.status||(current===name?"running":"pending");return <PipelineStage key={name} name={name} status={st} detail={ev?.uncovered!=null?`${ev.uncovered} requirements uncovered`:ev?.count!=null?`${ev.count} found`:""}/>})}</div>
  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-8 text-center text-xs text-white/30"><CheckCircle2 size={13} className="mr-1 inline"/> Research is bounded, failures are recorded, and the final kit is schema-validated.</motion.div>
 </div></main>
}
