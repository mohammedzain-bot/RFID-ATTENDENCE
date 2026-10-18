import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Terminal, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Radio, 
  Plug, 
  PowerOff, 
  Layers, 
  Copy, 
  Check,
  CreditCard,
  FileCode,
  Sliders
} from 'lucide-react';
import { HardwareStatus, SerialPortInfo, SerialLogItem } from '../types';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

interface HardwarePageProps {
  hardwareStatus: HardwareStatus | null;
  onRefreshStatus: () => void;
}

export const HardwarePage: React.FC<HardwarePageProps> = ({ hardwareStatus, onRefreshStatus }) => {
  const [ports, setPorts] = useState<SerialPortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [logs, setLogs] = useState<SerialLogItem[]>([]);
  const [copiedArduinoCode, setCopiedArduinoCode] = useState(false);

  // Load available COM ports
  const fetchPorts = async () => {
    try {
      const list = await api.getPorts();
      setPorts(list);
      if (list.length > 0 && !selectedPort) {
        // Auto-select likely Arduino if found, else first port
        const arduino = list.find(p => p.isLikelyArduino);
        setSelectedPort(arduino ? arduino.path : list[0].path);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPorts();
  }, []);

  // Listen for real-time serial logs from the local serial bridge
  useEffect(() => {
    const socket = getSocket();
    const handleLog = (logItem: SerialLogItem) => {
      setLogs((prev) => [logItem, ...prev].slice(0, 100));
    };

    socket.on('serial:log', handleLog);
    return () => {
      socket.off('serial:log', handleLog);
    };
  }, []);

  const handleConnect = async () => {
    if (!selectedPort) return;
    setConnecting(true);
    try {
      const res = await api.connectPort(selectedPort, baudRate);
      if (!res.success) {
        alert(`Connection Failed: ${res.message}`);
      }
      onRefreshStatus();
      fetchPorts();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.disconnectPort();
      onRefreshStatus();
      fetchPorts();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSimulate = async (uid: string) => {
    try {
      await api.simulateScan(uid);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isConnected = hardwareStatus?.connected || false;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Arduino Hardware Bridge
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Local USB Serial controller for Arduino Uno & MFRC522 13.56MHz RFID Reader
          </p>
        </div>

        <button
          onClick={() => { fetchPorts(); onRefreshStatus(); }}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 self-start sm:self-auto transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Rescan COM Ports</span>
        </button>
      </div>

      {/* Connection Controller Box */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        
        {/* Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-dark-950/80 border border-white/10">
          <div className="flex items-center space-x-3.5">
            <div className={`p-3 rounded-2xl border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}>
              <Cpu className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${
                  isConnected 
                    ? (hardwareStatus?.state === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-emerald-400')
                    : 'bg-red-400'
                }`} />
                <h3 className="text-lg font-bold text-white">
                  {isConnected ? '🟢 RFID Reader Connected' : '🔴 RFID Reader Disconnected'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isConnected 
                  ? `Active on ${hardwareStatus?.port} @ ${hardwareStatus?.baudRate} Baud`
                  : 'Plug in Arduino Uno via USB cable and select port below'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block uppercase font-mono">Last RFID Scan</span>
            <span className="text-sm font-mono font-bold text-accent-400">
              {hardwareStatus?.lastScanTime ? hardwareStatus.lastScanTime : 'None recorded'}
            </span>
          </div>
        </div>

        {/* COM Port Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Plug className="w-3.5 h-3.5 text-accent-400" />
              <span>Available USB / Serial Ports</span>
            </label>
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              disabled={isConnected}
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-accent-500 disabled:opacity-50"
            >
              {ports.length > 0 ? (
                ports.map((p) => (
                  <option key={p.path} value={p.path}>
                    {p.path} {p.manufacturer !== 'Unknown' ? `(${p.manufacturer})` : ''} {p.isLikelyArduino ? '⭐ Arduino' : ''}
                  </option>
                ))
              ) : (
                <option value="">No COM ports detected (Plug Arduino via USB)</option>
              )}
            </select>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-accent-400" />
              <span>Baud Rate</span>
            </label>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              disabled={isConnected}
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-accent-500 disabled:opacity-50"
            >
              <option value="9600">9600 Baud (Default for Arduino)</option>
              <option value="115200">115200 Baud</option>
              <option value="57600">57600 Baud</option>
              <option value="19200">19200 Baud</option>
            </select>
          </div>

          <div className="md:col-span-3">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                disabled={connecting || !selectedPort}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white shadow-xl shadow-accent-600/30 transition-all"
              >
                <Plug className="w-4 h-4" />
                <span>{connecting ? 'Connecting...' : 'Connect Arduino'}</span>
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-xl shadow-rose-600/30 transition-all"
              >
                <PowerOff className="w-4 h-4" />
                <span>{disconnecting ? 'Disconnecting...' : 'Disconnect Port'}</span>
              </button>
            )}
          </div>

        </div>

        {/* Arduino IDE Serial Monitor Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3 text-xs text-amber-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-200">Important for Arduino IDE Users:</span>
            <p className="text-slate-300 leading-relaxed">
              If you see <strong className="text-amber-300">"Access denied"</strong>, please <strong>close the Serial Monitor window</strong> in Arduino IDE (or close Arduino IDE). Windows only permits one app to open <code className="text-accent-400 font-bold">COM3</code> at a time. Once the IDE monitor is closed, click <strong>"Connect Arduino"</strong>.
            </p>
          </div>
        </div>

      </div>

      {/* Demo Simulation Shelf */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Demo Tap Mode</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  SIMULATION
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Click any registered card below to test without physical reader
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleSimulate('8A:B9:D6:05')}
            className="p-3.5 rounded-2xl bg-dark-950/80 hover:bg-accent-500/15 border border-white/10 hover:border-accent-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <CreditCard className="w-4 h-4 text-accent-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-500/10 text-accent-400 border border-accent-500/20">
                STU001
              </span>
            </div>
            <div className="font-bold text-white text-xs">Rahul Kumar</div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">8A:B9:D6:05</div>
          </button>

          <button
            onClick={() => handleSimulate('0D:26:AA:04')}
            className="p-3.5 rounded-2xl bg-dark-950/80 hover:bg-accent-500/15 border border-white/10 hover:border-accent-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <CreditCard className="w-4 h-4 text-accent-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-500/10 text-accent-400 border border-accent-500/20">
                STU002
              </span>
            </div>
            <div className="font-bold text-white text-xs">Ananya Nair</div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">0D:26:AA:04</div>
          </button>

          <button
            onClick={() => handleSimulate('12:34:56:78')}
            className="p-3.5 rounded-2xl bg-dark-950/80 hover:bg-accent-500/15 border border-white/10 hover:border-accent-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <CreditCard className="w-4 h-4 text-accent-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-500/10 text-accent-400 border border-accent-500/20">
                STU003
              </span>
            </div>
            <div className="font-bold text-white text-xs">Arjun Menon</div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">12:34:56:78</div>
          </button>

          <button
            onClick={() => handleSimulate('AB:CD:EF:12')}
            className="p-3.5 rounded-2xl bg-dark-950/80 hover:bg-accent-500/15 border border-white/10 hover:border-accent-500/40 text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <CreditCard className="w-4 h-4 text-accent-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-500/10 text-accent-400 border border-accent-500/20">
                STU004
              </span>
            </div>
            <div className="font-bold text-white text-xs">Meera Joseph</div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">AB:CD:EF:12</div>
          </button>
        </div>
      </div>

      {/* Bottom Grid: Live Serial Terminal & Hardware Schematics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Live Serial Console Terminal */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 flex flex-col h-[380px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-accent-400" />
              <h3 className="text-sm font-bold text-white">Live Serial Packet Terminal</h3>
            </div>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Clear Console
            </button>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1.5 bg-dark-950 p-3 rounded-2xl border border-white/5">
            {logs.length > 0 ? (
              logs.map((l, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <span className="text-slate-600 select-none text-[10px]">{l.timestamp}</span>
                  <span className={`px-1.5 rounded text-[10px] uppercase font-bold ${
                    l.type === 'rx' ? 'bg-emerald-500/20 text-emerald-300' :
                    l.type === 'tx' ? 'bg-blue-500/20 text-blue-300' :
                    l.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-slate-300'
                  }`}>
                    {l.type}
                  </span>
                  <span className={`flex-1 break-all ${
                    l.type === 'rx' ? 'text-emerald-400' :
                    l.type === 'error' ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    {l.message}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-600 italic py-6 text-center">
                Terminal idle. Incoming serial packets from Arduino (e.g. RFID_SCAN:A3:B4:C5:D6) will stream here.
              </div>
            )}
          </div>
        </div>

        {/* Pinout & Hardware Guide */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Layers className="w-4 h-4 text-accent-400" />
              <h3 className="text-sm font-bold text-white">MFRC522 to Arduino Uno Pinout</h3>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 text-xs">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-slate-400 font-semibold border-b border-white/10 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">MFRC522 Pin</th>
                    <th className="py-2 px-3">Arduino Uno</th>
                    <th className="py-2 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 text-[11px]">
                  <tr>
                    <td className="py-1.5 px-3 font-mono font-bold text-accent-400">3.3V</td>
                    <td className="py-1.5 px-3 font-bold text-white">3.3V Pin</td>
                    <td className="py-1.5 px-3 text-red-400 font-bold">Never 5V!</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono">RST</td>
                    <td className="py-1.5 px-3">Pin 9</td>
                    <td className="py-1.5 px-3 text-slate-400">Reset</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono">GND</td>
                    <td className="py-1.5 px-3">GND</td>
                    <td className="py-1.5 px-3 text-slate-400">Ground</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono">MISO</td>
                    <td className="py-1.5 px-3">Pin 12</td>
                    <td className="py-1.5 px-3 text-slate-400">SPI Data</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono">MOSI</td>
                    <td className="py-1.5 px-3">Pin 11</td>
                    <td className="py-1.5 px-3 text-slate-400">SPI Data</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono">SCK</td>
                    <td className="py-1.5 px-3">Pin 13</td>
                    <td className="py-1.5 px-3 text-slate-400">SPI Clock</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-mono">SDA (SS)</td>
                    <td className="py-1.5 px-3">Pin 10</td>
                    <td className="py-1.5 px-3 text-slate-400">Chip Select</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Arduino Sketch: <code className="text-accent-400">arduino/.../rfid_attendance_uno.ino</code></span>
          </div>
        </div>

      </div>

    </div>
  );
};
