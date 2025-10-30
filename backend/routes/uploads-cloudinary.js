const express = require('express');
const multer = require('multer');
const router = express.Router();
const cloudinary = require('../lib/cloudinary');
const User = require('../models/User');

// Use memory storage so we can upload buffer directly to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } }); // 8MB


async function uploadBufferToCloudinary(buffer, mimetype, folder = 'user_images') {
  const base64 = buffer.toString('base64');
  const dataUri = `data:${mimetype};base64,${base64}`;

  return cloudinary.uploader.upload(dataUri, { folder, resource_type: 'image' });
}
router.post('/user-with-image', upload.single('image'), async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    let imageUrl = '';
    if (req.file && req.file.buffer) {
      const result = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype, 'user_images');
      imageUrl = result.secure_url || result.url || '';
    }

  const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already used' });

    const user = new User({ username, email, password: hashed, image: imageUrl });
    await user.save();
    res.status(201).json({ _id: user._id, username: user.username, email: user.email, image: user.image });
  } catch (err) {
    console.error('uploads-cloudinary error', err);
    res.status(500).json({ message: err.message });
  }
});

// Update user image only (optional): multipart/form-data with file 'image'
router.post('/user/:id/image', upload.single('image'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.file && req.file.buffer) {
      const result = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype, 'user_images');
      user.image = result.secure_url || result.url || '';
      await user.save();
    }
    res.json({ _id: user._id, username: user.username, email: user.email, image: user.image });
  } catch (err) {
    console.error('uploads-cloudinary update error', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
