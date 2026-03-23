import React, { useState } from 'react';

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium border ${
      status === 'Present'
        ? 'bg-green-500/10 text-green-400 border-green-500/20'
        : 'bg-red-500/10 text-red-400 border-red-500/20'
    }`}
  >
    {status === 'Present' ? '● Present' : '● Absent'}
  </span>
);

const AttendanceTable = ({
  records = [],
  showSearch = true,
  showExport = false,
  onExport
}) => {
  const [search, setSearch] = useState('');

  const filtered = records.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="px-5 py-3.5 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 className="font-semibold text-white text-sm flex-1">Attendance Records</h2>
        <div className="flex items-center gap-2">
          {showSearch && (
            <input
              type="text"
              placeholder="Search name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm rounded-lg px-3 py-1.5 w-44 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          )}
          {showExport && (
            <button
              onClick={onExport}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              ↓ Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-medium">Emp. ID</th>
              <th className="text-left px-5 py-3 font-medium">Name</th>
              <th className="text-left px-5 py-3 font-medium">Date</th>
              <th className="text-left px-5 py-3 font-medium">Time</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-gray-600 text-sm"
                >
                  {search ? 'No records match your search' : 'No attendance records found'}
                </td>
              </tr>
            ) : (
              filtered.map((record, idx) => (
                <tr
                  key={record._id || idx}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-5 py-3 text-gray-400 tabular-nums font-mono text-xs">
                    {record.employeeId || <span className="text-gray-700">—</span>}
                  </td>
                  <td className="px-5 py-3 font-medium text-white">{record.name}</td>
                  <td className="px-5 py-3 text-gray-400 tabular-nums">{record.date || '—'}</td>
                  <td className="px-5 py-3 text-gray-400 tabular-nums">
                    {record.time || <span className="text-gray-700">Not yet</span>}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={record.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="px-5 py-2.5 border-t border-gray-800 text-xs text-gray-600">
        {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        {search && records.length !== filtered.length && ` (filtered from ${records.length})`}
      </div>
    </div>
  );
};

export default AttendanceTable;
