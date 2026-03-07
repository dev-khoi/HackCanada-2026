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
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
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

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
