// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
// Increase payload size limits to allow base64 image uploads from the Expo app
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Kết nối MongoDB (từ .env hoặc mặc định)
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB Connected', MONGO_URI))
  .catch(err => console.log('MongoDB Error:', err));

// Routes
app.use('/api/users', require('./routes/users'));
// Cloudinary uploads (multipart/form-data)
app.use('/api/uploads', require('./routes/uploads-cloudinary'));

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});