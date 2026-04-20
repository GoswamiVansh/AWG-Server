import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import generateToken from "../utils/generateToken";

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
    generateToken(res, user._id.toString());

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, phoneNumber } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
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
    generateToken(res, user._id.toString());

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
export const logoutUser = async (req: Request, res: Response) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
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

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      role: updatedUser.role,
      addresses: updatedUser.addresses,
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
