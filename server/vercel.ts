import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerOAuthRoutes(app);

const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});

// Support /api/trpc and /trpc mount paths on Vercel
app.use("/api/trpc", trpcMiddleware);
app.use("/trpc", trpcMiddleware);

// Dynamic fallback matching for any tRPC procedures
app.use((req, res, next) => {
  if (
    req.url.includes("auth.") ||
    req.url.includes("subjects.") ||
    req.url.includes("student.") ||
    req.url.includes("admin.") ||
    req.url.includes("guidance.") ||
    req.url.includes("cloudinary.") ||
    req.url.includes("system.")
  ) {
    return trpcMiddleware(req, res, next);
  }
  next();
});

// Error handling middleware to always return structured JSON
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Vercel API Error]", err);
  res.status(500).json({ error: err?.message || "Internal Server Error" });
});

export default function handler(req: express.Request, res: express.Response) {
  return app(req, res);
}
