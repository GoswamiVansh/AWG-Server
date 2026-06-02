import express from "express";
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  seedAdmin,
  sendOtp,
  verifyOtpCode,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", registerUser);
router.post("/login", authUser);
router.post("/logout", logoutUser);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpCode);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.get("/seed-admin", seedAdmin);

export default router;
