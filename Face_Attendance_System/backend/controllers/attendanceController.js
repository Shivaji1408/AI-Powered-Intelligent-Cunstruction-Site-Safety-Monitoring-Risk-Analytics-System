const Attendance = require('../models/Attendance');
const User = require('../models/User');

/**
 * POST /api/attendance/mark
 * Called by the Python service when a known face is recognised.
 * Marks attendance only once per person per day.
 */
exports.markAttendance = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Valid name is required' });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const time = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

    // Prevent double-marking for the same person today
    const existing = await Attendance.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      date: today
    });

    if (existing) {
      // Still broadcast so dashboard reflects this person as present
      // even when the page was refreshed after the initial mark
      const io = req.app.get('io');
      io.emit('attendance_marked', existing.toObject());
      return res.status(200).json({
        message: 'Attendance already marked today',
        attendance: existing
      });
    }

    // Try to find a matching registered user
    const user = await User.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    const attendance = new Attendance({
      userId: user?._id || null,
      employeeId: user?.studentId || null,
      name: name.trim().toUpperCase(),
      date: today,
      time,
      status: 'Present'
    });

    await attendance.save();

    // Broadcast new attendance record to all connected dashboard clients
    const io = req.app.get('io');
    io.emit('attendance_marked', attendance.toObject());

    return res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    console.error('[Attendance] markAttendance error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * GET /api/attendance/today
 * Returns all attendance records for today plus summary stats.
 */
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.find({ date: today }).sort({ time: -1 });
    const totalUsers = await User.countDocuments();
    const presentCount = attendance.filter((a) => a.status === 'Present').length;
    const absentCount = Math.max(0, totalUsers - presentCount);

    return res.status(200).json({
      attendance,
      stats: {
        total: totalUsers,
        present: presentCount,
        absent: absentCount
      }
    });
  } catch (error) {
    console.error('[Attendance] getTodayAttendance error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * GET /api/attendance/history
 * Returns historical attendance, optionally filtered by date and/or name.
 */
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { date, name } = req.query;
    const filter = {};

    if (date) filter.date = date;
    if (name) filter.name = { $regex: new RegExp(name.trim(), 'i') };

    const attendance = await Attendance.find(filter).sort({ date: -1, time: -1 });
    return res.status(200).json(attendance);
  } catch (error) {
    console.error('[Attendance] getAttendanceHistory error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * GET /api/attendance/export
 * Streams a CSV file of attendance records filtered by an optional date.
 */
exports.exportCSV = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = date ? { date } : {};

    const attendance = await Attendance.find(filter).sort({ date: -1, time: -1 });

    const csvHeader = 'Employee ID,Employee Name,Date,Time,Status\n';
    const csvRows = attendance
      .map((a) => `${a.employeeId || 'N/A'},${a.name},${a.date},${a.time},${a.status}`)
      .join('\n');
    const csv = csvHeader + csvRows;

    const filename = date ? `attendance-${date}.csv` : 'attendance-all.csv';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('[Attendance] exportCSV error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
