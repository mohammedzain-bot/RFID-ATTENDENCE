import { db } from '../db';
import { broadcastRFIDScan, broadcastAttendanceUpdated } from '../socket';

export interface ProcessScanResult {
  success: boolean;
  status: 'present' | 'duplicate' | 'unknown' | 'error';
  message: string;
  uid: string;
  student?: {
    id: number;
    studentId: string;
    name: string;
    email: string;
    phone: string;
    class: string;
    department: string;
    rollNumber: string;
    rfidUid: string;
    photoUrl?: string;
  };
  attendance?: {
    id?: number;
    status: string;
    date: string;
    time: string;
    remarks?: string;
  };
  timestamp: string;
  source: 'hardware' | 'simulation';
}

export function processRFIDScan(rawUid: string, source: 'hardware' | 'simulation' = 'hardware'): ProcessScanResult {
  const uid = rawUid.trim().toUpperCase();
  const now = new Date();
  
  // Format local date and time: YYYY-MM-DD and HH:MM:SS
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const currentTime = `${hours}:${minutes}:${seconds}`;

  // 1. Search for student by RFID UID
  const studentRow = db.prepare(`
    SELECT * FROM students WHERE UPPER(rfid_uid) = ?
  `).get(uid) as any;

  if (!studentRow) {
    // Unregistered card
    const message = 'RFID card not registered.';
    
    // Log scan
    db.prepare(`
      INSERT INTO rfid_scan_logs (uid, student_id, status, message, scan_date, scan_time)
      VALUES (?, NULL, 'unknown', ?, ?, ?)
    `).run(uid, message, currentDate, currentTime);

    const result: ProcessScanResult = {
      success: false,
      status: 'unknown',
      message,
      uid,
      timestamp: now.toISOString(),
      source
    };

    broadcastRFIDScan(result);
    return result;
  }

  const student = {
    id: studentRow.id,
    studentId: studentRow.student_id,
    name: studentRow.name,
    email: studentRow.email,
    phone: studentRow.phone,
    class: studentRow.class,
    department: studentRow.department,
    rollNumber: studentRow.roll_number,
    rfidUid: studentRow.rfid_uid,
    photoUrl: studentRow.photo_url
  };

  // 2. Check if already marked present today
  const existingAttendance = db.prepare(`
    SELECT * FROM attendance WHERE student_id = ? AND date = ?
  `).get(student.studentId, currentDate) as any;

  if (existingAttendance) {
    const message = 'Already marked present today.';

    // Log scan
    db.prepare(`
      INSERT INTO rfid_scan_logs (uid, student_id, status, message, scan_date, scan_time)
      VALUES (?, ?, 'duplicate', ?, ?, ?)
    `).run(uid, student.studentId, message, currentDate, currentTime);

    const result: ProcessScanResult = {
      success: true,
      status: 'duplicate',
      message,
      uid,
      student,
      attendance: {
        id: existingAttendance.id,
        status: existingAttendance.status,
        date: existingAttendance.date,
        time: existingAttendance.time,
        remarks: existingAttendance.remarks || 'Already logged'
      },
      timestamp: now.toISOString(),
      source
    };

    broadcastRFIDScan(result);
    return result;
  }

  // 3. First valid scan of the day = PRESENT
  // Check if late (e.g. after 09:30 AM is optionally labeled late, but status counts as present/attended)
  const isLate = (now.getHours() > 9) || (now.getHours() === 9 && now.getMinutes() > 30);
  const status = isLate ? 'late' : 'present';
  const remarks = isLate ? 'Marked late' : 'First scan on time';

  const insertResult = db.prepare(`
    INSERT INTO attendance (student_id, rfid_uid, date, time, status, remarks)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(student.studentId, uid, currentDate, currentTime, status, remarks);

  const message = 'Attendance recorded successfully.';

  // Log scan
  db.prepare(`
    INSERT INTO rfid_scan_logs (uid, student_id, status, message, scan_date, scan_time)
    VALUES (?, ?, 'success', ?, ?, ?)
  `).run(uid, student.studentId, message, currentDate, currentTime);

  const result: ProcessScanResult = {
    success: true,
    status: 'present',
    message,
    uid,
    student,
    attendance: {
      id: Number(insertResult.lastInsertRowid),
      status,
      date: currentDate,
      time: currentTime,
      remarks
    },
    timestamp: now.toISOString(),
    source
  };

  broadcastRFIDScan(result);
  broadcastAttendanceUpdated();
  return result;
}
