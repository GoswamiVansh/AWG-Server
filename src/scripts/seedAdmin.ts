import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is not defined in .env');
      return;
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected for Seeding');

    const adminEmail = 'admin@artwithgarima.com';
    const adminPassword = 'Admin@123';

    // Check if admin already exists
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log('Admin user already exists. Updating password and role...');
      const salt = await bcrypt.genSalt(10);
      adminExists.password = await bcrypt.hash(adminPassword, salt);
      adminExists.role = 'admin';
      await adminExists.save();
      console.log('Admin user updated successfully.');
    } else {
      console.log('Creating new admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      await User.create({
        name: 'Admin Garima',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Admin user created successfully.');
    }

    console.log('Admin Email:', adminEmail);
    console.log('Admin Pass:', adminPassword);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
