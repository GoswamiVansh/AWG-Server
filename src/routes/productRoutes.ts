import express from 'express';
import { getProducts, getProductById, createProduct, deleteProduct, getCategories, updateProduct } from '../controllers/productController';
// import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/categories')
  .get(getCategories);

router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

export default router;
