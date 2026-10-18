import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Clock, 
  BookOpen, 
  CreditCard,
  RefreshCw,
  Plus
} from 'lucide-react';
import { AttendanceRecord } from '../types';
import { api } from '../services/api';

interface AttendanceTableProps {
  refreshTrigger?: number;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({ refreshTrigger }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Manual Add Modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualStatus, setManualStatus] = useState('present');
  const [manualRemarks, setManualRemarks] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getAttendance({
        search,
        date: dateFilter,
        class: classFilter,
        status: statusFilter,
        sortBy,
        sortOrder,
        page,
        limit: 10
      });
      setRecords(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.totalRecords);
      }
    } catch (e) {
      console.error('Failed to load attendance:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, dateFilter, classFilter, statusFilter, sortBy, sortOrder, page, refreshTrigger]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this attendance record?')) return;
    try {
      await api.deleteAttendance(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) return;
    try {
      await api.markAttendanceManual({
        studentId: manualStudentId,
        status: manualStatus,
        remarks: manualRemarks
      });
      setShowManualModal(false);
      setManualStudentId('');
      setManualRemarks('');
      loadData();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(col);
      setSortOrder('DESC');
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
      
      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Attendance Logs</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time tap records, timestamps, and class verification
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Manual Entry Button */}
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-accent-400" />
            <span>Manual Check-in</span>
          </button>

          {/* Export CSV */}
          <a
            href={api.getExportUrl(dateFilter, classFilter)}
            download
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/25 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          {/* Refresh */}
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all"
            title="Reload table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-accent-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-dark-900/60 p-3.5 rounded-2xl border border-white/5">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, ID, or UID..."
            className="w-full bg-dark-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent-500 transition-colors"
          />
        </div>

        {/* Date Filter */}
        <div className="relative">
          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="w-full bg-dark-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent-500 transition-colors"
          />
        </div>

        {/* Class Filter */}
        <select
          value={classFilter}
          onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
          className="bg-dark-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-500 transition-colors"
        >
          <option value="">All Classes</option>
          <option value="CS-4A">CS-4A (Computer Science)</option>
          <option value="CS-4B">CS-4B (Computer Science)</option>
          <option value="IT-3B">IT-3B (Information Tech)</option>
          <option value="EC-4B">EC-4B (Electronics)</option>
          <option value="ME-3A">ME-3A (Mechanical)</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-dark-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-500 transition-colors"
        >
          <option value="">All Statuses</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
        </select>

      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-dark-950/40">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/5 text-slate-400 font-semibold border-b border-white/10 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Student</th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('studentId')}>
                <div className="flex items-center space-x-1">
                  <span>Student ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('class')}>
                <div className="flex items-center space-x-1">
                  <span>Class</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Department</th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('date')}>
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('time')}>
                <div className="flex items-center space-x-1">
                  <span>Time</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">RFID UID</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {records.length > 0 ? (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  {/* Student */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={r.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300'}
                        alt={r.student_name}
                        className="w-8 h-8 rounded-full object-cover border border-white/20"
                      />
                      <div>
                        <div className="font-bold text-white text-sm">{r.student_name}</div>
                        <div className="text-[11px] text-slate-400">Roll: {r.roll_number}</div>
                      </div>
                    </div>
                  </td>

                  {/* Student ID */}
                  <td className="py-3 px-4 font-mono font-medium text-slate-300">
                    {r.student_id}
                  </td>

                  {/* Class */}
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    {r.student_class}
                  </td>

                  {/* Department */}
                  <td className="py-3 px-4 text-slate-300 truncate max-w-[140px]">
                    {r.student_department}
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                    {r.date}
                  </td>

                  {/* Time */}
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-400 whitespace-nowrap">
                    {r.time}
                  </td>

                  {/* RFID UID */}
                  <td className="py-3 px-4 font-mono text-accent-300 text-[11px]">
                    {r.rfid_uid}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      r.status === 'present'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      {r.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  {loading ? 'Loading attendance logs...' : 'No attendance records match the selected filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
        <div>
          Showing page <span className="font-bold text-white">{page}</span> of{' '}
          <span className="font-bold text-white">{totalPages}</span> ({totalRecords} total entries)
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel-glow rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="text-xl font-bold text-white">Manual Attendance Override</h3>
            <p className="text-xs text-slate-400">
              For administrative check-ins if student forgot their RFID card.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Student ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STU001"
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value.toUpperCase())}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Status</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500"
                >
                  <option value="present">Present (On Time)</option>
                  <option value="late">Late</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Card forgotten at home"
                  value={manualRemarks}
                  onChange={(e) => setManualRemarks(e.target.value)}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/30"
                >
                  Record Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
