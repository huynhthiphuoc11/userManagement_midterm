require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI ;

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB', MONGO_URI);

    // Remove fields createdAt, updatedAt and __v from all user documents if present
    const res = await User.collection.updateMany({}, { $unset: { createdAt: "", updatedAt: "", __v: "" } });
    console.log('Matched:', res.matchedCount, 'Modified:', res.modifiedCount);

    // Optionally, ensure documents only have allowed fields (username, email, password, image)
    // We'll not remove arbitrary extra fields to avoid accidental data loss; if you want that, we can run a stricter cleanup.

    process.exit(0);
  } catch (err) {
    console.error('Cleanup error', err);
    process.exit(1);
  }
}

run();
