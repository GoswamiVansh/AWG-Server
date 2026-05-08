import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';

// @desc    Fetch all categories
// @route   GET /api/products/categories
// @access  Public
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error fetching categories', error });
  }
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({}).populate('category', 'name');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
} catch (error) {
    res.status(500).json({ message: 'Server error fetching product' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, price, category, stock, tags, images, isFeatured, thumbnailVideo } = req.body;

    // Handle Category conversion from string to ObjectId
    let categoryId = category;
    if (category && typeof category === 'string') {
       // Look for existing category by name
       let existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
       if (!existingCategory) {
          // Create new category if it doesn't exist
          existingCategory = await Category.create({ 
               name: category, 
               slug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
          });
       }
       categoryId = existingCategory._id;
    }

    const product = new Product({
      name: name || 'Sample name',
      slug: slug || `sample-slug-${Date.now()}`,
      description: description || 'Sample description',
      price: price || 0,
      category: categoryId, 
      stock: stock || 0,
      tags: tags || [],
      images: images || [],
      isFeatured: isFeatured || false,
      thumbnailVideo: thumbnailVideo || undefined,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error creating product', error });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: product._id });
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting product' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, price, category, stock, tags, images, isFeatured, thumbnailVideo } = req.body;
    
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let categoryId = category;
    if (category && typeof category === 'string') {
       let existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
       if (!existingCategory) {
          existingCategory = await Category.create({ 
               name: category, 
               slug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-') 
          });
       }
       categoryId = existingCategory._id;
    }

    product.name = name || product.name;
    product.slug = slug || product.slug;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = categoryId || product.category;
    product.stock = stock || product.stock;
    product.tags = tags || product.tags;
    if (images !== undefined) {
      product.images = images;
    }
    product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
    if (thumbnailVideo !== undefined) {
      product.thumbnailVideo = thumbnailVideo;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error updating product', error });
  }
};
