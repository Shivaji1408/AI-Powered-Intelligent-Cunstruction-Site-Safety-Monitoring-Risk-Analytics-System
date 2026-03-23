import axios from 'axios';

// In development Vite proxies /api → http://localhost:5000
const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// ─── Attendance ──────────────────────────────────────────────────────────────

/** POST /api/attendance/mark  — mark a face as present */
export const markAttendance = (name) =>
  API.post('/attendance/mark', { name });

/** GET /api/attendance/today  — today's records + stats */
export const getTodayAttendance = () =>
  API.get('/attendance/today');

/**
 * GET /api/attendance/history
 * Optional query params: { date: 'YYYY-MM-DD', name: 'partial-name' }
 */
export const getAttendanceHistory = (params = {}) =>
  API.get('/attendance/history', { params });

/**
 * Returns the full URL for the CSV export endpoint.
 * Open in a new tab / window to trigger the file download.
 */
export const exportAttendanceCSVUrl = (date) =>
  `/api/attendance/export${date ? `?date=${date}` : ''}`;

// ─── Users ───────────────────────────────────────────────────────────────────

/** GET /api/users  — list all registered students */
export const getAllUsers = () =>
  API.get('/users');

/** POST /api/users/add  — register a new student */
export const addUser = (userData) =>
  API.post('/users/add', userData);

/** GET /api/users/:id  — get one student by id */
export const getUserById = (id) =>
  API.get(`/users/${id}`);

/** DELETE /api/users/:id  — remove a student */
export const deleteUser = (id) =>
  API.delete(`/users/${id}`);

export default API;
