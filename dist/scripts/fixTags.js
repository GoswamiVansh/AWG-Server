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
// Fix all tags that may have only had first hyphen replaced
const fixTags = async () => {
    try {
        if (!process.env.MONGO_URI) {
            process.exit(1);
        }
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        const products = await Product_1.default.find({});
        let fixed = 0;
        for (const p of products) {
            if (p.tags && p.tags.length > 0) {
                const newTags = p.tags.map((t) => t.replace(/-/g, ' ').toLowerCase());
                if (JSON.stringify(newTags) !== JSON.stringify(p.tags)) {
                    p.tags = newTags;
                    await p.save();
                    fixed++;
                }
            }
        }
        console.log(`Fixed tags on ${fixed} products.`);
        process.exit(0);
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
};
fixTags();
