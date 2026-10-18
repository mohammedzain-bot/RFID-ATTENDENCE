import React from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Percent, 
  Cpu, 
  Clock, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { DashboardStats } from '../types';

interface StatsOverviewProps {
  stats: DashboardStats | null;
  onOpenHardware?: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, onOpenHardware }) => {
  const total = stats?.totalStudents || 0;
  const present = stats?.presentToday || 0;
  const absent = stats?.absentToday || 0;
  const percentage = stats?.attendancePercentage || 0;
  const hw = stats?.hardwareStatus;
  const lastScanned = stats?.lastScannedStudent;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      
      {/* 1. Total Students */}
      <div className="glass-panel glass-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Students</span>
          <div className="p-2 rounded-xl bg-white/5 text-slate-300">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">{total}</div>
          <span className="text-[11px] text-slate-400 mt-1 flex items-center">
            Active enrolled in campus
          </span>
        </div>
      </div>

      {/* 2. Present Today */}
      <div className="glass-panel glass-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between border-emerald-500/20">
        <div className="flex items-center justify-between text-emerald-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Present Today</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-['Outfit']">{present}</div>
          <div className="w-full bg-dark-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Absent Today */}
      <div className="glass-panel glass-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between border-red-500/20">
        <div className="flex items-center justify-between text-rose-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Absent Today</span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <UserX className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-['Outfit']">{absent}</div>
          <span className="text-[11px] text-slate-400 mt-1 flex items-center">
            Pending RFID tap
          </span>
        </div>
      </div>

      {/* 4. Attendance Percentage */}
      <div className="glass-panel glass-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between border-accent-500/20">
        <div className="flex items-center justify-between text-accent-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Rate</span>
          <div className="p-2 rounded-xl bg-accent-500/10 text-accent-400">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] flex items-baseline space-x-0.5">
            <span>{percentage}</span>
            <span className="text-sm font-semibold text-accent-400">%</span>
          </div>
          <span className="text-[11px] text-accent-300/80 mt-1 block">
            {percentage >= 75 ? 'Healthy campus turnout' : 'Morning attendance ongoing'}
          </span>
        </div>
      </div>

      {/* 5. RFID Reader Status */}
      <div 
        onClick={onOpenHardware} 
        className="glass-panel glass-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between cursor-pointer group"
        title="Click to view hardware connection settings"
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">RFID Reader</span>
          <div className="p-2 rounded-xl bg-white/5 text-slate-300 group-hover:text-accent-400 transition-colors">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              hw?.connected ? (hw?.state === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-emerald-400') : 'bg-amber-400 animate-pulse'
            }`} />
            <span className="text-sm sm:text-base font-bold text-white truncate">
              {hw?.connected ? 'Online' : 'Ready (USB)'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 truncate block">
            {hw?.port ? hw.port : 'Auto-Bridge active'}
          </span>
        </div>
      </div>

      {/* 6. Last Scanned Student */}
      <div className="glass-panel glass-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Last Scanned</span>
          <div className="p-2 rounded-xl bg-white/5 text-slate-300">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          {lastScanned ? (
            <div>
              <p className="text-sm font-bold text-white truncate">{lastScanned.name}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                <span className="text-accent-400 font-mono">{lastScanned.time}</span>
                <span className="font-semibold text-emerald-400 uppercase text-[10px]">{lastScanned.status}</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-slate-400">No scans yet today</p>
              <span className="text-[11px] text-slate-500">Waiting for first tap</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
