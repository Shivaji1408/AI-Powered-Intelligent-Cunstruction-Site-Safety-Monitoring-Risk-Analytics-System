import React from 'react';
import { useLocation } from 'react-router-dom';

const pageNames = {
  '/': 'Dashboard',
  '/attendance': 'Attendance History',
  '/users': 'Users'
};

const Navbar = () => {
  const location = useLocation();
  const pageName = pageNames[location.pathname] || 'Dashboard';

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
      <h1 className="text-lg font-semibold text-white">{pageName}</h1>

      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-300">System Active</span>
        </div>
        {/* Current date */}
        <span className="text-xs text-gray-500 hidden sm:block">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>
    </header>
  );
};

export default Navbar;
