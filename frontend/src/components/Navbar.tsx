import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  BarChart3, 
  Cpu, 
  Volume2, 
  VolumeX, 
  LogOut, 
  Clock, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { HardwareStatus } from '../types';
import { soundEffects } from '../utils/sound';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  hardwareStatus: HardwareStatus | null;
  onLogout: () => void;
  onOpenHardware: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  hardwareStatus,
  onLogout,
  onOpenHardware
}) => {
  const [time, setTime] = useState(new Date());
  const [isMuted, setIsMuted] = useState(soundEffects.isMuted());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(!muted);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kiosk', label: 'Scan Kiosk', icon: Radio },
    { id: 'attendance', label: 'Attendance', icon: ClipboardList },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'hardware', label: 'Hardware Bridge', icon: Cpu },
  ];

  // Render hardware pill
  const renderHardwareBadge = () => {
    const isConn = hardwareStatus?.connected;
    const state = hardwareStatus?.state || 'disconnected';

    let color = 'bg-red-500/10 text-red-400 border-red-500/20';
    let dotColor = 'bg-red-500';
    let text = 'Reader Disconnected';

    if (isConn) {
      if (state === 'connected') {
        color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        dotColor = 'bg-emerald-400 animate-ping';
        text = `Reader Active (${hardwareStatus?.port || 'USB'})`;
      } else {
        color = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
        dotColor = 'bg-amber-400 animate-pulse';
        text = `Waiting for Card (${hardwareStatus?.port || 'USB'})`;
      }
    } else {
      text = 'Hardware Ready / Standby';
    }

    return (
      <button
        onClick={onOpenHardware}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${color} hover:brightness-125`}
        title="Click to manage Arduino serial connection"
      >
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor.replace(' animate-ping', '').replace(' animate-pulse', '')}`}></span>
        </span>
        <span className="truncate max-w-[150px]">{text}</span>
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-600 to-accent-400 flex items-center justify-center shadow-lg shadow-accent-500/20 border border-accent-300/30">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white font-['Outfit']">NexTrack</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent-500/20 text-accent-400 border border-accent-500/30">
                  RFID
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5">Student Attendance System</p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1 bg-dark-900/60 p-1.5 rounded-xl border border-white/5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-accent-600 text-white shadow-md shadow-accent-600/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Status & Controls */}
          <div className="flex items-center space-x-3">
            {/* Live Time Display */}
            <div className="hidden lg:flex items-center space-x-3 text-xs text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent-400" />
                <span>
                  {time.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center space-x-1.5 font-mono text-accent-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-accent-400" />
                <span>{time.toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Hardware Status Badge */}
            {renderHardwareBadge()}

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-accent-400" />}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Admin Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-white/5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-accent-600 text-white font-bold'
                    : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
