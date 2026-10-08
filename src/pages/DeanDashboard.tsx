import React, { useState, useEffect } from 'react';
import { store, BENCHMARK, THRESHOLD } from '../store';
import { useAuth } from '../auth';
import { exportDeanReport } from '../utils/deanReport';
import type { Criterion } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie } from 'recharts';
import { BarChart3, Users, TrendingUp, Shield, Award, CheckCircle, Download, AlertTriangle, MessageSquare, Printer } from 'lucide-react';
import DeanPrintReport from '../components/DeanPrintReport';

const STAR_COLORS = ['#DC2626', '#F59E0B', '#94A3B8', '#3B82F6', '#10B981'];

interface DeanDashboardProps { viewingCycleId?: string; onViewingCycleChange?: (cycleId: string) => void; }

export default function DeanDashboard({ viewingCycleId, onViewingCycleChange }: DeanDashboardProps) {
  const { user } = useAuth();
  const department = user?.department || '';
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const activeCycle = store.getActiveCycle();
  const cycleId = viewingCycleId || activeCycle?.id;
  const allCycles = store.getCycles();
  const viewingCycle = allCycles.find(c => c.id === cycleId);
  const faculty = store.getFacultyByDepartment(department);
  const deptMetrics = store.getDepartmentMetrics(department, cycleId);
  const acknowledged = faculty.filter(f => f.acknowledgmentStatus === 'acknowledged').length;

  useEffect(() => { setCriteria(store.getCriteria()); const unsubs = [store.subscribe('submission_added', () => setCriteria(store.getCriteria())), store.subscribe('acknowledgment_changed', () => setCriteria(store.getCriteria())), store.subscribe('criteria_changed', () => setCriteria(store.getCriteria())), store.subscribe('cycle_changed', () => setCriteria(store.getCriteria()))]; return () => unsubs.forEach(u => u()); }, []);

  const deptEvals = store.getEvaluationsForDepartment(department, cycleId);
  const facultyPerformance = faculty.map(f => { const metrics = store.getFacultyMetrics(f.id, cycleId); return { id: f.id, name: f.name, totalSubmissions: metrics.totalSubmissions, overallAverage: metrics.overallAverage, acknowledgmentStatus: f.acknowledgmentStatus }; });

  const deptScoreDist = [0, 0, 0, 0, 0];
  deptEvals.forEach(ev => { Object.values(ev.ratings).forEach(rating => { if (rating >= 1 && rating <= 5) deptScoreDist[rating - 1]++; }); });
  const deptTotalRatings = deptScoreDist.reduce((a, b) => a + b, 0);
  const deptAvg = deptTotalRatings > 0 ? deptScoreDist.reduce((sum, count, idx) => sum + count * (idx + 1), 0) / deptTotalRatings : 0;
  const deptDonutData = [{ name: '5★', value: deptScoreDist[4], percentage: deptTotalRatings > 0 ? ((deptScoreDist[4] / deptTotalRatings) * 100).toFixed(1) : '0' }, { name: '4★', value: deptScoreDist[3], percentage: deptTotalRatings > 0 ? ((deptScoreDist[3] / deptTotalRatings) * 100).toFixed(1) : '0' }, { name: '3★', value: deptScoreDist[2], percentage: deptTotalRatings > 0 ? ((deptScoreDist[2] / deptTotalRatings) * 100).toFixed(1) : '0' }, { name: '2★', value: deptScoreDist[1], percentage: deptTotalRatings > 0 ? ((deptScoreDist[1] / deptTotalRatings) * 100).toFixed(1) : '0' }, { name: '1★', value: deptScoreDist[0], percentage: deptTotalRatings > 0 ? ((deptScoreDist[0] / deptTotalRatings) * 100).toFixed(1) : '0' }];

  const institutionCriteriaData = criteria.map(c => {
    let totalScore = 0, totalCount = 0;
    ['Computer Science', 'Mathematics', 'Physics'].forEach(dept => { const m = store.getDepartmentMetrics(dept, cycleId); const score = m.criteriaAverages[c.id] || 0; if (score > 0) { totalScore += score; totalCount++; } });
    return { name: c.name, score: totalCount > 0 ? Number((totalScore / totalCount).toFixed(2)) : 0 };
  });

  const handleExport = async () => { await exportDeanReport(department, cycleId); };
  const handlePrint = () => { setIsPrintMode(true); setTimeout(() => { window.print(); setIsPrintMode(false); }, 100); };

  if (isPrintMode) return (<DeanPrintReport department={department} cycleName={viewingCycle?.displayName || 'Current Cycle'} criteria={criteria} />);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3"><div><h2 className="text-2xl font-bold" style={{ color: '#002366' }}>Department Overview</h2><p className="text-sm" style={{ color: '#4B5563' }}>{department} Department • {user?.displayName}</p>{viewingCycle && <p className="text-xs mt-1" style={{ color: '#B87333' }}>Viewing: {viewingCycle.displayName}</p>}</div><div className="flex items-center gap-2"><button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90" style={{ backgroundColor: '#D5D8DC', color: '#1A1A1A' }}><Printer size={14} />Print Report</button><button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#2E8B57' }}><Download size={14} />Export Report</button><div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#F5E6D3' }}><Shield size={14} style={{ color: '#B87333' }} /><span className="text-xs font-medium" style={{ color: '#B87333' }}>Aggregated View Only</span></div></div></div>
      <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#F5E6D3', border: '1px solid #B87333' }}><Shield size={16} style={{ color: '#B87333' }} /><p className="text-xs"><strong>Privacy Notice:</strong> Only department-level aggregated metrics are shown.</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><div className="flex items-center gap-2 mb-1"><TrendingUp size={16} style={{ color: '#002366' }} /><span className="text-xs font-medium" style={{ color: '#4B5563' }}>Total Submissions</span></div><p className="text-2xl font-bold" style={{ color: '#002366' }}>{deptMetrics.totalSubmissions}</p></div>
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><div className="flex items-center gap-2 mb-1"><Award size={16} style={{ color: '#2E8B57' }} /><span className="text-xs font-medium" style={{ color: '#4B5563' }}>Dept Average</span></div><p className="text-2xl font-bold" style={{ color: '#2E8B57' }}>{deptMetrics.institutionAverage.toFixed(2)}</p></div>
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><div className="flex items-center gap-2 mb-1"><Users size={16} style={{ color: '#B87333' }} /><span className="text-xs font-medium" style={{ color: '#4B5563' }}>Faculty Count</span></div><p className="text-2xl font-bold" style={{ color: '#B87333' }}>{deptMetrics.totalFaculty}</p></div>
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><div className="flex items-center gap-2 mb-1"><CheckCircle size={16} style={{ color: '#C41E3A' }} /><span className="text-xs font-medium" style={{ color: '#4B5563' }}>Acknowledged</span></div><p className="text-2xl font-bold" style={{ color: '#C41E3A' }}>{acknowledged}/{faculty.length}</p></div>
      </div>
      <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><BarChart3 size={16} style={{ color: '#B87333' }} />Institution Criteria Performance (avg / 5.0)</h3><ResponsiveContainer width="100%" height={220}><BarChart data={institutionCriteriaData} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#D5D8DC" /><XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#1A1A1A' }} width={100} /><Tooltip contentStyle={{ backgroundColor: '#EDEBE8', border: '1px solid #D5D8DC', borderRadius: '8px' }} /><ReferenceLine x={BENCHMARK} stroke="#C41E3A" strokeDasharray="5 5" strokeWidth={2} /><Bar dataKey="score" radius={[0, 4, 4, 0]}>{institutionCriteriaData.map((entry, i) => (<Cell key={i} fill={entry.score >= BENCHMARK ? '#2E8B57' : '#C41E3A'} />))}</Bar></BarChart></ResponsiveContainer></div>
      <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><BarChart3 size={16} style={{ color: '#B87333' }} />Department Score Distribution</h3><div className="flex items-center gap-4"><div className="relative"><ResponsiveContainer width={180} height={180}><PieChart><Pie data={deptDonutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>{deptDonutData.map((_, i) => (<Cell key={i} fill={STAR_COLORS[i]} />))}</Pie></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold" style={{ color: '#002366' }}>{deptAvg.toFixed(1)}</span><span className="text-[10px]" style={{ color: '#4B5563' }}>avg score</span></div></div><div className="flex-1 space-y-1.5">{deptDonutData.map((d, i) => (<div key={i} className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: STAR_COLORS[i] }} /><span>{d.name}</span><span className="font-bold">{d.value}</span><span style={{ color: '#9CA3AF' }}>({d.percentage}%)</span></div>))}</div></div></div>
      <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Faculty Performance Summary</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ backgroundColor: '#002366' }}><th className="text-left px-4 py-2 text-white font-medium">Faculty</th><th className="text-center px-4 py-2 text-white font-medium">Submissions</th><th className="text-center px-4 py-2 text-white font-medium">Average</th><th className="text-center px-4 py-2 text-white font-medium">Status</th></tr></thead><tbody>{facultyPerformance.map((f, i) => (<tr key={f.id} style={{ backgroundColor: i % 2 === 0 ? '#EDEBE8' : '#F8F6F1' }}><td className="px-4 py-2 font-medium">{f.name}</td><td className="px-4 py-2 text-center">{f.totalSubmissions}</td><td className="px-4 py-2 text-center font-bold" style={{ color: f.totalSubmissions < THRESHOLD ? '#9CA3AF' : f.overallAverage >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>{f.totalSubmissions < THRESHOLD ? '—' : f.overallAverage.toFixed(2)}</td><td className="px-4 py-2 text-center"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: f.acknowledgmentStatus === 'acknowledged' ? '#D1FAE5' : '#F5E6D3', color: f.acknowledgmentStatus === 'acknowledged' ? '#2E8B57' : '#B87333' }}>{f.acknowledgmentStatus === 'acknowledged' ? '✓ Ack' : '⏳ Pending'}</span></td></tr>))}</tbody></table></div></div>
    </div>
  );
}
