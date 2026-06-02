import { Request, Response } from 'express';
import CustomRequest from '../models/CustomRequest';
import { sendCustomRequestEmail } from '../utils/emailService';

// @desc    Submit a new custom request
// @route   POST /api/custom-requests
// @access  Private
export const createCustomRequest = async (req: Request, res: Response) => {
  try {
    const { quantity, material, referencePhoto, thoughts } = req.body;

    if (!quantity || !material || !thoughts) {
      return res.status(400).json({ message: 'Quantity, material, and thoughts fields are required.' });
    }

    const newRequest = new CustomRequest({
      user: req.user?._id,
      quantity: Number(quantity),
      material,
      referencePhoto,
      thoughts,
    });

    const savedRequest = await newRequest.save();

    // Trigger email notification to admin asynchronously
    if (req.user) {
      // Resolve referencePhoto full URL if it is a relative path
      let fullPhotoUrl = referencePhoto;
      if (referencePhoto && !referencePhoto.startsWith('http')) {
        const apiBase = (process.env.VITE_API_URL || 'https://awg-server.onrender.com/api').replace('/api', '');
        fullPhotoUrl = `${apiBase}${referencePhoto}`;
      }

      sendCustomRequestEmail({
        customerName: req.user.name,
        customerEmail: req.user.email,
        customerPhone: req.user.phoneNumber,
        quantity: Number(quantity),
        material,
        thoughts,
        referencePhotoUrl: fullPhotoUrl,
      }).catch(err => {
        console.error('Failed to send email notification async:', err);
      });
    }

    res.status(201).json(savedRequest);
  } catch (error) {
    console.error('Error creating custom request:', error);
    res.status(500).json({ message: 'Server error saving custom request', error });
  }
};

// @desc    Get all custom requests
// @route   GET /api/custom-requests
// @access  Private/Admin
export const getCustomRequests = async (req: Request, res: Response) => {
  try {
    const requests = await CustomRequest.find({})
      .populate('user', 'name email phoneNumber')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching custom requests:', error);
    res.status(500).json({ message: 'Server error fetching custom requests', error });
  }
};
