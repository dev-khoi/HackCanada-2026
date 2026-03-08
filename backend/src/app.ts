import express from "express";
import cors from "cors";
import listingRoutes from "./routes/listingRoutes";
import styleRoutes from "./routes/styleRoutes";
import purchaseRoutes from "./routes/purchaseRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import userRoutes from "./routes/userRoutes";
import outfitRoutes from "./routes/outfitRoutes";

const app = express();

const allowedOrigins = [
  "https://threadify.pages.dev",
  "https://hackcanada-2026-production.up.railway.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
];

const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOriginSet = new Set([...allowedOrigins, ...envOrigins]);
const allowAllOrigins =
  process.env.CORS_ALLOW_ALL === "true" || allowedOriginSet.has("*");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowAllOrigins) {
        callback(null, true);
        return;
      }

      const isPagesPreview = /^https:\/\/[a-z0-9-]+\.pages\.dev$/i.test(origin);
      if (allowedOriginSet.has(origin) || isPagesPreview) {
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
