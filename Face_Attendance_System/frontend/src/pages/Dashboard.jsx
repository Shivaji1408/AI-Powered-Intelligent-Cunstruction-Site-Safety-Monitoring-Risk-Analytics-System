import React, { useEffect, useRef, useState } from 'react';
import StatsCards from '../components/StatsCards';
import WebcamFeed from '../components/WebcamFeed';
import AttendanceTable from '../components/AttendanceTable';
import AnalyticsChart from '../components/AnalyticsChart';
import { getAttendanceHistory, getAllUsers, exportAttendanceCSVUrl } from '../services/api';
import socket from '../services/socket';

// ── Add Employee Modal ────────────────────────────────────────────────────────
const AddEmployeeModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', studentId: '' });
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) { setError('Please select a face photo.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('studentId', form.studentId);
      fd.append('photo', photo);
      const res = await fetch('/api/users/add', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add employee');
      onSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { key: 'name',      label: 'Full Name',    type: 'text',  placeholder: 'e.g. John Doe' },
    { key: 'studentId', label: 'Employee ID',   type: 'text',  placeholder: 'e.g. EMP001'  },
    { key: 'email',     label: 'Email Address', type: 'email', placeholder: 'john@example.com' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">Add New Employee</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <input
                type={type}
                required
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Face Photo <span className="text-gray-600">(JPG / PNG)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setPhoto(e.target.files[0] || null)}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2
                file:mr-3 file:bg-indigo-600 file:border-0 file:text-white file:text-xs file:px-2 file:py-0.5 file:rounded
                focus:outline-none"
            />
            <p className="text-xs text-gray-600 mt-1">
              Photo will be saved as{' '}
              <strong className="text-gray-500">{form.name || 'Name'}.jpg</strong>{' '}
              in the Training images folder. Restart the Python service afterwards.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              {submitting ? 'Adding…' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });
  const [todayRecords, setTodayRecords] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  // Tracks which employee names are already Present this session (avoids double-counting)
  const presentNamesRef = useRef(new Set());

  // On mount: load all registered employees (all start as Absent) + weekly chart
  useEffect(() => {
    const init = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        const [usersRes, historyRes] = await Promise.all([
          getAllUsers(),
          getAttendanceHistory(),
        ]);

        const users = usersRes.data;

        // Every employee starts as Absent — socket events flip them to Present live
        const absentRows = users.map((user) => ({
          _id: `absent-${user._id}`,
          employeeId: user.studentId,
          name: user.name.toUpperCase(),
          date: today,
          time: null,
          status: 'Absent',
        }));

        setStats({ total: users.length, present: 0, absent: users.length });
        setTodayRecords(absentRows);

        // Build weekly chart from history
        const grouped = {};
        historyRes.data.forEach((r) => {
          if (!grouped[r.date]) grouped[r.date] = { date: r.date, present: 0, absent: 0 };
          if (r.status === 'Present') grouped[r.date].present++;
          else grouped[r.date].absent++;
        });
        const sorted = Object.values(grouped)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7);
        setAnalyticsData(sorted);
      } catch (err) {
        console.error('Failed to init dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Real-time socket updates
  useEffect(() => {
    const onAttendanceMarked = (record) => {
      const name = (record.name || '').toUpperCase();
      if (!name) return;

      // If already flipped to Present this session, ignore duplicate events
      if (presentNamesRef.current.has(name)) return;
      presentNamesRef.current.add(name);

      // Update the row in the table (pure updater — no side effects inside)
      setTodayRecords((prev) => {
        const idx = prev.findIndex((r) => r.name.toUpperCase() === name);
        if (idx === -1) {
          // Unknown user not in registered list — prepend
          return [record, ...prev];
        }
        const updated = [...prev];
        updated[idx] = { ...record, name };
        return updated;
      });

      // Update stats outside the setTodayRecords updater
      setStats((s) => ({ ...s, present: s.present + 1, absent: Math.max(0, s.absent - 1) }));
    };

    const onDailyReset = () => {
      // New day: reload all users as absent, clear Present tracking
      presentNamesRef.current.clear();
      getAllUsers()
        .then(({ data: users }) => {
          const today = new Date().toISOString().split('T')[0];
          setStats({ total: users.length, present: 0, absent: users.length });
          setTodayRecords(users.map((u) => ({
            _id: `absent-${u._id}`,
            employeeId: u.studentId,
            name: u.name.toUpperCase(),
            date: today,
            time: null,
            status: 'Absent',
          })));
        })
        .catch(() => {});
    };

    socket.on('attendance_marked', onAttendanceMarked);
    socket.on('daily_reset', onDailyReset);
    return () => {
      socket.off('attendance_marked', onAttendanceMarked);
      socket.off('daily_reset', onDailyReset);
    };
  }, []);

  // CSV download — today's date
  const handleDownloadCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    const url = exportAttendanceCSVUrl(today);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${today}.csv`;
    a.click();
  };

  // Called after employee successfully added — add them as absent row immediately
  const handleEmployeeAdded = (newUser) => {
    const today = new Date().toISOString().split('T')[0];
    const absentRow = {
      _id: `absent-${newUser._id}`,
      employeeId: newUser.studentId,
      name: newUser.name.toUpperCase(),
      date: today,
      time: null,
      status: 'Absent',
    };
    setStats((prev) => ({ ...prev, total: prev.total + 1, absent: prev.absent + 1 }));
    setTodayRecords((prev) => [...prev, absentRow]);
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleEmployeeAdded}
        />
      )}

      <div className="space-y-6">
        {/* Action buttons row */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span className="text-base leading-none font-light">+</span> Add Employee
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span>↓</span> Download CSV
          </button>
        </div>

        {/* Stats cards */}
        <StatsCards stats={stats} />

        {/* Webcam + live attendance table */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <WebcamFeed />
          <AttendanceTable records={todayRecords} />
        </div>

        {/* Weekly analytics chart */}
        <AnalyticsChart data={analyticsData} />
      </div>
    </>
  );
};

export default Dashboard;
