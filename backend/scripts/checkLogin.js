require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/usermgmt';
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/checkLogin.js <email> <password>');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to', MONGO_URI);
    const user = await User.findOne({ email }).lean();
    if (!user) {
      console.log('User not found:', email);
      process.exit(0);
    }
    console.log('User found:', { username: user.username, email: user.email });
    console.log('Stored password field:', user.password);
    const ok = await bcrypt.compare(password, user.password || '');
    console.log('bcrypt.compare result:', ok);
    process.exit(0);
  } catch (err) {
    console.error('Error', err);
    process.exit(1);
  }
}

run();
