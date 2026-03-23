import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AttendanceHistory from './pages/AttendanceHistory';
import Users from './pages/Users';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
        {/* Fixed sidebar */}
        <Sidebar />

        {/* Scrollable main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/attendance" element={<AttendanceHistory />} />
              <Route path="/users" element={<Users />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
