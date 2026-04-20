"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const videoRoutes_1 = __importDefault(require("./routes/videoRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({ origin: 'http://localhost:5173', credentials: true })); // Default Vite port, allow cookies
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use('/api/users', authRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/videos', videoRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
// Create uploads folder if it doesn't exist
const uploadDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Make the uploads folder publicly accessible via static route
app.use('/uploads', express_1.default.static(uploadDir));
const User_1 = __importDefault(require("./models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
app.get('/api/seed-admin-global', async (req, res) => {
    try {
        const adminEmail = 'admin@artwithgarima.com';
        const adminPassword = 'Admin@123';
        const adminExists = await User_1.default.findOne({ email: adminEmail });
        if (adminExists) {
            const salt = await bcryptjs_1.default.genSalt(10);
            adminExists.password = await bcryptjs_1.default.hash(adminPassword, salt);
            adminExists.role = 'admin';
            await adminExists.save();
            return res.json({ message: 'Admin user updated successfully' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, salt);
        await User_1.default.create({ name: 'Admin Garima', email: adminEmail, password: hashedPassword, role: 'admin' });
        res.json({ message: 'Admin user created successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error seeding admin', error: error.message });
    }
});
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Art with Garima API is running.' });
});
// Error handling middleware
app.use(errorMiddleware_1.notFound);
app.use(errorMiddleware_1.errorHandler);
// Database connection placeholder
const connectDB = async () => {
    try {
        if (process.env.MONGO_URI) {
            await mongoose_1.default.connect(process.env.MONGO_URI);
            console.log('MongoDB Connected');
        }
        else {
            console.log('No MONGO_URI provided, skipping database connection for now.');
        }
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};
app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server running on port ${PORT}`);
    // Triggering reload again...
});
