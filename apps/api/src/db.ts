import mongoose from "mongoose";
import { config } from "./config";

export async function connectDb() {
  if (!config.mongoUri) return false;
  try {
    await mongoose.connect(config.mongoUri);
    return true;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    return false;
  }
}
