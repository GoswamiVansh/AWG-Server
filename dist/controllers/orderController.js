"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getOrders = exports.getMyOrders = exports.createOrder = void 0;
const Order_1 = __importDefault(require("../models/Order"));
// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, totalPrice, } = req.body;
        if (!items || items.length === 0) {
            res.status(400).json({ message: 'No order items' });
            return;
        }
        const order = await Order_1.default.create({
            user: req.user?._id,
            items,
            shippingAddress,
            paymentMethod: paymentMethod || 'Cash on Delivery',
            totalPrice,
            orderStatus: 'pending',
        });
        res.status(201).json(order);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error creating order', error });
    }
};
exports.createOrder = createOrder;
// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order_1.default.find({ user: req.user?._id }).sort({ createdAt: -1 });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching your orders' });
    }
};
exports.getMyOrders = getMyOrders;
// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    try {
        const orders = await Order_1.default.find({}).populate('user', 'id name email phoneNumber').sort({ createdAt: -1 });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching orders' });
    }
};
exports.getOrders = getOrders;
// @desc    Update order status (accepted/rejected/dispatched/delivered)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['pending', 'accepted', 'rejected', 'dispatched', 'delivered'];
        if (!allowed.includes(status)) {
            res.status(400).json({ message: `Invalid status. Allowed: ${allowed.join(', ')}` });
            return;
        }
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }
        order.orderStatus = status;
        // Auto-set delivery fields when status is 'delivered'
        if (status === 'delivered') {
            order.isDelivered = true;
            order.deliveredAt = new Date();
        }
        // Mark as paid when accepted (COD confirmation)
        if (status === 'accepted') {
            order.isPaid = false; // COD — not paid yet
        }
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error updating order status' });
    }
};
exports.updateOrderStatus = updateOrderStatus;
