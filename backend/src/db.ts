import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './config';

const dbDir = path.dirname(CONFIG.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(CONFIG.DB_PATH);

// Enable foreign keys and WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      class TEXT NOT NULL,
      department TEXT NOT NULL,
      roll_number TEXT NOT NULL,
      rfid_uid TEXT UNIQUE,
      photo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      rfid_uid TEXT NOT NULL,
      date TEXT NOT NULL,        -- Format: YYYY-MM-DD
      time TEXT NOT NULL,        -- Format: HH:MM:SS
      status TEXT NOT NULL,      -- 'present', 'late', 'absent'
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
      UNIQUE(student_id, date)   -- Enforce attendance rule: one scan per student per day
    );

    CREATE TABLE IF NOT EXISTS rfid_scan_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT NOT NULL,
      student_id TEXT,
      status TEXT NOT NULL,      -- 'success', 'duplicate', 'unknown', 'error'
      message TEXT NOT NULL,
      scan_date TEXT NOT NULL,
      scan_time TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed sample students if table is empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number };
  if (countRow.count === 0) {
    seedInitialData();
  }
}

function seedInitialData() {
  const insertStudent = db.prepare(`
    INSERT INTO students (student_id, name, email, phone, class, department, roll_number, rfid_uid, photo_url)
    VALUES (@student_id, @name, @email, @phone, @class, @department, @roll_number, @rfid_uid, @photo_url)
  `);

  const students = [
    {
      student_id: 'STU001',
      name: 'Rahul Kumar',
      email: 'rahul.kumar@college.edu',
      phone: '+91 98765 43210',
      class: 'CS-4A',
      department: 'Computer Science',
      roll_number: '24',
      rfid_uid: 'A3:B4:C5:D6',
      photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80'
    },
    {
      student_id: 'STU002',
      name: 'Priya Sharma',
      email: 'priya.sharma@college.edu',
      phone: '+91 98765 43211',
      class: 'CS-4A',
      department: 'Computer Science',
      roll_number: '18',
      rfid_uid: 'B1:C2:D3:E4',
      photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80'
    },
    {
      student_id: 'STU003',
      name: 'Alex Chen',
      email: 'alex.chen@college.edu',
      phone: '+1 555-019-2834',
      class: 'IT-3B',
      department: 'Information Technology',
      roll_number: '05',
      rfid_uid: '99:AA:BB:CC',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
    },
    {
      student_id: 'STU004',
      name: 'Fatima Zahra',
      email: 'fatima.zahra@college.edu',
      phone: '+91 98765 43213',
      class: 'EC-4B',
      department: 'Electronics & Comm',
      roll_number: '12',
      rfid_uid: 'E5:F6:A7:B8',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
    },
    {
      student_id: 'STU005',
      name: 'Ananya Patel',
      email: 'ananya.patel@college.edu',
      phone: '+91 98765 43214',
      class: 'CS-4B',
      department: 'Computer Science',
      roll_number: '09',
      rfid_uid: '11:22:33:44',
      photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80'
    },
    {
      student_id: 'STU006',
      name: 'David Miller',
      email: 'david.miller@college.edu',
      phone: '+1 555-018-9921',
      class: 'ME-3A',
      department: 'Mechanical Engineering',
      roll_number: '42',
      rfid_uid: '55:66:77:88',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80'
    },
    {
      student_id: 'STU007',
      name: 'Sneha Reddy',
      email: 'sneha.reddy@college.edu',
      phone: '+91 98765 43216',
      class: 'IT-3B',
      department: 'Information Technology',
      roll_number: '31',
      rfid_uid: 'A1:B2:C3:D4',
      photo_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80'
    },
    {
      student_id: 'STU008',
      name: 'Rohan Gupta',
      email: 'rohan.gupta@college.edu',
      phone: '+91 98765 43217',
      class: 'CS-4B',
      department: 'Computer Science',
      roll_number: '39',
      rfid_uid: '3C:4D:5E:6F',
      photo_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80'
    }
  ];

  const insertMany = db.transaction((list: typeof students) => {
    for (const s of list) {
      insertStudent.run(s);
    }
  });

  insertMany(students);

  // Pre-seed some historical attendance records for the past 3 days and earlier today
  const insertAttendance = db.prepare(`
    INSERT OR IGNORE INTO attendance (student_id, rfid_uid, date, time, status, remarks)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];

  const dToday = formatYMD(now);
  const dYesterday = formatYMD(new Date(now.getTime() - 86400000));
  const d2DaysAgo = formatYMD(new Date(now.getTime() - 2 * 86400000));

  // Today initial records (3 students already tapped in morning)
  insertAttendance.run('STU001', 'A3:B4:C5:D6', dToday, '08:45:12', 'present', 'Morning session on time');
  insertAttendance.run('STU002', 'B1:C2:D3:E4', dToday, '08:52:40', 'present', 'Morning session on time');
  insertAttendance.run('STU004', 'E5:F6:A7:B8', dToday, '09:05:19', 'late', 'Marked late (after 9:00 AM)');

  // Yesterday records
  insertAttendance.run('STU001', 'A3:B4:C5:D6', dYesterday, '08:50:11', 'present', 'Verified RFID');
  insertAttendance.run('STU002', 'B1:C2:D3:E4', dYesterday, '08:55:04', 'present', 'Verified RFID');
  insertAttendance.run('STU003', '99:AA:BB:CC', dYesterday, '08:48:33', 'present', 'Verified RFID');
  insertAttendance.run('STU005', '11:22:33:44', dYesterday, '09:12:00', 'late', 'Late');
  insertAttendance.run('STU006', '55:66:77:88', dYesterday, '08:59:15', 'present', 'Verified RFID');

  // 2 days ago records
  insertAttendance.run('STU001', 'A3:B4:C5:D6', d2DaysAgo, '08:40:22', 'present', 'Verified RFID');
  insertAttendance.run('STU003', '99:AA:BB:CC', d2DaysAgo, '08:44:19', 'present', 'Verified RFID');
  insertAttendance.run('STU004', 'E5:F6:A7:B8', d2DaysAgo, '08:58:30', 'present', 'Verified RFID');
  insertAttendance.run('STU007', 'A1:B2:C3:D4', d2DaysAgo, '08:50:50', 'present', 'Verified RFID');
}
