const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';


// LOGIN - public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    // Sign JWT
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ success: true, token, user: { _id: user._id, username: user.username, email: user.email, image: user.image || '' } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SOCIAL LOGIN - accepts provider and profile from client (for development)
// Payload example: { provider: 'google'|'facebook', email, username, image }
router.post('/social-login', async (req, res) => {
  try {
    const { provider, email, username, image } = req.body;
    if (!provider || !email) return res.status(400).json({ message: 'Missing provider or email' });

    // Find or create user by email
    let user = await User.findOne({ email });
    if (!user) {
      // Create a user with a random password (not used for social login)
      const randomPassword = Math.random().toString(36).slice(-12);
      const hashed = await bcrypt.hash(randomPassword, 10);
      user = new User({ username: username || email.split('@')[0], email, password: hashed, image: image || '' });
      await user.save();
    }

    // Sign JWT
    const token = jwt.sign({ id: user._id, email: user.email, provider }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ success: true, token, user: { _id: user._id, username: user.username, email: user.email, image: user.image || '' } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Protect remaining routes
router.use(require('../middleware/auth'));

// GET all users (hide password)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, 'username email image');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single user by id (hide password)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, 'username email image');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE user (expects JSON: { username, email, password, image })
// Protected - only allowed when authenticated
router.post('/', async (req, res) => {
  try {
    const { username, email, password, image } = req.body;
    // Debug: log whether image payload arrived (don't log full base64 to avoid huge output)
    console.log('POST /api/users - image present:', typeof image !== 'undefined' && image !== null, 'imageLength:', image ? image.length : 0);
    if (!username || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already used' });
    const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashed, image: image || '' });
  await user.save();
  // Return only allowed fields
  res.status(201).json({ _id: user._id, username: user.username, email: user.email, image: user.image || '' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE user
router.put('/:id', async (req, res) => {
  try {
    const { username, email, password, image } = req.body;
    // Debug: show update image presence
    console.log(`PUT /api/users/${req.params.id} - image present:`, typeof image !== 'undefined' && image !== null, 'imageLength:', image ? image.length : 0);
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (typeof image !== 'undefined') user.image = image;
  await user.save();
  // Return only allowed fields
  res.json({ _id: user._id, username: user.username, email: user.email, image: user.image || '' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// (login moved above - remaining routes are protected by middleware)

module.exports = router;