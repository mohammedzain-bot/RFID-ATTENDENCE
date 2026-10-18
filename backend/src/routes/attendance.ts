import { Router, Request, Response } from 'express';
import { db } from '../db';
import { getHardwareStatus } from '../serialBridge';
import { broadcastAttendanceUpdated } from '../socket';

const router = Router();

// GET /api/attendance - List attendance history with filtering, search, sorting & pagination
router.get('/', (req: Request, res: Response): any => {
  try {
    const search = ((req.query.search as string) || '').trim();
    const date = (req.query.date as string) || '';
    const studentClass = (req.query.class as string) || '';
    const status = (req.query.status as string) || '';
    const sortBy = (req.query.sortBy as string) || 'time';
    const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (search) {
      whereClauses.push('(s.name LIKE ? OR s.student_id LIKE ? OR a.rfid_uid LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (date) {
      whereClauses.push('a.date = ?');
      params.push(date);
    }

    if (studentClass) {
      whereClauses.push('s.class = ?');
      params.push(studentClass);
    }

    if (status) {
      whereClauses.push('a.status = ?');
      params.push(status);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      ${whereSQL}
    `;
    const countRow = db.prepare(countQuery).get(...params) as { total: number };
    const totalRecords = countRow ? countRow.total : 0;

    // Allowed sort columns
    let orderColumn = 'a.date DESC, a.time';
    if (sortBy === 'name') orderColumn = 's.name';
    else if (sortBy === 'studentId') orderColumn = 's.student_id';
    else if (sortBy === 'class') orderColumn = 's.class';
    else if (sortBy === 'date') orderColumn = 'a.date';
    else if (sortBy === 'status') orderColumn = 'a.status';
    else if (sortBy === 'time') orderColumn = 'a.time';

    const dataQuery = `
      SELECT 
        a.id,
        a.student_id,
        s.name as student_name,
        s.email as student_email,
        s.class as student_class,
        s.department as student_department,
        s.roll_number,
        s.photo_url,
        a.rfid_uid,
        a.date,
        a.time,
        a.status,
        a.remarks,
        a.created_at
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      ${whereSQL}
      ORDER BY ${orderColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const records = db.prepare(dataQuery).all(...params, limit, offset);

    return res.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit) || 1
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/stats - Dashboard summary metrics
router.get('/stats', (req: Request, res: Response): any => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Total Students
    const totalStudentsRow = db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number };
    const totalStudents = totalStudentsRow.count;

    // Present Today (any entry today with 'present' or 'late')
    const presentTodayRow = db.prepare(`
      SELECT COUNT(DISTINCT student_id) as count 
      FROM attendance 
      WHERE date = ? AND (status = 'present' OR status = 'late')
    `).get(today) as { count: number };
    const presentToday = presentTodayRow.count;

    const absentToday = Math.max(totalStudents - presentToday, 0);
    const attendancePercentage = totalStudents > 0 
      ? parseFloat(((presentToday / totalStudents) * 100).toFixed(1)) 
      : 0;

    // Last scanned student
    const lastScan = db.prepare(`
      SELECT 
        a.id,
        a.student_id,
        s.name,
        s.class,
        s.department,
        s.roll_number,
        s.photo_url,
        a.rfid_uid,
        a.date,
        a.time,
        a.status,
        a.remarks
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      ORDER BY a.id DESC
      LIMIT 1
    `).get() as any;

    // Hardware status
    const hw = getHardwareStatus();

    // Class-wise breakdown for today
    const classStats = db.prepare(`
      SELECT 
        s.class,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT a.id) as present_today
      FROM students s
      LEFT JOIN attendance a ON s.student_id = a.student_id AND a.date = ?
      GROUP BY s.class
    `).all(today);

    return res.json({
      success: true,
      stats: {
        totalStudents,
        presentToday,
        absentToday,
        attendancePercentage,
        lastScannedStudent: lastScan || null,
        hardwareStatus: hw,
        classStats
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/reports - Analytics for reports page
router.get('/reports', (req: Request, res: Response): any => {
  try {
    // 1. Last 7 days attendance trend
    const last7Days = db.prepare(`
      SELECT 
        a.date,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
        COUNT(a.id) as total_present
      FROM attendance a
      GROUP BY a.date
      ORDER BY a.date DESC
      LIMIT 7
    `).all().reverse();

    // 2. Student attendance percentage summary
    const studentRates = db.prepare(`
      SELECT 
        s.student_id,
        s.name,
        s.class,
        s.department,
        COUNT(a.id) as days_attended,
        (SELECT COUNT(DISTINCT date) FROM attendance) as total_days_recorded
      FROM students s
      LEFT JOIN attendance a ON s.student_id = a.student_id
      GROUP BY s.student_id
      ORDER BY days_attended DESC
    `).all();

    // 3. Department-wise summary
    const departmentStats = db.prepare(`
      SELECT 
        s.department,
        COUNT(DISTINCT s.id) as total_enrolled,
        COUNT(a.id) as total_attendances
      FROM students s
      LEFT JOIN attendance a ON s.student_id = a.student_id
      GROUP BY s.department
    `).all();

    return res.json({
      success: true,
      trend: last7Days,
      studentRates,
      departmentStats
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/export - CSV download
router.get('/export', (req: Request, res: Response): any => {
  try {
    const date = (req.query.date as string) || '';
    const studentClass = (req.query.class as string) || '';

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (date) {
      whereClauses.push('a.date = ?');
      params.push(date);
    }
    if (studentClass) {
      whereClauses.push('s.class = ?');
      params.push(studentClass);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const records = db.prepare(`
      SELECT 
        s.name,
        s.student_id,
        s.roll_number,
        s.class,
        s.department,
        a.date,
        a.time,
        a.rfid_uid,
        a.status,
        a.remarks
      FROM attendance a
      JOIN students s ON a.student_id = s.student_id
      ${whereSQL}
      ORDER BY a.date DESC, a.time DESC
    `).all(...params) as any[];

    // Build CSV
    const headers = ['Student Name', 'Student ID', 'Roll Number', 'Class', 'Department', 'Date', 'Time', 'RFID UID', 'Status', 'Remarks'];
    const rows = records.map(r => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.student_id}"`,
      `"${r.roll_number}"`,
      `"${r.class}"`,
      `"${r.department}"`,
      `"${r.date}"`,
      `"${r.time}"`,
      `"${r.rfid_uid}"`,
      `"${r.status.toUpperCase()}"`,
      `"${(r.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${Date.now()}.csv"`);
    return res.send(csvContent);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/attendance/manual - Admin manual check-in
router.post('/manual', (req: Request, res: Response): any => {
  const { studentId, date, time, status, remarks } = req.body;

  if (!studentId) {
    return res.status(400).json({ success: false, message: 'Student ID is required.' });
  }

  const student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(studentId) as any;
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found.' });
  }

  const targetDate = date || new Date().toISOString().split('T')[0];
  const targetTime = time || new Date().toTimeString().split(' ')[0];
  const targetStatus = status || 'present';
  const targetRemarks = remarks || 'Manual entry by Administrator';
  const rfidUid = student.rfid_uid || 'MANUAL_ENTRY';

  try {
    const info = db.prepare(`
      INSERT INTO attendance (student_id, rfid_uid, date, time, status, remarks)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, date) DO UPDATE SET
        time = excluded.time,
        status = excluded.status,
        remarks = excluded.remarks
    `).run(studentId, rfidUid, targetDate, targetTime, targetStatus, targetRemarks);

    broadcastAttendanceUpdated();

    return res.json({
      success: true,
      message: 'Attendance saved successfully.',
      attendanceId: info.lastInsertRowid
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/attendance/:id
router.delete('/:id', (req: Request, res: Response): any => {
  const id = parseInt(req.params.id as string, 10);
  const result = db.prepare('DELETE FROM attendance WHERE id = ?').run(id);

  if (result.changes > 0) {
    broadcastAttendanceUpdated();
    return res.json({ success: true, message: 'Attendance record deleted.' });
  } else {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }
});

export default router;
