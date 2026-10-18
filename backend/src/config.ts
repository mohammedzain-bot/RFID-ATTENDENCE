import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  DB_PATH: process.env.DB_PATH || path.resolve(__dirname, '../../database/attendance.db'),
  BAUD_RATE: process.env.BAUD_RATE ? parseInt(process.env.BAUD_RATE, 10) : 9600,
  AUTO_CONNECT_SERIAL: process.env.AUTO_CONNECT_SERIAL !== 'false',
  DEFAULT_SERIAL_PORT: process.env.SERIAL_PORT || '',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  ADMIN_NAME: 'System Administrator'
};
