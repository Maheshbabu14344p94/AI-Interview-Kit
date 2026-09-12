import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || "",
  sessionSecret: process.env.SESSION_SECRET || "dev-only-change-me",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  llmBaseUrl: process.env.LLM_BASE_URL || "",
  llmApiKey: process.env.LLM_API_KEY || "",
  llmModel: process.env.LLM_MODEL || "",
  searchApiUrl: process.env.SEARCH_API_URL || "",
  searchApiKey: process.env.SEARCH_API_KEY || "",
  evaluationAllowedHosts: (process.env.EVALUATION_ALLOWED_HOSTS || "")
    .split(",").map(s => s.trim()).filter(Boolean)
};
