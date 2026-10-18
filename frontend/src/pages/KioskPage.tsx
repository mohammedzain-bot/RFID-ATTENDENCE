import React from 'react';
import { KioskScanSection } from '../components/KioskScanSection';
import { ScanResultEvent, HardwareStatus } from '../types';
import { Radio, ArrowLeft, Maximize, Clock, Calendar } from 'lucide-react';

interface KioskPageProps {
  lastScan: ScanResultEvent | null;
  onClearScan: () => void;
  hardwareStatus: HardwareStatus | null;
  onBackToDashboard: () => void;
}

export const KioskPage: React.FC<KioskPageProps> = ({
  lastScan,
  onClearScan,
  hardwareStatus,
  onBackToDashboard
}) => {
  const isArduinoConnected = hardwareStatus?.connected || false;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      
      {/* Top Kiosk Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Kiosk Mode</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all"
        >
          <Maximize className="w-3.5 h-3.5" />
          <span>Full Screen</span>
        </button>
      </div>

      {/* Main Kiosk Section in full width */}
      <KioskScanSection
        lastScan={lastScan}
        onClearScan={onClearScan}
        isArduinoConnected={isArduinoConnected}
      />

    </div>
  );
};
