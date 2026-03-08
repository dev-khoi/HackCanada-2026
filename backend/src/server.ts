import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDatabase } from "./config/database";

const PORT = process.env.PORT || 8000;

// Listen immediately so Railway's health check gets 200 before MongoDB connects.
// Otherwise the health check can fail and Railway stops the container.
const port = Number(PORT) || 8000;
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

// Log when Railway (or orchestrator) asks to stop the container.
// If you see "Received SIGTERM" after ~15s, a NEW deployment likely became active
// and this container is the OLD one being replaced — check the latest deployment.
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down");
  server.close(() => process.exit(0));
});
process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down");
  server.close(() => process.exit(0));
});

connectDatabase()
  .then(() => {
    // MongoDB connected; app is fully ready.
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
