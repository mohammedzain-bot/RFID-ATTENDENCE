import { DashboardStats, AttendanceRecord, Student, SerialPortInfo, HardwareStatus } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' && window.location.port !== '5000' ? 'http://localhost:5000' : '');
const API_BASE = `${BASE_URL}/api`;

export const api = {
  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/attendance/stats`);
    const json = await res.json();
    return json.stats;
  },

  // Attendance
  async getAttendance(params?: {
    search?: string;
    date?: string;
    class?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AttendanceRecord[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.append(k, String(v));
      });
    }
    const res = await fetch(`${API_BASE}/attendance?${query.toString()}`);
    const json = await res.json();
    return { data: json.data || [], pagination: json.pagination };
  },

  async deleteAttendance(id: number): Promise<boolean> {
    const res = await fetch(`${API_BASE}/attendance/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success;
  },

  async markAttendanceManual(data: {
    studentId: string;
    date?: string;
    time?: string;
    status?: string;
    remarks?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/attendance/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Students
  async getStudents(params?: { search?: string; class?: string; department?: string }): Promise<Student[]> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.append(k, String(v));
      });
    }
    const res = await fetch(`${API_BASE}/students?${query.toString()}`);
    const json = await res.json();
    return json.students || [];
  },

  async getStudent(id: string | number): Promise<{ student: Student; attendanceHistory: AttendanceRecord[] }> {
    const res = await fetch(`${API_BASE}/students/${id}`);
    return res.json();
  },

  async createStudent(student: Partial<Student>): Promise<any> {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
    return res.json();
  },

  async updateStudent(id: number, student: Partial<Student>): Promise<any> {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
    return res.json();
  },

  async deleteStudent(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async assignRfid(id: number, rfid_uid: string): Promise<any> {
    const res = await fetch(`${API_BASE}/students/${id}/assign-rfid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfid_uid })
    });
    return res.json();
  },

  // RFID simulation & trigger
  async simulateScan(uid?: string, studentId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/rfid/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, studentId })
    });
    return res.json();
  },

  // Hardware bridge
  async getHardwareStatus(): Promise<HardwareStatus> {
    const res = await fetch(`${API_BASE}/hardware/status`);
    const json = await res.json();
    return json.hardware;
  },

  async getPorts(): Promise<SerialPortInfo[]> {
    const res = await fetch(`${API_BASE}/hardware/ports`);
    const json = await res.json();
    return json.ports || [];
  },

  async connectPort(port: string, baudRate: number = 9600): Promise<any> {
    const res = await fetch(`${API_BASE}/hardware/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port, baudRate })
    });
    return res.json();
  },

  async disconnectPort(): Promise<any> {
    const res = await fetch(`${API_BASE}/hardware/disconnect`, { method: 'POST' });
    return res.json();
  },

  // Reports
  async getReports(): Promise<any> {
    const res = await fetch(`${API_BASE}/attendance/reports`);
    return res.json();
  },

  getExportUrl(date?: string, studentClass?: string): string {
    const q = new URLSearchParams();
    if (date) q.append('date', date);
    if (studentClass) q.append('class', studentClass);
    return `${API_BASE}/attendance/export?${q.toString()}`;
  },

  // Auth
  async login(username: string, password: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  }
};
