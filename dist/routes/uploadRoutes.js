"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uploadMiddleware_1 = __importDefault(require("../middleware/uploadMiddleware"));
// import { protect, admin } from '../middleware/authMiddleware';
const router = express_1.default.Router();
// Upload a single file (e.g. video thumbnail)
router.post('/', uploadMiddleware_1.default.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    // Return the path so frontend can save it to DB
    res.json({ url: `/uploads/${req.file.filename}` });
});
// Upload multiple files (e.g. product gallery)
router.post('/multiple', uploadMiddleware_1.default.array('images', 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }
    // Return the paths array
    const urls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ urls });
});
exports.default = router;
