"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const videoController_1 = require("../controllers/videoController");
// import { protect, admin } from '../middleware/authMiddleware';
const router = express_1.default.Router();
router.route('/')
    .get(videoController_1.getVideos)
    .post(videoController_1.createVideo);
router.route('/:id')
    .delete(videoController_1.deleteVideo);
exports.default = router;
