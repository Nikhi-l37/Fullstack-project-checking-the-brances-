// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: 'http://127.0.0.1:5500' 
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Connect to MongoDB
const uri = process.env.MONGO_URI;
const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected!');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};
connectDB();

// Routes
app.use('/api/auth', authRoutes);

// Protect this route — only logged in users can get the list
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    // Optional: exclude password field
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// (Optional) allow creating user via admin endpoint if you still want
app.post('/api/users', async (req, res) => {
  // For demonstration: create user with password (not protected)
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashed });
    res.status(201).json({ message: 'User added', user: { id: newUser._id, name: newUser.name, email: newUser.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// serve static index if you placed index.html in backend/public
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
