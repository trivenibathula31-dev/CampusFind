
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import itemRoutes from "./routes/items.js";
import uploadRoutes from "./routes/upload.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static uploads folder
app.use("/uploads", express.static("uploads"));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/upload", uploadRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "CampusFind API running" });
});

// MongoDB connection
const mongoUri = process.env.MONGO_URI?.trim();

console.log("MongoDB URI status:", {
  exists: Boolean(mongoUri),
  validStart:
    mongoUri?.startsWith("mongodb://") ||
    mongoUri?.startsWith("mongodb+srv://"),
  length: mongoUri?.length || 0
});

if (
  !mongoUri ||
  (!mongoUri.startsWith("mongodb://") &&
    !mongoUri.startsWith("mongodb+srv://"))
) {
  throw new Error(
    "Invalid or missing MONGO_URI. Check Render Environment Variables."
  );
}

// Connect database and start server
mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("MongoDB Connected");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`CampusFind server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
