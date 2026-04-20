import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  type: string;
  title?: string;
  thumbnailUrl: string;
  videoUrl?: string;  // Direct video file URL for reels playback
  externalUrl?: string; // e.g. Instagram reel link
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    type: { type: String, required: true, default: 'instagram' },
    title: { type: String },
    thumbnailUrl: { type: String, required: true },
    videoUrl: { type: String },
    externalUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IVideo>('Video', videoSchema);
