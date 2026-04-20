"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const path_1 = __importDefault(require("path"));
// Load env vars
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const seedAdmin = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('MONGO_URI is not defined in .env');
            return;
        }
        await mongoose_1.default.connect(mongoUri);
        console.log('MongoDB Connected for Seeding');
        const adminEmail = 'admin@artwithgarima.com';
        const adminPassword = 'Admin@123';
        // Check if admin already exists
        const adminExists = await User_1.default.findOne({ email: adminEmail });
        if (adminExists) {
            console.log('Admin user already exists. Updating password and role...');
            const salt = await bcryptjs_1.default.genSalt(10);
            adminExists.password = await bcryptjs_1.default.hash(adminPassword, salt);
            adminExists.role = 'admin';
            await adminExists.save();
            console.log('Admin user updated successfully.');
        }
        else {
            console.log('Creating new admin user...');
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedPassword = await bcryptjs_1.default.hash(adminPassword, salt);
            await User_1.default.create({
                name: 'Admin Garima',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
            });
            console.log('Admin user created successfully.');
        }
        console.log('Admin Email:', adminEmail);
        console.log('Admin Pass:', adminPassword);
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};
seedAdmin();
