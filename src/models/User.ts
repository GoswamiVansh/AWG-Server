import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  whatsappOptIn?: boolean;
  password?: string;
  role: 'user' | 'admin';
  addresses: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }[];
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: false },
    whatsappNumber: { type: String, required: true },
    whatsappOptIn: { type: Boolean, required: true, default: false },
    password: { type: String, required: false }, // Optional for OAuth
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    addresses: [
      {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String },
      },
    ],
    refreshToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
