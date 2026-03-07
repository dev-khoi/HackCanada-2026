import express from "express";
import cors from "cors";
import listingRoutes from "./routes/listingRoutes";
import styleRoutes from "./routes/styleRoutes";
import purchaseRoutes from "./routes/purchaseRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/api/listings", listingRoutes);
app.use("/api/style", styleRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
