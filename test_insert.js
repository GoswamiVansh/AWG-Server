const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Video = mongoose.model('Video', new mongoose.Schema({
    type: { type: String, required: true, default: 'instagram' },
    title: { type: String },
    thumbnailUrl: { type: String, required: true },
    videoUrl: { type: String },
    externalUrl: { type: String },
  },
  { timestamps: true }
));

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const video = new Video({
    type: 'local',
    title: 'Art with Garima Banner Video',
    thumbnailUrl: 'http://localhost:5000/uploads/banner-video.mp4',
    videoUrl: 'http://localhost:5000/uploads/banner-video.mp4',
  });
  await video.save();
  console.log('Inserted:', video);
  process.exit(0);
}
run().catch(console.error);
