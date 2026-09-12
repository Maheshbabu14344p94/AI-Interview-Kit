import express from "express";
import cookieParser from "cookie-parser";
import { auth, login, logout, register, setSession } from "./auth";
import { KitModel } from "./models";
import { fingerprint } from "./utils";
import { runPipeline } from "./generation";
import { validateKit } from "@ai-prep/shared";
import { calculateCoverage } from "./coverage";

export const router = express.Router();
router.use(cookieParser());

router.post("/auth/register", async (req,res) => {
  try {
    const result = await register(req.body.email, req.body.password, req.body.name);
    setSession(res, result.token); res.json({ user: result.user });
  } catch (e) { res.status(400).json({ error: String((e as Error).message) }); }
});
router.post("/auth/login", async (req,res) => {
  try {
    const result = await login(req.body.email, req.body.password);
    setSession(res, result.token); res.json({ user: result.user });
  } catch (e) { res.status(401).json({ error: String((e as Error).message) }); }
});
router.post("/auth/logout", (req,res) => { logout(req,res); res.json({ok:true}); });
router.get("/auth/me", auth, (req,res) => res.json({ user: { id:(req as any).userId } }));

router.get("/kits", auth, async (req,res) => {
  if (!process.env.MONGODB_URI) return res.json({ kits: [] });
  const kits = await KitModel.find({ ownerId:(req as any).userId }).sort({updatedAt:-1}).lean();
  res.json({ kits });
});

router.post("/kits", auth, async (req,res) => {
  const { jd, company_url, days } = req.body;
  if (typeof jd !== "string" || jd.trim().length < 2) return res.status(400).json({error:"Job description is required"});
  if (!Number.isInteger(days) || days < 1 || days > 60) return res.status(400).json({error:"Days must be an integer from 1 to 60"});
  const fp = fingerprint(jd, company_url);
  if (process.env.MONGODB_URI) {
    const existing = await KitModel.findOne({ownerId:(req as any).userId, "input.fingerprint":fp});
    if (existing) return res.json({ id:String(existing._id), duplicate:true });
    const doc = await KitModel.create({ownerId:(req as any).userId,input:{jd,company_url,days,fingerprint:fp},generation:{status:"queued"}});
    return res.json({id:String(doc._id)});
  }
  return res.json({id:fp.slice(0,24)});
});

router.post("/kits/:id/generate", auth, async (req,res) => {
  const { jd, company_url, days } = req.body;
  const events: any[] = [];
  try {
    const kit = await runPipeline({jd,company_url,days}, e => events.push(e));
    if (process.env.MONGODB_URI) await KitModel.findOneAndUpdate(
      {_id:req.params.id,ownerId:(req as any).userId},
      {$set:{kit,generation:{status:"completed",events},updatedAt:new Date()}},
      {new:true}
    );
    res.json({kit,events});
  } catch (e) {
    res.status(502).json({error:"GENERATION_FAILED",message:String((e as Error).message),events});
  }
});

router.get("/kits/:id", auth, async (req,res) => {
  if (!process.env.MONGODB_URI) return res.status(404).json({error:"NOT_FOUND"});
  const kit = await KitModel.findOne({_id:req.params.id,ownerId:(req as any).userId}).lean();
  if (!kit) return res.status(404).json({error:"NOT_FOUND"});
  res.json(kit);
});

router.patch("/kits/:id", auth, async (req,res) => {
  if (!process.env.MONGODB_URI) return res.json({ok:true});
  const updated = await KitModel.findOneAndUpdate(
    {_id:req.params.id,ownerId:(req as any).userId},
    {$set:{kit:validateKit(req.body.kit),updatedAt:new Date()}},
    {new:true}
  ).lean();
  if (!updated) return res.status(404).json({error:"NOT_FOUND"});
  res.json(updated);
});

router.get("/kits/:id/coverage", auth, async (req,res) => {
  if (!process.env.MONGODB_URI) return res.status(404).json({error:"NOT_FOUND"});
  const doc:any = await KitModel.findOne({_id:req.params.id,ownerId:(req as any).userId}).lean();
  if (!doc) return res.status(404).json({error:"NOT_FOUND"});
  res.json(calculateCoverage(doc.kit.role.requirements, doc.kit.questions));
});

router.get("/health", (_req,res) => res.json({ok:true, service:"ai-interview-prep-kit-api"}));
