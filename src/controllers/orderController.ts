import { Request, Response } from 'express';
import Order from '../models/Order';

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
    res.status(500).json({ message: 'Server error fetching orders' });
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

    const order = await Order.findById(req.params.id);

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
  } catch (error) {
    res.status(500).json({ message: 'Server error updating order status' });
  }
};
