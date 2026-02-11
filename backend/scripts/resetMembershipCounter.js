/**
 * Reset the membership ID counter to 0 so the next created membership gets ZMID-0000001.
 * Use this after clearing test memberships if you want IDs to start from 1 again.
 *
 * Run from backend: node scripts/resetMembershipCounter.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const resetMembershipCounter = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not set');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);

    const result = await mongoose.connection.db.collection('counters').updateOne(
      { name: 'membership' },
      { $set: { sequence: 0 } },
      { upsert: true }
    );

    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      console.log('Membership counter reset to 0. Next membership will get ZMID-0000001.');
    } else {
      console.log('Membership counter was already 0 (or collection name differs).');
    }
  } catch (err) {
    console.error('Error resetting counter:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

resetMembershipCounter();
