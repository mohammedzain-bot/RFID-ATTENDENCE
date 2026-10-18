export interface Student {
  id: number;
  student_id: string;
  name: string;
  email: string;
  phone?: string;
  class: string;
  department: string;
  roll_number: string;
  rfid_uid: string | null;
  photo_url?: string;
  created_at?: string;
  today_attendance_id?: number;
  today_attendance_time?: string;
  today_status?: string;
  total_attendances?: number;
}

export interface AttendanceRecord {
  id: number;
  student_id: string;
  student_name: string;
  student_email?: string;
  student_class: string;
  student_department: string;
  roll_number: string;
  photo_url?: string;
  rfid_uid: string;
  date: string;
  time: string;
  status: 'present' | 'late' | 'absent';
  remarks?: string;
  created_at?: string;
}

export interface HardwareStatus {
  connected: boolean;
  state: 'connected' | 'waiting' | 'disconnected';
  port: string | null;
  baudRate: number;
  lastScanTime: string | null;
  lastScanUid: string | null;
  totalHardwareScans: number;
  deviceDescription: string | null;
  mode: 'real_hardware' | 'ready_for_hardware';
}

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendancePercentage: number;
  lastScannedStudent: any | null;
  hardwareStatus: HardwareStatus;
  classStats: Array<{
    class: string;
    total_students: number;
    present_today: number;
  }>;
}

export interface ScanResultEvent {
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

export interface SerialLogItem {
  timestamp: string;
  type: 'info' | 'rx' | 'tx' | 'error';
  message: string;
}

export interface SerialPortInfo {
  path: string;
  manufacturer: string;
  serialNumber: string;
  vendorId: string;
  productId: string;
  isLikelyArduino: boolean;
}
