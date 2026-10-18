import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { KioskPage } from './pages/KioskPage';
import { AttendanceTable } from './components/AttendanceTable';
import { StudentsPage } from './pages/StudentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { HardwarePage } from './pages/HardwarePage';
import { LoginPage } from './pages/LoginPage';

import { DashboardStats, HardwareStatus, ScanResultEvent } from './types';
import { api } from './services/api';
import { getSocket } from './services/socket';

export const App: React.FC = () => {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null);
  const [lastScan, setLastScan] = useState<ScanResultEvent | null>(null);
  const [attendanceRefreshTrigger, setAttendanceRefreshTrigger] = useState(0);

  // Load Dashboard stats & hardware status
  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
      if (data.hardwareStatus) {
        setHardwareStatus(data.hardwareStatus);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadStats();

    // Setup Socket.io real-time listeners
    const socket = getSocket();

    // RFID Tap event
    socket.on('rfid:scan_result', (scanData: ScanResultEvent) => {
      setLastScan(scanData);
      // Immediately reload stats and attendance tables
      loadStats();
      setAttendanceRefreshTrigger((prev) => prev + 1);
    });

    // Hardware status changes
    socket.on('hardware:status', (hw: HardwareStatus) => {
      setHardwareStatus(hw);
      setStats((prev) => (prev ? { ...prev, hardwareStatus: hw } : null));
    });

    // Attendance data modified
    socket.on('attendance:updated', () => {
      loadStats();
      setAttendanceRefreshTrigger((prev) => prev + 1);
    });

    return () => {
      socket.off('rfid:scan_result');
      socket.off('hardware:status');
      socket.off('attendance:updated');
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // If not logged in, render Login page
  if (!user) {
    return <LoginPage onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col text-slate-100">
      
      {/* Top Glass Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        hardwareStatus={hardwareStatus}
        onLogout={handleLogout}
        onOpenHardware={() => setCurrentTab('hardware')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <DashboardPage
            stats={stats}
            lastScan={lastScan}
            onClearScan={() => setLastScan(null)}
            onTabChange={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'kiosk' && (
          <KioskPage
            lastScan={lastScan}
            onClearScan={() => setLastScan(null)}
            hardwareStatus={hardwareStatus}
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'attendance' && (
          <div className="space-y-6">
            <AttendanceTable refreshTrigger={attendanceRefreshTrigger} />
          </div>
        )}

        {currentTab === 'students' && <StudentsPage />}

        {currentTab === 'reports' && <ReportsPage />}

        {currentTab === 'hardware' && (
          <HardwarePage
            hardwareStatus={hardwareStatus}
            onRefreshStatus={loadStats}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NexTrack RFID Attendance Management System • Arduino Uno + MFRC522</span>
          <span className="font-mono text-[11px] text-slate-600">v1.0.0 • Connected to Serial Bridge</span>
        </div>
      </footer>

    </div>
  );
};
