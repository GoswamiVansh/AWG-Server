import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomRequest extends Document {
  user: mongoose.Types.ObjectId;
  quantity: number;
  material: string;
  referencePhoto?: string;
  thoughts: string;
  createdAt: Date;
  updatedAt: Date;
}

const customRequestSchema = new Schema<ICustomRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quantity: { type: Number, required: true },
    material: { type: String, required: true },
    referencePhoto: { type: String },
    thoughts: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICustomRequest>('CustomRequest', customRequestSchema);
