import fs from "fs/promises";
import { BatchInputSchema } from "@ai-prep/shared";
import { runPipeline } from "../generation";

function arg(name:string) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i+1] : undefined;
}

async function main() {
  const inputPath = arg("--input");
  const outputPath = arg("--output");
  if (!inputPath || !outputPath) {
    console.error("Usage: npm run evaluate -- --input <cases.json> --output <kits.json>");
    process.exit(2);
  }
  const raw = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const cases = BatchInputSchema.parse(raw);
  const results:any[] = [];
  for (const c of cases) {
    const started = Date.now();
    console.log(`\n[${c.id}] starting`);
    try {
      const kit = await runPipeline({...c, evaluation:true}, e => {
        if (e.status === "completed" || e.status === "skipped") console.log(`  ${e.status} ${e.stage}`);
      });
      results.push({id:c.id,status:"ok",kit,error:null});
      console.log(`[${c.id}] ok in ${Math.round((Date.now()-started)/1000)}s`);
    } catch (e) {
      results.push({
        id:c.id,status:"failed",kit:null,
        error:{code:"PIPELINE_FAILED",message:String((e as Error).message)}
      });
      console.error(`[${c.id}] failed:`, String((e as Error).message));
    }
  }
  await fs.writeFile(outputPath, JSON.stringify({
    version:"1.0",
    generated_at:new Date().toISOString(),
    kits:results
  }, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); });
