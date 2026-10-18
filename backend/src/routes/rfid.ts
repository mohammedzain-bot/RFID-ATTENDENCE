import { Router, Request, Response } from 'express';
import { processRFIDScan } from '../services/rfidService';
import { db } from '../db';

const router = Router();

// POST /api/rfid/scan - Primary API endpoint called by bridge or external clients
router.post('/scan', (req: Request, res: Response): any => {
  const { uid } = req.body;

  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invalid request: "uid" string parameter is required.'
    });
  }

  const result = processRFIDScan(uid, 'hardware');
  return res.json(result);
});

// POST /api/rfid/simulate - For testing/demo mode with clearly labeled source
router.post('/simulate', (req: Request, res: Response): any => {
  const { uid, studentId } = req.body;

  let targetUid = uid;

  // If studentId provided, look up their UID
  if (!targetUid && studentId) {
    const student = db.prepare('SELECT rfid_uid FROM students WHERE student_id = ?').get(studentId) as any;
    if (student && student.rfid_uid) {
      targetUid = student.rfid_uid;
    } else {
      return res.status(404).json({
        success: false,
        message: `No RFID UID assigned to student ID: ${studentId}`
      });
    }
  }

  if (!targetUid) {
    return res.status(400).json({
      success: false,
      message: 'Provide either "uid" or "studentId" for simulation.'
    });
  }

  const result = processRFIDScan(targetUid, 'simulation');
  return res.json(result);
});

// GET /api/rfid/logs - Get recent scan activity logs
router.get('/logs', (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
  const logs = db.prepare(`
    SELECT l.*, s.name as student_name, s.class as student_class
    FROM rfid_scan_logs l
    LEFT JOIN students s ON l.student_id = s.student_id
    ORDER BY l.id DESC
    LIMIT ?
  `).all(limit);

  res.json({ success: true, logs });
});

export default router;
