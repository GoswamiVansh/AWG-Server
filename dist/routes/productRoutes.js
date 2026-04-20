"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("../controllers/productController");
// import { protect, admin } from '../middleware/authMiddleware';
const router = express_1.default.Router();
router.route('/categories')
    .get(productController_1.getCategories);
router.route('/')
    .get(productController_1.getProducts)
    .post(productController_1.createProduct);
router.route('/:id')
    .get(productController_1.getProductById)
    .put(productController_1.updateProduct)
    .delete(productController_1.deleteProduct);
exports.default = router;
