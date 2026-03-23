const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Absolute path to the Training images folder (relative to this controllers/ dir)
const TRAINING_DIR = path.join(
  __dirname, '..', '..',
  'Attendance-system-using-Face-Recognition', 'Training images'
);

/**
 * GET /api/users
 * Returns all registered students sorted by creation date (newest first).
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    console.error('[User] getAllUsers error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * POST /api/users/add
 * Registers a new student. Email and studentId must be unique.
 */
exports.addUser = async (req, res) => {
  const uploadedFilePath = req.file?.path;
  try {
    const { name, email, studentId } = req.body;

    if (!name || !email || !studentId) {
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
      return res.status(400).json({ message: 'name, email and studentId are required' });
    }

    // If a photo was uploaded, move it to the Training images folder
    if (uploadedFilePath) {
      const dest = path.join(TRAINING_DIR, `${name.trim()}.jpg`);
      fs.mkdirSync(TRAINING_DIR, { recursive: true });
      fs.renameSync(uploadedFilePath, dest);
    }

    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      studentId: studentId.trim()
    });

    await user.save();
    return res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    // Clean up temp file on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try { fs.unlinkSync(uploadedFilePath); } catch (_) {}
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A user with this email or studentId already exists' });
    }
    console.error('[User] addUser error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * GET /api/users/:id
 * Returns a single user by MongoDB ObjectId.
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error('[User] getUserById error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * DELETE /api/users/:id
 * Removes a registered student by id.
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('[User] deleteUser error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
