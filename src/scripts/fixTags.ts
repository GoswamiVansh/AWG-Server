import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Fix all tags that may have only had first hyphen replaced
const fixTags = async () => {
  try {
    if(!process.env.MONGO_URI) { process.exit(1); }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    let fixed = 0;

    for (const p of products) {
      if (p.tags && p.tags.length > 0) {
        const newTags = p.tags.map((t: string) => t.replace(/-/g, ' ').toLowerCase());
        if (JSON.stringify(newTags) !== JSON.stringify(p.tags)) {
          p.tags = newTags;
          await p.save();
          fixed++;
        }
      }
    }

    console.log(`Fixed tags on ${fixed} products.`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

fixTags();
