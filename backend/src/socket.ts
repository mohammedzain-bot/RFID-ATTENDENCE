import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // Client connected
    socket.emit('connected', { message: 'Real-time WebSocket connected' });

    socket.on('disconnect', () => {
      // Client disconnected
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function broadcastRFIDScan(data: any) {
  if (io) {
    io.emit('rfid:scan_result', data);
  }
}

export function broadcastHardwareStatus(data: any) {
  if (io) {
    io.emit('hardware:status', data);
  }
}

export function broadcastSerialLog(message: string, type: 'info' | 'rx' | 'tx' | 'error' = 'info') {
  if (io) {
    io.emit('serial:log', {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    });
  }
}

export function broadcastAttendanceUpdated() {
  if (io) {
    io.emit('attendance:updated', { timestamp: new Date().toISOString() });
  }
}
