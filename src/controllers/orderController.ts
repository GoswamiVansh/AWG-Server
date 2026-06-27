import { Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import { sendOrderStatusEmail } from '../utils/emailService';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      totalPrice,
    } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ message: 'No order items' });
      return;
    }

    // Verify stock for all items
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404).json({ message: `Product ${item.name} not found` });
        return;
      }
      if (product.stock < item.quantity) {
        res.status(400).json({ message: `Not enough stock for ${item.name}. Available: ${product.stock}` });
        return;
      }
    }

    // Deduct stock for all items
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    const order = await Order.create({
      user: req.user?._id,
      items,
      shippingAddress,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      totalPrice,
      orderStatus: 'pending',
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating order', error });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ user: req.user?._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching your orders' });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name email phoneNumber').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error fetching orders', error });
  }
};

// @desc    Update order status (accepted/rejected/dispatched/delivered)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'accepted', 'rejected', 'dispatched', 'delivered'];

    if (!allowed.includes(status)) {
      res.status(400).json({ message: `Invalid status. Allowed: ${allowed.join(', ')}` });
      return;
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email phoneNumber');

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Handle stock if order is rejected or un-rejected
    if (order.orderStatus !== 'rejected' && status === 'rejected') {
      // Revert stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    } else if (order.orderStatus === 'rejected' && status !== 'rejected') {
      // Deduct stock again
      // Verify first
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product && product.stock < item.quantity) {
          res.status(400).json({ message: `Cannot change status to ${status}. Not enough stock for ${item.name}. Available: ${product.stock}` });
          return;
        }
      }
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity }
        });
      }
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

    // Send email notification for accepted/dispatched/delivered
    const user = order.user as any;
    if (user && user.email && ['accepted', 'dispatched', 'delivered'].includes(status)) {
      // Fire-and-forget: don't block the response
      sendOrderStatusEmail(status, {
        orderId: order._id.toString(),
        customerName: user.name || 'Customer',
        customerEmail: user.email,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
        totalPrice: order.totalPrice,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod || 'Cash on Delivery',
      }).catch((err) => {
        console.error('Email notification error (non-blocking):', err);
      });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating order status' });
  }
};

