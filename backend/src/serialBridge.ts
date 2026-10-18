import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { CONFIG } from './config';
import { processRFIDScan } from './services/rfidService';
import { broadcastHardwareStatus, broadcastSerialLog } from './socket';

export interface HardwareStatus {
  connected: boolean;
  state: 'connected' | 'waiting' | 'disconnected';
  port: string | null;
  baudRate: number;
  lastScanTime: string | null;
  lastScanUid: string | null;
  totalHardwareScans: number;
  deviceDescription: string | null;
  mode: 'real_hardware' | 'ready_for_hardware';
}

let activePort: SerialPort | null = null;
let activeParser: ReadlineParser | null = null;

let hardwareStatus: HardwareStatus = {
  connected: false,
  state: 'disconnected',
  port: null,
  baudRate: CONFIG.BAUD_RATE,
  lastScanTime: null,
  lastScanUid: null,
  totalHardwareScans: 0,
  deviceDescription: null,
  mode: 'ready_for_hardware'
};

export function getHardwareStatus(): HardwareStatus {
  return hardwareStatus;
}

export async function listAvailablePorts() {
  try {
    const ports = await SerialPort.list();
    return ports.map(p => ({
      path: p.path,
      manufacturer: p.manufacturer || 'Unknown',
      serialNumber: p.serialNumber || 'N/A',
      vendorId: p.vendorId || 'N/A',
      productId: p.productId || 'N/A',
      isLikelyArduino: isArduinoDevice(p)
    }));
  } catch (err: any) {
    broadcastSerialLog(`Error listing ports: ${err.message}`, 'error');
    return [];
  }
}

function isArduinoDevice(portInfo: any): boolean {
  const desc = `${portInfo.manufacturer || ''} ${portInfo.vendorId || ''} ${portInfo.productId || ''} ${portInfo.path || ''} ${portInfo.friendlyName || ''}`.toLowerCase();
  return (
    desc.includes('arduino') ||
    desc.includes('ch340') ||
    desc.includes('wch.cn') ||
    desc.includes('1a86') ||
    desc.includes('cp210') ||
    desc.includes('ftdi') ||
    desc.includes('usb-serial') ||
    desc.includes('2341') // Arduino Vendor ID 0x2341
  );
}

export async function connectPort(portPath: string, baudRate: number = CONFIG.BAUD_RATE): Promise<{ success: boolean; message: string }> {
  try {
    if (activePort && activePort.isOpen) {
      await disconnectPort();
    }

    broadcastSerialLog(`Attempting connection to ${portPath} at ${baudRate} baud...`, 'info');

    activePort = new SerialPort({
      path: portPath,
      baudRate: baudRate,
      autoOpen: false
    });

    activeParser = activePort.pipe(new ReadlineParser({ delimiter: '\n' }));

    return new Promise((resolve) => {
      activePort!.open((err) => {
        if (err) {
          hardwareStatus.connected = false;
          hardwareStatus.state = 'disconnected';
          hardwareStatus.port = null;
          hardwareStatus.deviceDescription = null;
          broadcastHardwareStatus(hardwareStatus);
          broadcastSerialLog(`Failed to open ${portPath}: ${err.message}`, 'error');
          return resolve({ success: false, message: err.message });
        }

        hardwareStatus.connected = true;
        hardwareStatus.state = 'waiting';
        hardwareStatus.port = portPath;
        hardwareStatus.baudRate = baudRate;
        hardwareStatus.mode = 'real_hardware';
        hardwareStatus.deviceDescription = `Connected to Arduino (${portPath})`;

        broadcastHardwareStatus(hardwareStatus);
        broadcastSerialLog(`🟢 Serial port ${portPath} opened successfully. Listening for RFID scans...`, 'info');

        setupSerialListeners();
        resolve({ success: true, message: `Connected to ${portPath}` });
      });
    });
  } catch (error: any) {
    broadcastSerialLog(`Exception connecting to ${portPath}: ${error.message}`, 'error');
    return { success: false, message: error.message };
  }
}

export async function disconnectPort(): Promise<{ success: boolean; message: string }> {
  if (!activePort) {
    return { success: true, message: 'Already disconnected' };
  }

  return new Promise((resolve) => {
    const portName = hardwareStatus.port;
    activePort!.close((err) => {
      activePort = null;
      activeParser = null;
      hardwareStatus.connected = false;
      hardwareStatus.state = 'disconnected';
      hardwareStatus.port = null;
      hardwareStatus.deviceDescription = null;
      hardwareStatus.mode = 'ready_for_hardware';

      broadcastHardwareStatus(hardwareStatus);
      broadcastSerialLog(`🔴 Disconnected from ${portName || 'serial port'}`, 'info');

      if (err) {
        resolve({ success: false, message: err.message });
      } else {
        resolve({ success: true, message: 'Disconnected' });
      }
    });
  });
}

function setupSerialListeners() {
  if (!activePort || !activeParser) return;

  activeParser.on('data', (rawLine: string) => {
    const line = rawLine.trim();
    if (!line) return;

    broadcastSerialLog(`RX: ${line}`, 'rx');

    // Handle Arduino status or RFID scan line
    if (line.startsWith('RFID_SCAN:')) {
      const uid = line.replace('RFID_SCAN:', '').trim();
      handleIncomingRFID(uid);
    } else if (line.startsWith('RFID UID:')) {
      // Matches user's exact Arduino sketch output format: "RFID UID: 8A:B9:D6:05"
      const uid = line.replace('RFID UID:', '').trim();
      handleIncomingRFID(uid);
    } else if (line.includes('RFID Reader Ready') || line.includes('Tap an RFID card') || line.startsWith('STATUS:READY')) {
      hardwareStatus.state = 'waiting';
      broadcastHardwareStatus(hardwareStatus);
      broadcastSerialLog('🟢 Arduino MFRC522 Reader Ready! Waiting for card...', 'info');
    } else if (line.startsWith('STATUS:READER_ERROR')) {
      broadcastSerialLog(`⚠️ Hardware warning: ${line}`, 'error');
    } else {
      // Regex check for any colon-separated UID pattern in the line (e.g. "8A:B9:D6:05")
      const uidMatch = line.match(/([0-9A-Fa-f]{2}:){3,9}[0-9A-Fa-f]{2}/);
      if (uidMatch && !line.includes('Students registered')) {
        handleIncomingRFID(uidMatch[0]);
      }
    }
  });

  activePort.on('error', (err) => {
    broadcastSerialLog(`Serial Error: ${err.message}`, 'error');
    hardwareStatus.state = 'disconnected';
    hardwareStatus.connected = false;
    broadcastHardwareStatus(hardwareStatus);
  });

  activePort.on('close', () => {
    broadcastSerialLog('Serial port closed.', 'info');
    hardwareStatus.state = 'disconnected';
    hardwareStatus.connected = false;
    hardwareStatus.port = null;
    broadcastHardwareStatus(hardwareStatus);
  });
}

function handleIncomingRFID(rawUid: string) {
  const uid = rawUid.toUpperCase().trim();
  const now = new Date();

  hardwareStatus.lastScanTime = now.toLocaleTimeString();
  hardwareStatus.lastScanUid = uid;
  hardwareStatus.totalHardwareScans += 1;
  hardwareStatus.state = 'connected'; // momentary activity
  broadcastHardwareStatus(hardwareStatus);

  // Return to waiting state after brief delay
  setTimeout(() => {
    if (hardwareStatus.connected) {
      hardwareStatus.state = 'waiting';
      broadcastHardwareStatus(hardwareStatus);
    }
  }, 3000);

  // Process scan through main business logic
  processRFIDScan(uid, 'hardware');
}

let autoRetryTimer: NodeJS.Timeout | null = null;

export async function initSerialBridge() {
  if (!CONFIG.AUTO_CONNECT_SERIAL) {
    broadcastSerialLog('Auto-connect serial is disabled.', 'info');
    return;
  }

  const attemptAutoConnect = async () => {
    if (hardwareStatus.connected) return;

    try {
      const ports = await listAvailablePorts();
      const likelyArduino = ports.find(p => p.isLikelyArduino) || ports.find(p => p.path === 'COM3');
      if (likelyArduino) {
        await connectPort(likelyArduino.path);
      }
    } catch {}
  };

  // Immediate attempt
  await attemptAutoConnect();

  // Continual background retry every 2.5s until user closes Serial Monitor
  if (!autoRetryTimer) {
    autoRetryTimer = setInterval(() => {
      if (!hardwareStatus.connected) {
        attemptAutoConnect();
      }
    }, 2500);
  }
}
