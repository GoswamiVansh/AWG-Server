"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = exports.updateUserProfile = exports.getUserProfile = exports.logoutUser = exports.registerUser = exports.authUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const generateToken_1 = __importDefault(require("../utils/generateToken"));
// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.default.findOne({ email });
    if (user &&
        user.password &&
        (await bcryptjs_1.default.compare(password, user.password))) {
        (0, generateToken_1.default)(res, user._id.toString());
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    }
    else {
        res.status(401).json({ message: "Invalid email or password" });
    }
};
exports.authUser = authUser;
// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, phoneNumber } = req.body;
    const userExists = await User_1.default.findOne({ email });
    if (userExists) {
        res.status(400).json({ message: "User already exists" });
        return;
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(password, salt);
    const user = await User_1.default.create({
        name,
        email,
        phoneNumber,
        password: hashedPassword,
    });
    if (user) {
        (0, generateToken_1.default)(res, user._id.toString());
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
        });
    }
    else {
        res.status(400).json({ message: "Invalid user data" });
    }
};
exports.registerUser = registerUser;
// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = async (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
};
exports.logoutUser = logoutUser;
// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    if (req.user) {
        res.json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            phoneNumber: req.user.phoneNumber,
            addresses: req.user.addresses,
        });
    }
    else {
        res.status(404).json({ message: "User not found" });
    }
};
exports.getUserProfile = getUserProfile;
// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    if (req.user) {
        const user = await User_1.default.findById(req.user._id);
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
            const salt = await bcryptjs_1.default.genSalt(10);
            user.password = await bcryptjs_1.default.hash(req.body.password, salt);
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
    }
    else {
        res.status(404).json({ message: "User not found" });
    }
};
exports.updateUserProfile = updateUserProfile;
// @desc    Seed admin user
// @route   GET /api/users/seed-admin
// @access  Public (Temporary)
const seedAdmin = async (req, res) => {
    try {
        const adminEmail = "admin@artwithgarima.com";
        const adminPassword = "Admin@123";
        const adminExists = await User_1.default.findOne({ email: adminEmail });
        if (adminExists) {
            const salt = await bcryptjs_1.default.genSalt(10);
            adminExists.password = await bcryptjs_1.default.hash(adminPassword, salt);
            adminExists.role = "admin";
            await adminExists.save();
            res.json({ message: "Admin user updated successfully" });
        }
        else {
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(adminPassword, salt);
            await User_1.default.create({
                name: "Admin Garima",
                email: adminEmail,
                password: hashedPassword,
                role: "admin",
            });
            res.json({ message: "Admin user created successfully" });
        }
    }
    catch (error) {
        res.status(500).json({ message: "Error seeding admin", error });
    }
};
exports.seedAdmin = seedAdmin;
