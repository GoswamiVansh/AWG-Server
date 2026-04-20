import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const updateImages = async () => {
  try {
    if(!process.env.MONGO_URI) {
      console.error('No MONGO_URI provided in .env');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully!');

    console.log('Fetching products to update images...');
    const products = await Product.find({});
    
    let updatedCount = 0;
    for (const product of products) {
      if (!product.images || product.images.length === 0) {
        // Assign a unique aesthetic image using picsum seeded by slug
        product.images = [`https://picsum.photos/seed/${product.slug}/500/600`];
        await product.save();
        updatedCount++;
      }
    }
    
    console.log(`Updated images for ${updatedCount} products successfully.`);

    process.exit(0);
  } catch (error) {
    console.error('Error updating images:', error);
    process.exit(1);
  }
};

updateImages();
