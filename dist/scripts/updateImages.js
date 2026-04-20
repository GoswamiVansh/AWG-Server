"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Product_1 = __importDefault(require("../models/Product"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const updateImages = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('No MONGO_URI provided in .env');
            process.exit(1);
        }
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected successfully!');
        console.log('Fetching products to update images...');
        const products = await Product_1.default.find({});
        let updatedCount = 0;
        for (const product of products) {
            if (!product.images || product.images.length === 0) {
                // Assign a unique aesthetic image using picsum seeded by slug
                product.images = [`https://picsum.photos/seed/${product.slug}/500/600`];
                await product.save();
                updatedCount++;
            }
        }
        console.log(`Updated images for ${updatedCount} products successfully.`);
        process.exit(0);
    }
    catch (error) {
        console.error('Error updating images:', error);
        process.exit(1);
    }
};
updateImages();
