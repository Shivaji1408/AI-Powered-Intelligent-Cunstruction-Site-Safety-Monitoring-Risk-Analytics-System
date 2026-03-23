import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/attendance', label: 'Attendance', icon: '📋' },
  { path: '/users', label: 'Users', icon: '👥' }
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      {/* Logo / branding */}
      <div className="px-5 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl select-none">
            🎭
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">FaceAttend</p>
            <p className="text-xs text-gray-500">Recognition System</p>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">
          Powered by face_recognition
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
