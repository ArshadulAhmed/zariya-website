import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { cleanupOrphanedImages, findIncompleteMemberships } from '../utils/cleanup.utils.js';

dotenv.config();

const cleanup = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is required');
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const olderThanHours = parseInt(args.find(arg => arg.startsWith('--older-than='))?.split('=')[1]) || 24;

    console.log(`\n🧹 Starting cleanup process...`);
    console.log(`   Mode: ${dryRun ? 'DRY RUN (no deletions)' : 'LIVE (will delete)'}`);
    console.log(`   Age threshold: ${olderThanHours} hours\n`);

    // Cleanup orphaned images
    const result = await cleanupOrphanedImages(olderThanHours, dryRun);
    console.log('\n📊 Cleanup Results:');
    console.log(JSON.stringify(result, null, 2));

    // Find incomplete memberships
    console.log('\n🔍 Checking for incomplete memberships...');
    const incomplete = await findIncompleteMemberships();
    if (incomplete.length > 0) {
      console.log(`\n⚠️  Found ${incomplete.length} memberships with incomplete image uploads:`);
      incomplete.forEach(m => {
        console.log(`   - ${m.userId} (${m.fullName}): Missing ${m.missingImages.join(', ')}`);
      });
    } else {
      console.log('✅ All memberships have complete image uploads');
    }

    await mongoose.connection.close();
    console.log('\n✅ Cleanup process completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

cleanup();

