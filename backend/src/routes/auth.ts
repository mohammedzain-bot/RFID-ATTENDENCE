import { Router, Request, Response } from 'express';
import { CONFIG } from '../config';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): any => {
  const { username, password } = req.body;

  if (username === CONFIG.ADMIN_USERNAME && password === CONFIG.ADMIN_PASSWORD) {
    return res.json({
      success: true,
      token: 'admin-auth-token-rfid-demo-2026',
      user: {
        username: CONFIG.ADMIN_USERNAME,
        name: CONFIG.ADMIN_NAME,
        role: 'Administrator'
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid credentials. Default admin username: "admin", password: "admin123"'
  });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response): any => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.includes('admin-auth-token')) {
    return res.json({
      success: true,
      user: {
        username: CONFIG.ADMIN_USERNAME,
        name: CONFIG.ADMIN_NAME,
        role: 'Administrator'
      }
    });
  }

  return res.status(401).json({ success: false, message: 'Unauthorized' });
});

export default router;
