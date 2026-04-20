"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProduct = exports.deleteProduct = exports.createProduct = exports.getProductById = exports.getProducts = exports.getCategories = void 0;
const Product_1 = __importDefault(require("../models/Product"));
const Category_1 = __importDefault(require("../models/Category"));
// @desc    Fetch all categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const categories = await Category_1.default.find({});
        res.json(categories);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error fetching categories', error });
    }
};
exports.getCategories = getCategories;
// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const products = await Product_1.default.find({}).populate('category', 'name');
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching products' });
    }
};
exports.getProducts = getProducts;
// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product_1.default.findById(req.params.id);
        if (product) {
            res.json(product);
        }
        else {
            res.status(404).json({ message: 'Product not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching product' });
    }
};
exports.getProductById = getProductById;
// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const { name, slug, description, price, category, stock, tags, images, isFeatured } = req.body;
        // Handle Category conversion from string to ObjectId
        let categoryId = category;
        if (category && typeof category === 'string') {
            // Look for existing category by name
            let existingCategory = await Category_1.default.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
            if (!existingCategory) {
                // Create new category if it doesn't exist
                existingCategory = await Category_1.default.create({
                    name: category,
                    slug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                });
            }
            categoryId = existingCategory._id;
        }
        const product = new Product_1.default({
            name: name || 'Sample name',
            slug: slug || `sample-slug-${Date.now()}`,
            description: description || 'Sample description',
            price: price || 0,
            category: categoryId,
            stock: stock || 0,
            tags: tags || [],
            images: images || [],
            isFeatured: isFeatured || false,
        });
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    }
    catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error creating product', error });
    }
};
exports.createProduct = createProduct;
// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product_1.default.findById(req.params.id);
        if (product) {
            await Product_1.default.deleteOne({ _id: product._id });
            res.json({ message: 'Product removed' });
        }
        else {
            res.status(404).json({ message: 'Product not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error deleting product' });
    }
};
exports.deleteProduct = deleteProduct;
// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const { name, slug, description, price, category, stock, tags, images, isFeatured } = req.body;
        const product = await Product_1.default.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        let categoryId = category;
        if (category && typeof category === 'string') {
            let existingCategory = await Category_1.default.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
            if (!existingCategory) {
                existingCategory = await Category_1.default.create({
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
        product.images = images || product.images;
        product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
        const updatedProduct = await product.save();
        res.json(updatedProduct);
    }
    catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Server error updating product', error });
    }
};
exports.updateProduct = updateProduct;
