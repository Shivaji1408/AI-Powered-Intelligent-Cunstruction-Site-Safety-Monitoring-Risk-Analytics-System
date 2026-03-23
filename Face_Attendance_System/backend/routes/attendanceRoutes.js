const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getTodayAttendance,
  getAttendanceHistory,
  exportCSV
} = require('../controllers/attendanceController');

// Mark attendance for a recognised face (called by Python service)
router.post('/mark', markAttendance);

// Get today's attendance records + summary stats
router.get('/today', getTodayAttendance);

// Get historical records, supports ?date=YYYY-MM-DD and ?name=NAME filters
router.get('/history', getAttendanceHistory);

// Export attendance as CSV file download
router.get('/export', exportCSV);

module.exports = router;
