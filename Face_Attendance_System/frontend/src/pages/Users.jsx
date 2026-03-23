import React, { useEffect, useState } from 'react';
import { getAllUsers, deleteUser } from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', studentId: '' });
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) { setErrorMsg('Please select a face photo.'); return; }
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('studentId', form.studentId);
      fd.append('photo', photo);
      const res = await fetch('/api/users/add', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to register employee');
      setSuccessMsg(`"${form.name}" registered successfully! Restart the Python service to enable recognition.`);
      setForm({ name: '', email: '', studentId: '' });
      setPhoto(null);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from the system?`)) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setSuccessMsg(`"${name}" removed.`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Delete failed');
    }
  };

  const fields = [
    { key: 'name',      label: 'Full Name',     type: 'text',  placeholder: 'e.g. John Doe'     },
    { key: 'studentId', label: 'Employee ID',    type: 'text',  placeholder: 'e.g. EMP001'       },
    { key: 'email',     label: 'Email Address',  type: 'email', placeholder: 'john@example.com'  },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Registered Employees</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length} employee{users.length !== 1 ? 's' : ''} in the system
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setErrorMsg(''); setSuccessMsg(''); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? '✕ Cancel' : '+ Add Employee'}
        </button>
      </div>

      {/* Feedback messages */}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-lg">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
          ✕ {errorMsg}
        </div>
      )}

      {/* Add Employee Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-medium text-white text-sm mb-4">New Employee Details</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Face Photo <span className="text-gray-600">(JPG / PNG — used for recognition)</span>
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
                Photo will be saved as <strong className="text-gray-500">{form.name || 'Name'}.jpg</strong> in the Training images folder.
                Restart the Python service afterwards to enable recognition.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-5 py-2 rounded-lg transition-colors"
            >
              {submitting ? 'Registering…' : 'Register Employee'}
            </button>
          </form>
        </div>
      )}

      {/* Employees table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-52 text-gray-400">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Employee ID</th>
                  <th className="text-left px-5 py-3 font-medium">Registered</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-600 text-sm">
                      No employees registered yet. Add the first one above.
                    </td>
                  </tr>
                ) : (
                  users.map((user, idx) => (
                    <tr
                      key={user._id || idx}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-white">{user.name}</td>
                      <td className="px-5 py-3 text-gray-400">{user.email}</td>
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">{user.studentId}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
