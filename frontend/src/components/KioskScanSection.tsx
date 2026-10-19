import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building, 
  BookOpen, 
  Hash, 
  Sparkles, 
  Radio, 
  ShieldAlert, 
  RotateCcw,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ScanResultEvent } from '../types';
import { soundEffects } from '../utils/sound';
import { api } from '../services/api';

interface KioskScanSectionProps {
  lastScan: ScanResultEvent | null;
  onClearScan?: () => void;
  isArduinoConnected?: boolean;
}

export const KioskScanSection: React.FC<KioskScanSectionProps> = ({
  lastScan,
  onClearScan,
  isArduinoConnected = false
}) => {
  const [activeScan, setActiveScan] = useState<ScanResultEvent | null>(lastScan);
  const [countdown, setCountdown] = useState<number>(0);

  // When a new scan event arrives from hardware bridge or API
  useEffect(() => {
    if (!lastScan) return;

    setActiveScan(lastScan);

    // Audio & celebratory visual feedback based on scan status
    if (lastScan.status === 'present') {
      soundEffects.playSuccess();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#3b82f6', '#10b981', '#ffffff']
        });
      } catch {}
    } else if (lastScan.status === 'duplicate') {
      soundEffects.playWarning();
    } else if (lastScan.status === 'unknown') {
      soundEffects.playError();
    }

    // Auto-return countdown (15 seconds so user has time to view student details)
    setCountdown(15);
  }, [lastScan]);

  // Countdown timer to return to "Ready to Scan"
  useEffect(() => {
    if (countdown <= 0) {
      if (activeScan) {
        setActiveScan(null);
        if (onClearScan) onClearScan();
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, activeScan]);

  // Quick Demo Tap triggers
  const triggerDemo = async (uid: string) => {
    try {
      await api.simulateScan(uid);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl glass-panel-glow p-6 sm:p-8 transition-all">
      {/* Background ambient neon glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar with source & status indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">RFID Attendance Kiosk</h2>
            <p className="text-xs text-slate-400">Live tap-to-record desk terminal</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isArduinoConnected ? (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>ARDUINO CONNECTED</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Zap className="w-3.5 h-3.5" />
              <span>BRIDGE STANDBY / DEMO READY</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Kiosk Area */}
      {!activeScan ? (
        /* READY TO SCAN STATE */
        <div className="flex flex-col items-center justify-center py-10 sm:py-14 text-center">
          
          {/* Animated RFID Radar Visual */}
          <div className="relative flex items-center justify-center w-48 h-48 mb-6">
            <div className="rfid-wave"></div>
            <div className="rfid-wave"></div>
            <div className="rfid-wave"></div>

            <div className="relative z-10 w-28 h-28 rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 border-2 border-accent-500/40 flex flex-col items-center justify-center shadow-2xl shadow-accent-500/20 group cursor-pointer hover:border-accent-400 transition-all">
              <CreditCard className="w-12 h-12 text-accent-400 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-[10px] font-mono tracking-widest text-accent-300 mt-1 uppercase font-semibold">
                MFRC522
              </span>
            </div>
          </div>

          {/* Heading & Instructions */}
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
            Ready to Scan
          </h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
            Hold your RFID card or keyfob against the reader. Attendance will be recorded immediately.
          </p>

          {/* Interactive Fast Test Chips */}
          <div className="w-full max-w-xl bg-dark-900/80 p-4 rounded-2xl border border-white/5 mt-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent-400" />
                <span>Simulate Hardware Tap (Click to test):</span>
              </span>
              <span className="text-[11px] text-slate-400">UID Sent over Serial</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => triggerDemo('8A:B9:D6:05')}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-accent-500/20 hover:border-accent-500/40 border border-white/10 text-xs font-medium text-slate-200 transition-all text-left flex flex-col"
              >
                <span className="font-bold text-white truncate">Rahul Kumar</span>
                <span className="text-[10px] text-accent-400 font-mono">8A:B9:D6:05</span>
              </button>

              <button
                onClick={() => triggerDemo('0D:26:AA:04')}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-accent-500/20 hover:border-accent-500/40 border border-white/10 text-xs font-medium text-slate-200 transition-all text-left flex flex-col"
              >
                <span className="font-bold text-white truncate">Ananya Nair</span>
                <span className="text-[10px] text-accent-400 font-mono">0D:26:AA:04</span>
              </button>

              <button
                onClick={() => triggerDemo('12:34:56:78')}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-accent-500/20 hover:border-accent-500/40 border border-white/10 text-xs font-medium text-slate-200 transition-all text-left flex flex-col"
              >
                <span className="font-bold text-white truncate">Arjun Menon</span>
                <span className="text-[10px] text-accent-400 font-mono">12:34:56:78</span>
              </button>

              <button
                onClick={() => triggerDemo('AB:CD:EF:12')}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-accent-500/20 hover:border-accent-500/40 border border-white/10 text-xs font-medium text-slate-200 transition-all text-left flex flex-col"
              >
                <span className="font-bold text-white truncate">Meera Joseph</span>
                <span className="text-[10px] text-accent-400 font-mono">AB:CD:EF:12</span>
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* SCAN RESULT / STUDENT INFO CARD */
        <div className="py-4 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {activeScan.status === 'present' && (
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              )}
              {activeScan.status === 'duplicate' && (
                <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  <AlertCircle className="w-8 h-8" />
                </div>
              )}
              {activeScan.status === 'unknown' && (
                <div className="p-2.5 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400">
                  <ShieldAlert className="w-8 h-8" />
                </div>
              )}

              <div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                  {activeScan.status === 'present' ? 'STATUS UPDATE' : 'SCAN NOTIFICATION'}
                </span>
                <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  activeScan.status === 'present' ? 'text-emerald-400' :
                  activeScan.status === 'duplicate' ? 'text-amber-300' : 'text-red-400'
                }`}>
                  {activeScan.status === 'present' ? 'Attendance Recorded' :
                   activeScan.status === 'duplicate' ? 'Already Marked Present Today' :
                   'RFID Card Not Registered'}
                </h3>
              </div>
            </div>

            {/* Auto reset progress countdown */}
            <div className="flex items-center space-x-2 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-accent-400" />
              <span>Returning in {countdown}s</span>
              <button
                onClick={() => setActiveScan(null)}
                className="ml-2 text-accent-400 hover:text-white underline font-semibold"
              >
                Reset Now
              </button>
            </div>
          </div>

          {/* Student Profile & Details Card */}
          {activeScan.student ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl bg-dark-900/90 border border-white/10 shadow-2xl relative overflow-hidden">
              
              {/* Status Ribbon */}
              <div className="absolute top-4 right-4 flex items-center space-x-2">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase border shadow-lg ${
                  activeScan.status === 'present' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20'
                }`}>
                  {activeScan.attendance?.status?.toUpperCase() || 'PRESENT'}
                </span>
              </div>

              {/* Student Photo */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-2">
                <div className="relative">
                  <img
                    src={activeScan.student.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300'}
                    alt={activeScan.student.name}
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
                  />
                  <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-accent-600 text-white shadow-md">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                
                {/* Prominent Name */}
                <h4 className="text-xl sm:text-2xl font-black text-white mt-4 font-['Outfit']">
                  {activeScan.student.name}
                </h4>
                <div className="mt-1 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-accent-500/10 text-accent-400 border border-accent-500/20 text-xs font-mono font-semibold">
                  <span>ID:</span>
                  <span>{activeScan.student.studentId}</span>
                </div>
              </div>

              {/* Student Information Grid */}
              <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4 p-2 content-center border-t md:border-t-0 md:border-l border-white/10 md:pl-6">
                
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-accent-400" />
                    <span>Class</span>
                  </span>
                  <p className="text-base font-bold text-white">{activeScan.student.class}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-accent-400" />
                    <span>Department</span>
                  </span>
                  <p className="text-base font-bold text-white truncate">{activeScan.student.department}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <Hash className="w-3.5 h-3.5 text-accent-400" />
                    <span>Roll Number</span>
                  </span>
                  <p className="text-base font-bold text-white">{activeScan.student.rollNumber}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <CreditCard className="w-3.5 h-3.5 text-accent-400" />
                    <span>RFID UID</span>
                  </span>
                  <p className="text-sm font-mono font-bold text-accent-300">{activeScan.uid}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-accent-400" />
                    <span>Scan Time</span>
                  </span>
                  <p className="text-base font-mono font-bold text-emerald-400">
                    {activeScan.attendance?.time || new Date().toLocaleTimeString()}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-accent-400" />
                    <span>Scan Date</span>
                  </span>
                  <p className="text-sm font-bold text-slate-200">
                    {activeScan.attendance?.date || new Date().toISOString().split('T')[0]}
                  </p>
                </div>

              </div>

            </div>
          ) : (
            /* Unregistered Card Alert Card with Quick-Assign */
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-amber-500/10 to-dark-900 border border-amber-500/30 text-center animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>
              <h4 className="text-xl font-bold text-white mb-1">New RFID Card Detected</h4>
              <p className="text-sm text-slate-300 max-w-md mx-auto mb-4">
                Card UID <span className="font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">{activeScan.uid}</span> is ready to be linked.
              </p>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <button
                  onClick={async () => {
                    try {
                      // Fetch students to find STU001 or first student
                      const list = await api.getStudents();
                      const target = list.find((s: any) => s.student_id === 'STU001') || list[0];
                      if (target) {
                        await api.assignRfid(target.id, activeScan.uid);
                        // Trigger immediate scan
                        await api.simulateScan(activeScan.uid);
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-accent-600/30 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Assign to Rahul Kumar (STU001)</span>
                </button>

                <button
                  onClick={() => {
                    setActiveScan(null);
                    if (onClearScan) onClearScan();
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-white/10"
                >
                  Dismiss / Scan Again
                </button>
              </div>

              <div className="mt-4 text-xs text-slate-400">
                <span>Want to link to a different student? Open the <strong>Students</strong> tab to assign to anyone.</span>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
