import { Router, Request, Response } from 'express';
import { getHardwareStatus, listAvailablePorts, connectPort, disconnectPort } from '../serialBridge';
import { broadcastSerialLog } from '../socket';

const router = Router();

// GET /api/hardware/status - Live hardware state
router.get('/status', (req: Request, res: Response) => {
  const status = getHardwareStatus();
  res.json({ success: true, hardware: status });
});

// GET /api/hardware/ports - List COM ports on the system
router.get('/ports', async (req: Request, res: Response) => {
  const ports = await listAvailablePorts();
  res.json({ success: true, ports });
});

// POST /api/hardware/connect - Connect to selected port
router.post('/connect', async (req: Request, res: Response): Promise<any> => {
  const { port, baudRate } = req.body;

  if (!port) {
    return res.status(400).json({ success: false, message: 'Port path is required (e.g. COM3 or /dev/ttyUSB0)' });
  }

  const result = await connectPort(port, baudRate ? parseInt(baudRate, 10) : 9600);
  return res.json({
    success: result.success,
    message: result.message,
    hardware: getHardwareStatus()
  });
});

// POST /api/hardware/disconnect - Disconnect current port
router.post('/disconnect', async (req: Request, res: Response) => {
  const result = await disconnectPort();
  res.json({
    success: result.success,
    message: result.message,
    hardware: getHardwareStatus()
  });
});

// POST /api/hardware/log - Add client message to serial console
router.post('/log', (req: Request, res: Response) => {
  const { message, type } = req.body;
  if (message) {
    broadcastSerialLog(message, type || 'info');
  }
  res.json({ success: true });
});

export default router;
