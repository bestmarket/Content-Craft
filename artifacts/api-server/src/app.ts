import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import http from "http";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

// Resolve workspace root regardless of cwd (works in both pnpm dev and production)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// dist/index.mjs lives at artifacts/api-server/dist/ → go up 3 levels to workspace root
const WORKSPACE_ROOT = path.resolve(__dirname, "../../..");

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// In production set ALLOWED_ORIGINS to a comma-separated list of allowed
// domains (e.g. "https://viralcraft.vercel.app,https://viralcraft.com").
// When unset every origin is allowed, which is fine for local development.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : null;
app.use(
  cors({
    origin: allowedOrigins ?? true,
    credentials: true,
  }),
);
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve built frontend if it exists (works in both dev and production)
const staticDir = path.resolve(WORKSPACE_ROOT, "public");
if (fs.existsSync(path.join(staticDir, "index.html"))) {
  app.use(express.static(staticDir, { maxAge: "0" }));
  app.get(/(.*)/, (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
  logger.info({ staticDir }, "Serving static frontend from dist");
} else {
  // Fall back to proxying to the Vite dev server on port 5173
  const VITE_PORT = 5173;
  app.use((req, res) => {
    const options = {
      hostname: "localhost",
      port: VITE_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${VITE_PORT}` },
    };
    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });
    proxy.on("error", () => {
      res.status(503).send("Frontend starting up — please refresh in a moment.");
    });
    req.pipe(proxy, { end: true });
  });
  logger.info({ vitePort: VITE_PORT }, "Dev mode: proxying frontend requests to Vite");
}

export default app;
export { runSeed } from "./seed";
