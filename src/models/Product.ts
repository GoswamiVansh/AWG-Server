import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  category: mongoose.Types.ObjectId;
  images: string[];
  stock: number;
  tags: string[];
  isFeatured: boolean;
  thumbnailVideo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    images: [{ type: String }],
    stock: { type: Number, required: true, default: 0 },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    thumbnailVideo: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', productSchema);
