import React from 'react';
import { StatsOverview } from '../components/StatsOverview';
import { KioskScanSection } from '../components/KioskScanSection';
import { DashboardStats, ScanResultEvent } from '../types';
import { 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Layers, 
  UserCheck 
} from 'lucide-react';

interface DashboardPageProps {
  stats: DashboardStats | null;
  lastScan: ScanResultEvent | null;
  onClearScan: () => void;
  onTabChange: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  lastScan,
  onClearScan,
  onTabChange
}) => {
  const isArduinoConnected = stats?.hardwareStatus?.connected || false;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Main Stat Cards Row */}
      <StatsOverview 
        stats={stats} 
        onOpenHardware={() => onTabChange('hardware')} 
      />

      {/* 2. Central RFID Scanning Interactive Section */}
      <KioskScanSection
        lastScan={lastScan}
        onClearScan={onClearScan}
        isArduinoConnected={isArduinoConnected}
      />

      {/* 3. Class Turnout & Live Campus Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Class Participation Progress */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-6 sm:p-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Today's Class Attendance Turnout</h3>
              <p className="text-xs text-slate-400">Class-wise present count vs enrolled students</p>
            </div>
            <button
              onClick={() => onTabChange('attendance')}
              className="flex items-center space-x-1 text-xs font-semibold text-accent-400 hover:text-accent-300"
            >
              <span>View Full Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {stats?.classStats?.map((c) => {
              const pct = c.total_students > 0 ? Math.round((c.present_today / c.total_students) * 100) : 0;
              return (
                <div key={c.class} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{c.class}</span>
                    <span className="text-slate-400 font-mono">
                      <strong className="text-emerald-400">{c.present_today}</strong> / {c.total_students} students ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-dark-950 rounded-full h-2.5 overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-accent-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Reception Action Card */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight mb-1">Desk Terminal Mode</h3>
            <p className="text-xs text-slate-400 mb-4">
              Reception desk is active. Student tap events automatically log without requiring page refresh.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">RFID Protocol:</span>
                <span className="font-mono text-white font-semibold">ISO/IEC 14443A (Mifare)</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Serial Bridge:</span>
                <span className="font-mono text-emerald-400 font-semibold">Active (WebSocket)</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Scan Cooldown:</span>
                <span className="font-mono text-accent-400 font-semibold">2.5s Debounce</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => onTabChange('kiosk')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all text-center"
            >
              Open Full-Screen Kiosk View
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
