import React, { useEffect, useState, useCallback } from 'react';
import AttendanceTable from '../components/AttendanceTable';
import { getAttendanceHistory, exportAttendanceCSVUrl } from '../services/api';

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterName, setFilterName] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterName) params.name = filterName;
      const { data } = await getAttendanceHistory(params);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load attendance history:', err);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterName]);

  // Load on first mount
  useEffect(() => {
    fetchHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleClear = () => {
    setFilterDate('');
    setFilterName('');
  };

  const handleExport = () => {
    window.open(exportAttendanceCSVUrl(filterDate), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Filter panel */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white text-sm mb-4">Filter Records</h2>
        <form onSubmit={handleApply} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input
              type="text"
              placeholder="Search by name…"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm rounded-lg px-3 py-2 w-48 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors ml-auto"
          >
            ↓ Export CSV
          </button>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-52 text-gray-400">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading records…</p>
          </div>
        </div>
      ) : (
        <AttendanceTable
          records={records}
          showSearch={false}
          showExport={true}
          onExport={handleExport}
        />
      )}
    </div>
  );
};

export default AttendanceHistory;
