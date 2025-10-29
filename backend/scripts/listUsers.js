require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/usermgmt';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to', MONGO_URI);
    const users = await User.find({}).lean();
    console.log('Users count:', users.length);
    users.forEach(u => console.log({ username: u.username, email: u.email, password: u.password ? '***' : '' }));
    process.exit(0);
  } catch (err) {
    console.error('Error', err);
    process.exit(1);
  }
}

run();
