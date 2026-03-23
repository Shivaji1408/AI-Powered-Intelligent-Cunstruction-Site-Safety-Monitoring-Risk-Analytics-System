import React from 'react';

const StatCard = ({ title, value, icon, bgColor, subtitle }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${bgColor}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{title}</p>
      <p className="text-3xl font-bold text-white mt-0.5 leading-none">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const StatsCards = ({ stats }) => {
  const { total = 0, present = 0, absent = 0 } = stats || {};
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Employees"
        value={total}
        icon="🎓"
        bgColor="bg-blue-500/10"
        subtitle="Registered"
      />
      <StatCard
        title="Present Today"
        value={present}
        icon="✅"
        bgColor="bg-green-500/10"
        subtitle={total > 0 ? `${rate}% of workforce` : 'Waiting for detections…'}
      />
      <StatCard
        title="Absent Today"
        value={absent}
        icon="❌"
        bgColor="bg-red-500/10"
        subtitle="Not yet detected"
      />
      <StatCard
        title="Attendance Rate"
        value={`${rate}%`}
        icon="📊"
        bgColor="bg-purple-500/10"
        subtitle="Today's rate"
      />
    </div>
  );
};

export default StatsCards;
