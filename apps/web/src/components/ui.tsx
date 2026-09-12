"use client";
import { motion } from "framer-motion";
import { Loader2, Check, AlertTriangle, Sparkles, ArrowRight, Plus, X } from "lucide-react";

export function Button({children,variant="primary",className="",...props}:any) {
  return <button className={`focus-ring rounded-xl px-4 py-2.5 text-sm font-semibold transition ${variant==="primary"?"bg-white text-black hover:bg-white/90":"border border-white/10 bg-white/[.04] hover:bg-white/[.08]"} ${className}`} {...props}>{children}</button>
}
export function Badge({children,tone="neutral"}:{children:React.ReactNode;tone?:string}) {
  const c:any={neutral:"bg-white/5 text-white/65",good:"bg-emerald-400/10 text-emerald-300",warn:"bg-amber-400/10 text-amber-300",danger:"bg-red-400/10 text-red-300",accent:"bg-violet-400/10 text-violet-300"};
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${c[tone]||c.neutral}`}>{children}</span>
}
export function Panel({children,className=""}:{children:React.ReactNode;className?:string}) {
  return <div className={`panel rounded-2xl ${className}`}>{children}</div>
}
export function Progress({value}:{value:number}) {
  return <div className="h-2 overflow-hidden rounded-full bg-white/5"><motion.div initial={{width:0}} animate={{width:`${Math.max(0,Math.min(100,value))}%`}} transition={{duration:.7}} className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300"/></div>
}
export function PipelineStage({name,status,detail}:{name:string;status:string;detail?:string}) {
  const icon=status==="completed"?<Check size={15}/>:status==="running"?<Loader2 size={15} className="animate-spin"/>:status==="failed"?<AlertTriangle size={15}/>:<span className="h-1.5 w-1.5 rounded-full bg-white/20"/>;
  return <motion.div layout className={`flex items-center gap-3 rounded-xl border p-3 ${status==="running"?"border-violet-400/30 bg-violet-400/[.06]":"border-white/[.06] bg-white/[.015]"}`}>
    <div className={`grid h-7 w-7 place-items-center rounded-lg ${status==="completed"?"bg-emerald-400/10 text-emerald-300":status==="failed"?"bg-red-400/10 text-red-300":"bg-white/5 text-white/60"}`}>{icon}</div>
    <div className="min-w-0 flex-1"><div className="text-sm font-medium">{name}</div>{detail&&<div className="mt-0.5 text-xs text-muted">{detail}</div>}</div>
    <span className="text-[10px] uppercase tracking-wider text-white/35">{status}</span>
  </motion.div>
}
