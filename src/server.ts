import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";

import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import videoRoutes from "./routes/videoRoutes";
import orderRoutes from "./routes/orderRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import customRequestRoutes from "./routes/customRequestRoutes";
import { notFound, errorHandler } from "./middleware/errorMiddleware";
import User from "./models/User";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ── CORS ────────────────────────────────────────────────────────────────
 * Pattern-based origin validation instead of a hardcoded list.
 * This automatically allows every new Vercel preview URL without
 * requiring a server redeployment each time.
 * ──────────────────────────────────────────────────────────────────────── */
const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  // Production domain
  /^https:\/\/(www\.)?artwithgarima\.in$/,
  // Render server itself (server-to-server)
  /^https:\/\/awg-server\.onrender\.com$/,
  // Allow any Vercel preview/production URL
  /^https:\/\/.*\.vercel\.app$/,
  // Local development
  /^http:\/\/localhost:\d+$/,
];

const isOriginAllowed = (origin: string): boolean =>
  ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests (no Origin header)
    if (!origin) return callback(null, true);

    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ── API Routes ─────────────────────────────────────────────────────── */
app.use("/api/users", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/custom-requests", customRequestRoutes);

/* ── Static Uploads ─────────────────────────────────────────────────── */
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

/* ── Admin Seed Route ───────────────────────────────────────────────── */
app.get("/api/seed-admin-global", async (req: Request, res: Response) => {
  try {
    const adminEmail = "admin@artwithgarima.com";
    const adminPassword = "Admin@123";
    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      const salt = await bcrypt.genSalt(10);
      adminExists.password = await bcrypt.hash(adminPassword, salt);
      adminExists.role = "admin";
      await adminExists.save();
      return res.json({ message: "Admin user updated successfully" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    await User.create({
      name: "Admin Garima",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });
    res.json({ message: "Admin user created successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error seeding admin", error: error.message });
  }
});

/* ── Health Check ───────────────────────────────────────────────────── */
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    message: "Art with Garima API is running.",
    dbState: mongoose.connection.readyState, // 0=disconnected 1=connected 2=connecting 3=disconnecting
  });
});

/* ── Error Middleware ───────────────────────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

/* ── Database Connection ────────────────────────────────────────────── */
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("[DB] MONGO_URI env var is not set — cannot connect to MongoDB!");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[DB] MongoDB Connected");
  } catch (error) {
    console.error("[DB] Connection failed:", error);
    process.exit(1);
  }
};

/* ── Start Server ───────────────────────────────────────────────────── */
app.listen(PORT, async () => {
  console.log(`[Server] Running on port ${PORT}`);
  await connectDB();
});
