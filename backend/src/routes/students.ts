import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/students - List students with today's attendance status
router.get('/', (req: Request, res: Response): any => {
  try {
    const search = ((req.query.search as string) || '').trim();
    const studentClass = (req.query.class as string) || '';
    const department = (req.query.department as string) || '';
    const today = new Date().toISOString().split('T')[0];

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (search) {
      whereClauses.push('(s.name LIKE ? OR s.student_id LIKE ? OR s.email LIKE ? OR s.rfid_uid LIKE ? OR s.roll_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (studentClass) {
      whereClauses.push('s.class = ?');
      params.push(studentClass);
    }

    if (department) {
      whereClauses.push('s.department = ?');
      params.push(department);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        s.*,
        a.id as today_attendance_id,
        a.time as today_attendance_time,
        a.status as today_status,
        (SELECT COUNT(*) FROM attendance WHERE student_id = s.student_id) as total_attendances
      FROM students s
      LEFT JOIN attendance a ON s.student_id = a.student_id AND a.date = ?
      ${whereSQL}
      ORDER BY s.student_id ASC
    `;

    const students = db.prepare(query).all(today, ...params);
    return res.json({ success: true, students });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/students/:id - Get student details & recent attendance
router.get('/:id', (req: Request, res: Response): any => {
  try {
    const id = req.params.id;
    const student = db.prepare(`
      SELECT * FROM students WHERE id = ? OR student_id = ?
    `).get(id, id) as any;

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const attendanceHistory = db.prepare(`
      SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC, time DESC LIMIT 30
    `).all(student.student_id);

    return res.json({
      success: true,
      student,
      attendanceHistory
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/students - Register new student
router.post('/', (req: Request, res: Response): any => {
  try {
    const {
      student_id,
      name,
      email,
      phone,
      class: studentClass,
      department,
      roll_number,
      rfid_uid,
      photo_url
    } = req.body;

    if (!student_id || !name || !email || !studentClass || !department || !roll_number) {
      return res.status(400).json({
        success: false,
        message: 'Name, Student ID, Email, Class, Department, and Roll Number are required fields.'
      });
    }

    // Check duplicate student_id
    const existing = db.prepare('SELECT id FROM students WHERE student_id = ?').get(student_id);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Student ID "${student_id}" is already registered.`
      });
    }

    // Check duplicate RFID UID if provided
    const cleanUid = rfid_uid ? rfid_uid.trim().toUpperCase() : null;
    if (cleanUid) {
      const existingRfid = db.prepare('SELECT student_id, name FROM students WHERE UPPER(rfid_uid) = ?').get(cleanUid) as any;
      if (existingRfid) {
        return res.status(400).json({
          success: false,
          message: `RFID UID "${cleanUid}" is already assigned to ${existingRfid.name} (${existingRfid.student_id}).`
        });
      }
    }

    const defaultPhoto = photo_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80`;

    const info = db.prepare(`
      INSERT INTO students (student_id, name, email, phone, class, department, roll_number, rfid_uid, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(student_id, name, email, phone || null, studentClass, department, roll_number, cleanUid, defaultPhoto);

    return res.json({
      success: true,
      message: 'Student registered successfully.',
      student: {
        id: Number(info.lastInsertRowid),
        student_id,
        name,
        email,
        phone,
        class: studentClass,
        department,
        roll_number,
        rfid_uid: cleanUid,
        photo_url: defaultPhoto
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/students/:id - Update student
router.put('/:id', (req: Request, res: Response): any => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const {
      name,
      email,
      phone,
      class: studentClass,
      department,
      roll_number,
      rfid_uid,
      photo_url
    } = req.body;

    const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const cleanUid = rfid_uid ? rfid_uid.trim().toUpperCase() : null;
    if (cleanUid) {
      const existingRfid = db.prepare('SELECT id, name FROM students WHERE UPPER(rfid_uid) = ? AND id != ?').get(cleanUid, id) as any;
      if (existingRfid) {
        return res.status(400).json({
          success: false,
          message: `RFID UID "${cleanUid}" is already assigned to ${existingRfid.name}.`
        });
      }
    }

    db.prepare(`
      UPDATE students 
      SET name = ?, email = ?, phone = ?, class = ?, department = ?, roll_number = ?, rfid_uid = ?, photo_url = ?
      WHERE id = ?
    `).run(
      name || existing.name,
      email || existing.email,
      phone !== undefined ? phone : existing.phone,
      studentClass || existing.class,
      department || existing.department,
      roll_number || existing.roll_number,
      cleanUid !== undefined ? cleanUid : existing.rfid_uid,
      photo_url || existing.photo_url,
      id
    );

    return res.json({
      success: true,
      message: 'Student details updated successfully.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', (req: Request, res: Response): any => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const result = db.prepare('DELETE FROM students WHERE id = ?').run(id);

    if (result.changes > 0) {
      return res.json({ success: true, message: 'Student removed successfully.' });
    } else {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/students/:id/assign-rfid - Assign or re-assign RFID UID
router.post('/:id/assign-rfid', (req: Request, res: Response): any => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { rfid_uid } = req.body;

    if (!rfid_uid) {
      return res.status(400).json({ success: false, message: 'rfid_uid is required.' });
    }

    const cleanUid = rfid_uid.trim().toUpperCase();

    // Check if UID is already in use by another student
    const existing = db.prepare('SELECT id, name FROM students WHERE UPPER(rfid_uid) = ? AND id != ?').get(cleanUid, id) as any;
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `RFID UID "${cleanUid}" is already assigned to ${existing.name}.`
      });
    }

    const update = db.prepare('UPDATE students SET rfid_uid = ? WHERE id = ?').run(cleanUid, id);
    if (update.changes === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    return res.json({
      success: true,
      message: `RFID Card ${cleanUid} successfully paired with student.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
