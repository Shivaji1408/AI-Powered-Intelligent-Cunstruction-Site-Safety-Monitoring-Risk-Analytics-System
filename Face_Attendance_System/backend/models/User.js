const mongoose = require('mongoose');

/**
 * User schema representing a registered student with a known face.
 * faceEncoding is stored as an array of floats (128-dimensional vector
 * produced by the face_recognition library) for reference / future use.
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // Optional: 128-d face encoding stored for reference
  faceEncoding: {
    type: [Number],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
