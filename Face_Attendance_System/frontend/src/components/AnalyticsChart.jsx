import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const AnalyticsChart = ({ data = [] }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
    <h2 className="font-semibold text-white text-sm mb-5">Weekly Attendance Analytics</h2>

    {data.length === 0 ? (
      <div className="h-52 flex items-center justify-center text-gray-600 text-sm">
        No analytics data yet — attendance records will appear here.
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#4b5563"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#4b5563"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#9ca3af', paddingTop: 12 }}
          />
          <Bar dataKey="present" name="Present" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
);

export default AnalyticsChart;
