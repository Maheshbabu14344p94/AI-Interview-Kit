import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { connectDb } from "./db";
import { router } from "./routes";

const app = express();
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use("/api", router);
app.use((err:any,_req:any,res:any,_next:any) => {
  console.error(err);
  res.status(500).json({error:"INTERNAL_ERROR",message:"Unexpected server error"});
});

connectDb().then(() => {
  app.listen(config.port, () => console.log(`API listening on ${config.port}`));
});
