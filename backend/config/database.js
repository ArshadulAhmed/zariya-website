import mongoose from 'mongoose';

/**
 * Get the MongoDB URI for the current environment.
 * - Production: always uses MONGODB_URI (test DB is never used in prod).
 * - Development/Test: uses MONGODB_URI_LOCAL if set, otherwise MONGODB_URI.
 * This keeps prod on a single DB and lets local/testing use a separate DB.
 */
export const getMongoUri = () => {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    return process.env.MONGODB_URI;
  }
  return process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI;
};

const connectDB = async () => {
  const uri = getMongoUri();
  if (!uri) {
    console.error('❌ No MongoDB URI: set MONGODB_URI (and optionally MONGODB_URI_LOCAL for local/test).');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const dbName = conn.connection.db?.databaseName || conn.connection.name;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}${dbName ? ` (${dbName})` : ''}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

