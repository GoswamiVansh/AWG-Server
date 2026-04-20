import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Video from '../models/Video';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedVideos = async () => {
  try {
    if(!process.env.MONGO_URI) {
      console.error('No MONGO_URI provided in .env');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully!');

    // First delete any previous to keep it fresh
    await Video.deleteMany({});

    const userIgUrl = 'https://www.instagram.com/reel/DXJdDf5j1H3/?igsh=MWNieXp3eXc3a3RiYg==';

    const videos = [
      {
        type: 'instagram',
        externalUrl: userIgUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=500&auto=format&fit=crop'
      },
      {
        type: 'instagram',
        externalUrl: userIgUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1563241527-200ecf8c92b8?q=80&w=500&auto=format&fit=crop'
      },
      {
        type: 'instagram',
        externalUrl: userIgUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=500&auto=format&fit=crop'
      },
      {
        type: 'instagram',
        externalUrl: userIgUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1456105417861-125d0c7dcfbc?q=80&w=500&auto=format&fit=crop'
      },
      {
        type: 'instagram',
        externalUrl: userIgUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1548843216-2ce9a3048bce?q=80&w=500&auto=format&fit=crop'
      }
    ];

    await Video.insertMany(videos);
    
    console.log(`Seeded ${videos.length} videos successfully with the provided Instagram link.`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding videos:', error);
    process.exit(1);
  }
};

seedVideos();
