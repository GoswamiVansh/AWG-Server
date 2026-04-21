import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import videoRoutes from "./routes/videoRoutes";
import orderRoutes from "./routes/orderRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import { notFound, errorHandler } from "./middleware/errorMiddleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/users", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);

// Create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Make the uploads folder publicly accessible via static route
app.use("/uploads", express.static(uploadDir));

import User from "./models/User";
import bcrypt from "bcryptjs";

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

app.get("/api/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "OK", message: "Art with Garima API is running." });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection placeholder
const connectDB = async () => {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB Connected");
    } else {
      console.log(
        "No MONGO_URI provided, skipping database connection for now.",
      );
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
  // Triggering reload again...
});
