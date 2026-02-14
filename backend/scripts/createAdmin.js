import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

const createAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI_LOCAL) {
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI_LOCAL);
    console.log('✅');

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      await mongoose.connection.close();
      process.exit(0);
    }

    const adminUsername = process.env.ADMIN_USERNAME_LOCAL;
    const adminEmail = process.env.ADMIN_EMAIL_LOCAL;
    const adminPassword = process.env.ADMIN_PASSWORD_LOCAL;
    const adminFullName = process.env.ADMIN_FULL_NAME_LOCAL;

    if (!adminPassword) {
        await mongoose.connection.close();
        process.exit(1);
    }

    const adminData = {
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      fullName: adminFullName,
      isActive: true
    };

    await User.create(adminData);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

createAdmin();

// npm run create-admin
