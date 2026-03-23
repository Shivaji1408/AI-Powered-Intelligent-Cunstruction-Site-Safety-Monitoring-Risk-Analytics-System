const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

/**
 * Schedules a daily cron job that runs at 23:59 every night.
 * For every registered user who has no 'Present' record today,
 * it inserts an 'Absent' record so the attendance report is complete.
 */
const scheduleDailyReset = (io) => {
  // Cron expression: minute=59, hour=23, every day
  cron.schedule('59 23 * * *', async () => {
    console.log('[Cron] Running daily attendance finalisation...');
    try {
      const today = new Date().toISOString().split('T')[0];

      const allUsers = await User.find();
      const todayPresent = await Attendance.find({ date: today, status: 'Present' });
      const presentNames = new Set(todayPresent.map((a) => a.name.toLowerCase()));

      const absentUsers = allUsers.filter((u) => !presentNames.has(u.name.toLowerCase()));

      // Build bulk insert operations to avoid individual await per user
      const absentDocs = absentUsers.map((user) => ({
        userId: user._id,
        name: user.name.toUpperCase(),
        date: today,
        time: '23:59:59',
        status: 'Absent'
      }));

      if (absentDocs.length > 0) {
        // ordered:false to skip duplicates silently (unique index may fire)
        await Attendance.insertMany(absentDocs, { ordered: false }).catch(() => {});
      }

      console.log(`[Cron] Marked ${absentDocs.length} student(s) as Absent for ${today}`);

      if (io) {
        io.emit('daily_reset', { date: today, absentCount: absentDocs.length });
      }
    } catch (err) {
      console.error('[Cron] Daily finalisation error:', err.message);
    }
  });

  console.log('[Cron] Daily attendance reset scheduled at 23:59 each night');
};

module.exports = { scheduleDailyReset };
