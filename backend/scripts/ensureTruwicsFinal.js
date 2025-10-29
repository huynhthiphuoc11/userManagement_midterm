require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/usermgmt';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to', MONGO_URI);

    const username = 'truwics';
    const email = 'truwics@example.com';
    const rawPassword = 'truwics123';

    let user = await User.findOne({ email });
    if (user) {
      console.log('User exists, updating password and username if needed');
      user.username = username;
      user.password = await bcrypt.hash(rawPassword, 10);
      await user.save();
      console.log('Updated user:', { username: user.username, email: user.email });
      process.exit(0);
    }

    const hashed = await bcrypt.hash(rawPassword, 10);
    user = new User({ username, email, password: hashed, image: '' });
    await user.save();
    console.log('Created user:', { username: user.username, email: user.email });
    console.log('Password (plaintext for login):', rawPassword);
    process.exit(0);
  } catch (err) {
    console.error('Error', err);
    process.exit(1);
  }
}

run();
