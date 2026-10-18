import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  CreditCard, 
  Edit3, 
  Trash2, 
  Check, 
  Radio, 
  Mail, 
  Phone, 
  GraduationCap, 
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { Student } from '../types';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [studentClass, setStudentClass] = useState('CS-4A');
  const [department, setDepartment] = useState('Computer Science');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [rfidUid, setRfidUid] = useState('');

  // Live "Scan RFID" listener mode
  const [isListeningForCard, setIsListeningForCard] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents({ search, class: classFilter });
      setStudents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [search, classFilter]);

  // Listen for RFID scans on socket to auto-populate RFID UID field when in pairing mode
  useEffect(() => {
    const socket = getSocket();
    const handleScan = (scanResult: any) => {
      if (isListeningForCard && scanResult && scanResult.uid) {
        setRfidUid(scanResult.uid);
        setIsListeningForCard(false);
      }
    };

    socket.on('rfid:scan_result', handleScan);
    return () => {
      socket.off('rfid:scan_result', handleScan);
    };
  }, [isListeningForCard]);

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setStudentId(`STU${String(students.length + 1).padStart(3, '0')}`);
    setRollNumber(String(Math.floor(Math.random() * 50) + 1));
    setStudentClass('CS-4A');
    setDepartment('Computer Science');
    setEmail('');
    setPhone('');
    setPhotoUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300');
    setRfidUid('');
    setIsListeningForCard(false);
    setModalOpen(true);
  };

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    setName(s.name);
    setStudentId(s.student_id);
    setRollNumber(s.roll_number);
    setStudentClass(s.class);
    setDepartment(s.department);
    setEmail(s.email);
    setPhone(s.phone || '');
    setPhotoUrl(s.photo_url || '');
    setRfidUid(s.rfid_uid || '');
    setIsListeningForCard(false);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, {
          name,
          email,
          phone,
          class: studentClass,
          department,
          roll_number: rollNumber,
          rfid_uid: rfidUid || null,
          photo_url: photoUrl
        });
      } else {
        await api.createStudent({
          student_id: studentId,
          name,
          email,
          phone,
          class: studentClass,
          department,
          roll_number: rollNumber,
          rfid_uid: rfidUid || null,
          photo_url: photoUrl
        });
      }
      setModalOpen(false);
      loadStudents();
    } catch (err: any) {
      alert('Error saving student: ' + err.message);
    }
  };

  const handleDelete = async (id: number, studentName: string) => {
    if (!window.confirm(`Are you sure you want to delete student "${studentName}"?`)) return;
    try {
      await api.deleteStudent(id);
      loadStudents();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Student Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage enrolled students, assign RFID cards, and monitor attendance records
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-accent-600 hover:bg-accent-500 text-white shadow-xl shadow-accent-600/30 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Student</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, email, or RFID UID..."
            className="w-full bg-dark-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent-500 transition-colors"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-500 transition-colors"
        >
          <option value="">All Departments & Classes</option>
          <option value="CS-4A">CS-4A (Computer Science)</option>
          <option value="CS-4B">CS-4B (Computer Science)</option>
          <option value="IT-3B">IT-3B (Information Tech)</option>
          <option value="EC-4B">EC-4B (Electronics & Comm)</option>
          <option value="ME-3A">ME-3A (Mechanical)</option>
        </select>

        <button
          onClick={loadStudents}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all self-end sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-accent-400' : ''}`} />
        </button>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {students.map((s) => (
          <div
            key={s.id}
            className="glass-panel glass-card-hover rounded-2xl p-5 flex flex-col justify-between relative group border-white/10"
          >
            {/* Top Row: Photo & Details */}
            <div>
              <div className="flex items-start space-x-3 mb-4">
                <img
                  src={s.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300'}
                  alt={s.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-extrabold text-white truncate font-['Outfit']">{s.name}</h3>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                    <span className="font-mono text-accent-400 font-semibold">{s.student_id}</span>
                    <span>•</span>
                    <span>Roll {s.roll_number}</span>
                  </div>
                  <div className="inline-flex mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-accent-500/10 text-accent-300 border border-accent-500/20">
                    {s.class}
                  </div>
                </div>
              </div>

              {/* Department & Email info */}
              <div className="space-y-1.5 text-xs text-slate-400 border-t border-white/5 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-medium text-slate-300 truncate max-w-[140px]">{s.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-300 truncate max-w-[150px]">{s.email}</span>
                </div>
              </div>

              {/* RFID UID Badge */}
              <div className="mt-3 p-2.5 rounded-xl bg-dark-950/80 border border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <CreditCard className="w-3.5 h-3.5 text-accent-400" />
                  <span>RFID:</span>
                </div>
                {s.rfid_uid ? (
                  <span className="text-xs font-mono font-bold text-accent-300 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">
                    {s.rfid_uid}
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-400 font-medium">Unpaired</span>
                )}
              </div>
            </div>

            {/* Bottom Row: Today's Status & Action Buttons */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <div>
                {s.today_status ? (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Present Today</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    <span>Not Scanned</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => openEditModal(s)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Edit student"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete student"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl glass-panel-glow rounded-3xl p-6 sm:p-8 border border-white/10 my-8 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-accent-500/10 text-accent-400 border border-accent-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {editingStudent ? 'Edit Student Profile' : 'Register New Student'}
                  </h3>
                  <p className="text-xs text-slate-400">Complete student details and assign RFID card</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Student ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    placeholder="e.g. STU001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500 font-mono disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Roll Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Class / Section *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-4A"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Photo URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500"
                  />
                </div>
              </div>

              {/* RFID UID Assignment Section */}
              <div className="bg-dark-950/80 p-4 rounded-2xl border border-accent-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-accent-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4 text-accent-400" />
                    <span>RFID Card Assignment</span>
                  </label>
                  
                  {/* Scan RFID button */}
                  <button
                    type="button"
                    onClick={() => setIsListeningForCard(!isListeningForCard)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isListeningForCard
                        ? 'bg-amber-500 text-black animate-pulse shadow-lg shadow-amber-500/30'
                        : 'bg-accent-600 hover:bg-accent-500 text-white'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>{isListeningForCard ? 'Tap RFID Card Now...' : 'Scan RFID Card'}</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. A3:B4:C5:D6"
                    value={rfidUid}
                    onChange={(e) => setRfidUid(e.target.value.toUpperCase())}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-accent-300 font-bold focus:outline-none focus:border-accent-500"
                  />
                  {rfidUid && (
                    <button
                      type="button"
                      onClick={() => setRfidUid('')}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {isListeningForCard && (
                  <p className="text-xs text-amber-300 flex items-center space-x-1.5 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Reader is listening! Tap your physical RFID card on the reader to auto-capture UID.</span>
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-accent-600 hover:bg-accent-500 text-white shadow-xl shadow-accent-600/30 transition-all"
                >
                  {editingStudent ? 'Save Changes' : 'Register Student'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
