import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  sequence: {
    type: Number,
    default: 0
  }
}, {
  timestamps: false
});

// Ensure index on name for fast lookups
counterSchema.index({ name: 1 }, { unique: true });

// Check if model already exists to avoid re-compilation
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

/**
 * Get and increment a counter atomically
 * @param {string} counterName - Name of the counter (e.g., 'membership-20251228')
 * @returns {Promise<number>} - The next sequence number
 */
export const getNextSequence = async (counterName) => {
  const result = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { sequence: 1 } },
    { 
      new: true, 
      upsert: true, // Create if doesn't exist
      setDefaultsOnInsert: true 
    }
  );
  
  if (!result) {
    throw new Error(`Failed to get sequence for counter: ${counterName}`);
  }
  
  return result.sequence;
};

export default Counter;

