import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Award, 
  FileSpreadsheet,
  Building,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportDate, setExportDate] = useState('');
  const [exportClass, setExportClass] = useState('');

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReports();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Attendance Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Turnout trends, student rates, department metrics, and CSV reporting
          </p>
        </div>

        <button
          onClick={loadReports}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 self-start sm:self-auto"
          title="Reload analytics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-accent-400' : ''}`} />
        </button>
      </div>

      {/* Export CSV Control Box */}
      <div className="glass-panel-glow rounded-3xl p-6 border border-accent-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-accent-500/20 text-accent-400 border border-accent-500/40">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Generate Attendance CSV Export</h3>
            <p className="text-xs text-slate-400">Download formatted spreadsheet reports compatible with Excel and Google Sheets</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={exportDate}
            onChange={(e) => setExportDate(e.target.value)}
            className="bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-500"
          />

          <select
            value={exportClass}
            onChange={(e) => setExportClass(e.target.value)}
            className="bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-500"
          >
            <option value="">All Classes</option>
            <option value="CS-4A">CS-4A</option>
            <option value="CS-4B">CS-4B</option>
            <option value="IT-3B">IT-3B</option>
            <option value="EC-4B">EC-4B</option>
            <option value="ME-3A">ME-3A</option>
          </select>

          <a
            href={api.getExportUrl(exportDate, exportClass)}
            download
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-accent-600 hover:bg-accent-500 text-white shadow-xl shadow-accent-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Turnout Trend */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-accent-400" />
              <h3 className="text-base font-bold text-white">Recent Attendance Trends</h3>
            </div>
            <span className="text-xs text-slate-400">Daily tap counts</span>
          </div>

          <div className="space-y-3 pt-2">
            {data?.trend && data.trend.length > 0 ? (
              data.trend.map((t: any, idx: number) => {
                const totalScans = t.total_present || 1;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-300 font-semibold">{t.date}</span>
                      <div className="space-x-2">
                        <span className="text-emerald-400 font-bold">{t.present_count} on-time</span>
                        {t.late_count > 0 && <span className="text-amber-400 font-bold">{t.late_count} late</span>}
                        <span className="text-slate-400 font-semibold">({t.total_present} total)</span>
                      </div>
                    </div>
                    <div className="w-full bg-dark-950 rounded-full h-3 flex overflow-hidden border border-white/5">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${(t.present_count / 10) * 100}%` }}
                        title={`${t.present_count} on-time`}
                      />
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${(t.late_count / 10) * 100}%` }}
                        title={`${t.late_count} late`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">No trend data available</div>
            )}
          </div>
        </div>

        {/* Department Participation */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-accent-400" />
              <h3 className="text-base font-bold text-white">Department Overview</h3>
            </div>
            <span className="text-xs text-slate-400">Total volume</span>
          </div>

          <div className="space-y-3 pt-2">
            {data?.departmentStats && data.departmentStats.length > 0 ? (
              data.departmentStats.map((d: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-dark-950/80 border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{d.department}</h4>
                    <span className="text-xs text-slate-400">{d.total_enrolled} enrolled students</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-accent-400 font-mono">{d.total_attendances}</span>
                    <span className="text-[10px] text-slate-400 block uppercase">Check-ins</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">No department data available</div>
            )}
          </div>
        </div>

      </div>

      {/* Student Attendance Ranking Table */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Student Attendance Frequency</h3>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-400 font-semibold border-b border-white/10 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-right">Days Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.studentRates?.map((s: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-500 w-4">#{idx + 1}</span>
                    <span>{s.name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{s.student_id}</td>
                  <td className="py-3 px-4 text-slate-300">{s.class}</td>
                  <td className="py-3 px-4 text-slate-300">{s.department}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-accent-500/10 text-accent-300 border border-accent-500/20">
                      {s.days_attended} days
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
