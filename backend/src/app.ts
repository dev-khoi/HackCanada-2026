import express from "express";
import cors from "cors";
import listingRoutes from "./routes/listingRoutes";
import styleRoutes from "./routes/styleRoutes";
import purchaseRoutes from "./routes/purchaseRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import userRoutes from "./routes/userRoutes";
import outfitRoutes from "./routes/outfitRoutes";
import locationRoutes from "./routes/locationRoutes";

const app = express();

const allowedOrigins = [
  "https://threadify.pages.dev",
  "https://hackcanada-2026-production.up.railway.app",
  "https://hackcanada-2026.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
];

const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOriginSet = new Set([...allowedOrigins, ...envOrigins]);
// Allow any origin (echo back request Origin) — use if you still see CORS blocked despite correct origins
const allowAllOrigins =
  process.env.CORS_ALLOW_ALL === "true" || allowedOriginSet.has("*");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      // Normalize: trim and strip trailing slash so "https://threadify.pages.dev/" matches
      const o = origin.trim().replace(/\/+$/, "");

      if (allowAllOrigins) {
        callback(null, true);
        return;
      }

      const isPagesPreview = /^https:\/\/[a-z0-9-]+\.pages\.dev$/i.test(o);
      const isRender = /^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(o);
      if (allowedOriginSet.has(o) || allowedOriginSet.has(origin) || isPagesPreview || isRender) {
        callback(null, true);
        return;
      }

      // Do not throw here; throwing can surface as gateway errors on some hosts.
      callback(null, false);
    },
  }),
);
app.use(express.json({ limit: "50mb" }));

app.use("/api/listings", listingRoutes);
app.use("/api/style", styleRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/outfit", outfitRoutes);
app.use("/api/location", locationRoutes);

app.get("/", (_req, res) => {
  res.status(200).send("ok");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
