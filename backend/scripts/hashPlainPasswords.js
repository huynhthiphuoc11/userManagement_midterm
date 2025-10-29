require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/usermgmt';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB', MONGO_URI);

    const users = await User.find({});
    let updated = 0;
    for (const u of users) {
      const pwd = u.password || '';
      // bcrypt hashes start with $2
      if (!pwd.startsWith('$2')) {
        console.log(`Hashing password for user ${u.email} (was plaintext)`);
        const hashed = await bcrypt.hash(pwd, 10);
        u.password = hashed;
        await u.save();
        updated++;
      }
    }

    console.log('Done. Passwords hashed:', updated);
    process.exit(0);
  } catch (err) {
    console.error('Error hashing passwords', err);
    process.exit(1);
  }
}

run();
