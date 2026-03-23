const mongoose = require('mongoose');

/**
 * Attendance schema — one record per user per day.
 * A compound unique index on (name, date) prevents duplicate entries.
 */
const attendanceSchema = new mongoose.Schema({
  // Reference to the registered user (optional; name-based lookup also used)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Denormalised employee ID so CSV export & socket events don't need a populate
  employeeId: {
    type: String,
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String, // stored as 'YYYY-MM-DD' for easy daily queries
    required: true
  },
  time: {
    type: String, // stored as 'HH:MM:SS'
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    default: 'Present'
  }
});

// Prevent duplicate attendance for the same person on the same day
attendanceSchema.index({ name: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
