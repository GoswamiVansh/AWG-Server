import express from 'express';
import { getProducts, getProductById, createProduct, deleteProduct, getCategories, updateProduct, createCategory, deleteCategory, updateCategory } from '../controllers/productController';
// import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/categories')
  .get(getCategories)
  .post(createCategory);

router.route('/categories/:id')
  .put(updateCategory)
  .delete(deleteCategory);

router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

export default router;
