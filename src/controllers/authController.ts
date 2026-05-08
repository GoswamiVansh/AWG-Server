import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import User from "../models/User";
import generateToken from "../utils/generateToken";
import {
  createOtp,
  verifyOtp,
  isRateLimited,
  markEmailVerified,
  isEmailVerified,
  clearEmailVerified,
} from "../utils/otpStore";

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const authUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (
    user &&
    user.password &&
    (await bcrypt.compare(password, user.password))
  ) {
    const token = generateToken(res, user._id.toString());

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};

// @desc    Send OTP to email for verification
// @route   POST /api/users/send-otp
// @access  Public
export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "An account with this email already exists" });
      return;
    }

    // Rate limit check
    if (isRateLimited(email)) {
      res.status(429).json({ message: "Too many requests. Please try again later." });
      return;
    }

    // Generate OTP
    const code = createOtp(email);

    // Send email (or log to console in dev if email not configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#fff6f9; margin:0; padding:20px; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(232,114,154,0.12);">
  <div style="background:linear-gradient(135deg,#e8729a 0%,#c0536f 100%); padding:32px 24px; text-align:center;">
    <p style="color:rgba(255,255,255,0.85); margin:0 0 4px; font-size:11px; letter-spacing:3px; text-transform:uppercase;">✦ Art With Garima ✦</p>
    <h1 style="color:#ffffff; margin:8px 0 0; font-size:22px; letter-spacing:1px;">Verify Your Email</h1>
  </div>
  <div style="padding:32px 24px; text-align:center;">
    <p style="font-size:15px; color:#2d1b2e; margin-bottom:8px;">Hi there! 👋</p>
    <p style="font-size:14px; color:#5a4060; line-height:1.6; margin-bottom:28px;">Enter this code to verify your email address and create your Art With Garima account:</p>
    <div style="background:linear-gradient(135deg,#fff6f9,#fce4ec); border:2px dashed #e8729a; border-radius:16px; padding:24px; margin-bottom:24px;">
      <p style="font-size:36px; font-weight:800; letter-spacing:12px; color:#c0536f; margin:0; font-family:monospace;">${code}</p>
    </div>
    <p style="font-size:12px; color:#c09aaa; margin-bottom:0;">This code expires in <strong>10 minutes</strong></p>
    <p style="font-size:12px; color:#c09aaa;">If you didn't request this, please ignore this email.</p>
  </div>
  <div style="background:#2d1b2e; padding:20px; text-align:center;">
    <p style="color:#e8729a; font-weight:600; letter-spacing:2px; margin:0 0 4px; font-size:11px;">✦ ART WITH GARIMA ✦</p>
    <p style="color:rgba(255,255,255,0.5); font-size:11px; margin:0;">Handcrafted with love 💕</p>
  </div>
</div>
</body></html>`;

      await transporter.sendMail({
        from: `"Art With Garima" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `${code} — Your verification code for Art With Garima`,
        html,
      });

      console.log(`✅ OTP sent to ${email}`);
    } else {
      // Dev fallback — log code to console
      console.log(`\n🔑 [DEV] OTP for ${email}: ${code}\n`);
    }

    res.json({ message: "Verification code sent to your email" });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    res.status(500).json({ message: "Failed to send verification code" });
  }
};

// @desc    Verify OTP code
// @route   POST /api/users/verify-otp
// @access  Public
export const verifyOtpCode = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: "Email and verification code are required" });
      return;
    }

    const result = verifyOtp(email, otp);

    if (!result.valid) {
      res.status(400).json({ message: result.message });
      return;
    }

    // Mark email as verified for registration
    markEmailVerified(email);

    res.json({ message: result.message, verified: true });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Failed to verify code" });
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phoneNumber } = req.body;
    console.log("Registration attempt:", { name, email, phoneNumber });

    // Check that email was verified via OTP
    if (!isEmailVerified(email)) {
      res.status(400).json({ message: "Please verify your email before registering" });
      return;
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      console.log("Registration failed: User already exists");
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
    });

    if (user) {
      const token = generateToken(res, user._id.toString());
      console.log("Registration successful for:", email);

      // Clear the verified flag
      clearEmailVerified(email);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        token,
      });
    } else {
      console.log("Registration failed: Invalid user data (falsy user)");
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error: any) {
    console.error("Registration Exception:", error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
export const logoutUser = async (req: Request, res: Response) => {
  const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: !isDev,
    sameSite: isDev ? "lax" : "none",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response) => {
  if (req.user) {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phoneNumber: req.user.phoneNumber,
      addresses: req.user.addresses,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req: Request, res: Response) => {
  if (req.user) {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.name = req.body.name || user.name;
    // Allow empty string to clear phone number if needed, otherwise fallback to existing
    if (req.body.phoneNumber !== undefined) {
      user.phoneNumber = req.body.phoneNumber;
    }
    
    if (req.body.addresses) {
      user.addresses = req.body.addresses;
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    const token = generateToken(res, updatedUser._id.toString());

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      role: updatedUser.role,
      addresses: updatedUser.addresses,
      token,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

// @desc    Seed admin user
// @route   GET /api/users/seed-admin
// @access  Public (Temporary)
export const seedAdmin = async (req: Request, res: Response) => {
  try {
    const adminEmail = "admin@artwithgarima.com";
    const adminPassword = "Admin@123";

    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      const salt = await bcrypt.genSalt(10);
      adminExists.password = await bcrypt.hash(adminPassword, salt);
      adminExists.role = "admin";
      await adminExists.save();
      res.json({ message: "Admin user updated successfully" });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      await User.create({
        name: "Admin Garima",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      });
      res.json({ message: "Admin user created successfully" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error seeding admin", error });
  }
};
