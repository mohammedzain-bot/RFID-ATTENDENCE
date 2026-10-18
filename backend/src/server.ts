import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { CONFIG } from './config';
import { initDatabase } from './db';
import { initSocket } from './socket';
import { initSerialBridge, disconnectPort } from './serialBridge';

import rfidRouter from './routes/rfid';
import attendanceRouter from './routes/attendance';
import studentsRouter from './routes/students';
import hardwareRouter from './routes/hardware';
import authRouter from './routes/auth';

const app = express();
const server = http.createServer(app);

// Enable CORS and JSON parsing
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize WebSocket server
initSocket(server);

// Initialize SQLite database
initDatabase();

// Mount API routes
app.use('/api/rfid', rfidRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/students', studentsRouter);
app.use('/api/hardware', hardwareRouter);
app.use('/api/auth', authRouter);

// Base health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'RFID Student Attendance System'
  });
});

// Serve frontend static files if built
import fs from 'fs';

const candidatePaths = [
  path.resolve(__dirname, 'public'),
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(process.cwd(), 'public'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist')
];

const frontendDist = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];
console.log(`Serving frontend static files from: ${frontendDist} (exists: ${fs.existsSync(frontendDist)})`);
app.use(express.static(frontendDist));

// SPA fallback middleware
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexHtml = path.join(frontendDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>RFID Attendance API</title></head>
          <body style="font-family: sans-serif; background: #0b0f19; color: #fff; padding: 40px; text-align: center;">
            <h1 style="color: #60a5fa;">RFID Student Attendance API Server</h1>
            <p>Backend API and Serial Bridge are running on port ${CONFIG.PORT}.</p>
            <p>Frontend is running on Vite dev server or accessible via web dashboard.</p>
          </body>
        </html>
      `);
    }
  });
});

// Start listening
server.listen(CONFIG.PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 RFID Attendance Server running at http://localhost:${CONFIG.PORT}`);
  console.log(`📡 WebSocket server initialized`);
  console.log(`📦 Database loaded at ${CONFIG.DB_PATH}`);
  console.log(`=======================================================`);

  // Initialize hardware serial bridge
  await initSerialBridge();
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nClosing serial port and database on SIGINT...');
  await disconnectPort();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nClosing serial port and database on SIGTERM...');
  await disconnectPort();
  process.exit(0);
});
