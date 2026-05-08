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
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", registerUser);
router.post("/login", authUser);
router.post("/logout", logoutUser);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpCode);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.get("/seed-admin", seedAdmin);

export default router;
