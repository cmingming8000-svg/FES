import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { store, BENCHMARK, THRESHOLD } from '../store';
import { exportFacultyReport } from '../utils/excel';
import { exportFacultyPDF } from '../utils/pdf';
import { generateInstitutionalTNA, extractTNAInsights } from '../utils/tnaEngine';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Faculty, EvaluationCycle, Criterion, AuditLogEntry, SubQuestion, TrainingRecommendation, Dispute, InstitutionalTNA } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { LayoutDashboard, Users, Calendar, ListChecks, ScrollText, Plus, Trash2, Search, AlertTriangle, CheckCircle, TrendingUp, Shield, FileSpreadsheet, GraduationCap, Edit3, Sparkles, Download, BarChart3, MessageSquare, BookOpen, Printer, UserPlus, Lightbulb } from 'lucide-react';
import AdminPrintReport from '../components/AdminPrintReport';
import FacultyPrintReport from '../components/FacultyPrintReport';
import SignaturePad from '../components/SignaturePad';

const STAR_COLORS = ['#DC2626', '#F59E0B', '#94A3B8', '#3B82F6', '#10B981'];
type Tab = 'overview' | 'faculty' | 'cycles' | 'criteria' | 'tna' | 'disputes' | 'audit';

interface AdminDashboardProps { viewingCycleId?: string; onViewingCycleChange?: (cycleId: string) => void; }

export default function AdminDashboard({ viewingCycleId, onViewingCycleChange }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [trainingRecs, setTrainingRecs] = useState<TrainingRecommendation[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCycleName, setNewCycleName] = useState('');
  const [newCycleDisplayName, setNewCycleDisplayName] = useState('');
  const [newCycleStart, setNewCycleStart] = useState('');
  const [newCycleEnd, setNewCycleEnd] = useState('');
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newSubQs, setNewSubQs] = useState<Record<string, string>>({});
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [editingRec, setEditingRec] = useState<string | null>(null);
  const [editRecText, setEditRecText] = useState('');
  const [editingSubQ, setEditingSubQ] = useState<string | null>(null);
  const [editSubQText, setEditSubQText] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: 'danger' | 'warning' | 'info'; title: string; message: string; onConfirm: () => void }>({ open: false, type: 'warning', title: '', message: '', onConfirm: () => {} });
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [showAdminSignModal, setShowAdminSignModal] = useState(false);
  const [adminSignature, setAdminSignature] = useState<string | null>(null);
  const [institutionalTNA, setInstitutionalTNA] = useState<InstitutionalTNA | null>(null);

  const activeCycle = cycles.find(c => c.status === 'active');
  const cycleId = viewingCycleId || activeCycle?.id;

  // Generate AI-driven institutional TNA
  useEffect(() => {
    if (activeTab === 'tna') {
      const tna = generateInstitutionalTNA(cycleId);
      setInstitutionalTNA(tna);
    }
  }, [activeTab, cycleId]);

  const loadData = useCallback(() => { setFaculty(store.getFaculty()); setCycles(store.getCycles()); setCriteria(store.getCriteria()); setAuditLog(store.getAuditLog()); setTrainingRecs(store.getTrainingRecommendations()); setDisputes(store.getDisputes()); }, []);
  useEffect(() => { loadData(); const unsubs = [store.subscribe('criteria_changed', loadData), store.subscribe('cycle_changed', loadData), store.subscribe('submission_added', loadData), store.subscribe('acknowledgment_changed', loadData), store.subscribe('training_changed', loadData), store.subscribe('dispute_submitted', loadData), store.subscribe('dispute_resolved', loadData)]; return () => unsubs.forEach(u => u()); }, [loadData]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [{ id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> }, { id: 'faculty', label: 'Faculty', icon: <Users size={16} /> }, { id: 'cycles', label: 'Cycles', icon: <Calendar size={16} /> }, { id: 'criteria', label: 'Criteria', icon: <ListChecks size={16} /> }, { id: 'tna', label: 'TNA', icon: <GraduationCap size={16} /> }, { id: 'disputes', label: 'Disputes', icon: <AlertTriangle size={16} /> }, { id: 'audit', label: 'Audit Log', icon: <ScrollText size={16} /> }];

  const facultyWithMetrics = faculty.filter(f => store.getFacultyMetrics(f.id, cycleId).totalSubmissions >= THRESHOLD);
  const flaggedFaculty = facultyWithMetrics.filter(f => store.getFacultyMetrics(f.id, cycleId).overallAverage < BENCHMARK);
  const acknowledgedCount = faculty.filter(f => f.acknowledgmentStatus === 'acknowledged').length;
  const topRated = [...facultyWithMetrics].sort((a, b) => store.getFacultyMetrics(b.id, cycleId).overallAverage - store.getFacultyMetrics(a.id, cycleId).overallAverage).slice(0, 3);

  const handlePrint = () => { setIsPrintMode(true); setTimeout(() => { window.print(); setIsPrintMode(false); }, 100); };

  const handleAdminRelease = async () => {
    if (!adminSignature || !cycleId) return;
    await store.adminReleaseCycle(cycleId, 'admin', adminSignature);
    setShowAdminSignModal(false);
    setAdminSignature(null);
  };

  const isAdminReleased = store.isCycleAdminReleased(cycleId);
  const adminReleaseInfo = store.getCycleAdminRelease(cycleId);

  const departments = ['Computer Science', 'Mathematics', 'Physics'];

  if (isPrintMode) return (<AdminPrintReport cycleName={activeCycle?.displayName || 'Current Cycle'} criteria={criteria} />);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto flex-1" style={{ backgroundColor: '#EDEBE8' }}>{tabs.map(tab => (<button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedFaculty(null); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap" style={{ backgroundColor: activeTab === tab.id ? '#002366' : 'transparent', color: activeTab === tab.id ? '#FFFFFF' : '#1A1A1A' }}>{tab.icon}{tab.label}</button>))}</div>
        <div className="flex gap-2">{!isAdminReleased && activeCycle && (<button onClick={() => setShowAdminSignModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:opacity-90" style={{ backgroundColor: '#B87333', color: '#FFFFFF' }}><Shield size={14} />Release Data</button>)}{isAdminReleased && (<div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#2E8B57' }}><CheckCircle size={14} />Released {adminReleaseInfo?.releasedAt ? new Date(adminReleaseInfo.releasedAt).toLocaleDateString() : ''}</div>)}<button onClick={() => navigate('/create-account')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:opacity-90" style={{ backgroundColor: '#2E8B57', color: '#FFFFFF' }}><UserPlus size={14} />Create Account</button><button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:opacity-90" style={{ backgroundColor: '#D5D8DC', color: '#1A1A1A' }}><Printer size={14} />Print Report</button></div>
      </div>
      {activeTab === 'overview' && !selectedFaculty && (<div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><p className="text-xs font-medium mb-1" style={{ color: '#4B5563' }}>Total Submissions</p><p className="text-2xl font-bold" style={{ color: '#002366' }}>{store.getEvaluations().filter(e => e.cycleId === cycleId).length}</p></div>
          <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><p className="text-xs font-medium mb-1" style={{ color: '#4B5563' }}>Faculty</p><p className="text-2xl font-bold" style={{ color: '#B87333' }}>{faculty.length}</p></div>
          <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><p className="text-xs font-medium mb-1" style={{ color: '#4B5563' }}>Acknowledged</p><p className="text-2xl font-bold" style={{ color: '#2E8B57' }}>{acknowledgedCount}/{faculty.length}</p></div>
          <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><p className="text-xs font-medium mb-1" style={{ color: '#4B5563' }}>Below Benchmark</p><p className="text-2xl font-bold" style={{ color: '#C41E3A' }}>{flaggedFaculty.length}</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Top Rated Faculty</h3><div className="space-y-2">{topRated.map((f, i) => { const m = store.getFacultyMetrics(f.id, cycleId); return (<div key={f.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}><div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ['#002366', '#B87333', '#C41E3A'][i] }}>{i + 1}</span><span className="text-sm font-medium">{f.name}</span></div><span className="text-sm font-bold" style={{ color: '#2E8B57' }}>{m.overallAverage.toFixed(2)}</span></div>); })}</div></div>
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Completion by Program</h3><div className="space-y-3">{store.getPrograms().map(program => { const pf = faculty.filter(f => f.department === program.department); const ts = pf.reduce((sum, f) => sum + store.getFacultyMetrics(f.id, cycleId).totalSubmissions, 0); const fwt = pf.filter(f => store.getFacultyMetrics(f.id, cycleId).totalSubmissions >= THRESHOLD).length; const cr = pf.length > 0 ? Math.round((fwt / pf.length) * 100) : 0; return (<div key={program.id} className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">{program.name}</span><span className="text-sm font-bold" style={{ color: cr >= 80 ? '#2E8B57' : cr >= 50 ? '#B87333' : '#C41E3A' }}>{cr}%</span></div><div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#D5D8DC' }}><div className="h-full rounded-full" style={{ width: `${cr}%`, backgroundColor: cr >= 80 ? '#2E8B57' : cr >= 50 ? '#B87333' : '#C41E3A' }} /></div></div>); })}</div></div>
        </div>
        {flaggedFaculty.length > 0 && (<div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#FEE2E2', border: '1px solid #C41E3A' }}><h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#C41E3A' }}><AlertTriangle size={16} />Below Benchmark (Average &lt; {BENCHMARK.toFixed(1)})</h3><div className="space-y-2">{flaggedFaculty.map(f => { const m = store.getFacultyMetrics(f.id, cycleId); return (<div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-white/50"><span className="text-sm">{f.name} ({f.department})</span><span className="text-sm font-bold" style={{ color: '#C41E3A' }}>{m.overallAverage.toFixed(2)}</span></div>); })}</div></div>)}
      </div>)}
      {activeTab === 'faculty' && !selectedFaculty && (<div className="space-y-4"><div className="relative max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search faculty..." className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /></div><div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: '#EDEBE8' }}><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ backgroundColor: '#002366' }}><th className="text-left px-4 py-3 text-white font-medium">Name</th><th className="text-left px-4 py-3 text-white font-medium">Dept</th><th className="text-center px-4 py-3 text-white font-medium">Submissions</th><th className="text-center px-4 py-3 text-white font-medium">Avg</th><th className="text-center px-4 py-3 text-white font-medium">Actions</th></tr></thead><tbody>{faculty.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((f, i) => { const m = store.getFacultyMetrics(f.id, cycleId); const hasData = m.totalSubmissions > 0; return (<tr key={f.id} style={{ backgroundColor: i % 2 === 0 ? '#EDEBE8' : '#F8F6F1' }}><td className="px-4 py-3 font-medium">{f.name}</td><td className="px-4 py-3 text-xs" style={{ color: '#4B5563' }}>{f.department}</td><td className="px-4 py-3 text-center">{m.totalSubmissions}</td><td className="px-4 py-3 text-center font-bold" style={{ color: !hasData ? '#9CA3AF' : m.overallAverage >= 4.5 ? '#2E8B57' : m.overallAverage < BENCHMARK ? '#C41E3A' : '#1A1A1A' }}>{!hasData ? '—' : m.overallAverage.toFixed(2)}</td><td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => setSelectedFaculty(f)} className="px-2 py-1 rounded text-xs font-medium text-white hover:opacity-80" style={{ backgroundColor: '#002366' }}>View</button><button onClick={() => exportFacultyReport(f.id, cycleId)} className="px-2 py-1 rounded text-xs text-white hover:opacity-80" style={{ backgroundColor: '#2E8B57' }}><FileSpreadsheet size={12} /></button></div></td></tr>); })}</tbody></table></div></div></div>)}
      {activeTab === 'faculty' && selectedFaculty && (() => { const metrics = store.getFacultyMetrics(selectedFaculty.id, cycleId); const subjects = store.getFacultyCourses(selectedFaculty.id); return (<div className="space-y-6"><div className="flex items-center justify-between flex-wrap gap-3"><div className="flex items-center gap-3"><button onClick={() => setSelectedFaculty(null)} className="px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90" style={{ backgroundColor: '#D5D8DC', color: '#1A1A1A' }}>← Back</button><div><h2 className="text-xl font-bold" style={{ color: '#002366' }}>{selectedFaculty.name}</h2><p className="text-sm" style={{ color: '#4B5563' }}>{selectedFaculty.title} • {selectedFaculty.department}</p></div></div><div className="flex items-center gap-2"><button onClick={async () => await exportFacultyReport(selectedFaculty.id, cycleId)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: '#2E8B57' }}><Download size={16} /> Export XLSX</button><button onClick={async () => await exportFacultyPDF(selectedFaculty.id, cycleId)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: '#B87333' }}><Download size={16} /> Export PDF</button></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><p className="text-xs font-medium" style={{ color: '#4B5563' }}>Total Submissions</p><p className="text-2xl font-bold" style={{ color: '#002366' }}>{metrics.totalSubmissions}</p></div><div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><p className="text-xs font-medium" style={{ color: '#4B5563' }}>Overall Average</p><p className="text-2xl font-bold" style={{ color: '#002366' }}>{metrics.overallAverage.toFixed(2)}</p></div><div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><p className="text-xs font-medium" style={{ color: '#4B5563' }}>Courses/Subjects</p><p className="text-2xl font-bold" style={{ color: '#002366' }}>{Object.keys(metrics.courseBreakdown).length}</p></div></div><div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><BarChart3 size={16} style={{ color: '#B87333' }} />Performance by Course/Subject</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ backgroundColor: '#002366' }}><th className="text-left px-4 py-2 text-white font-medium">Course/Subject</th><th className="text-center px-4 py-2 text-white font-medium">Submissions</th><th className="text-center px-4 py-2 text-white font-medium">Average</th><th className="text-center px-4 py-2 text-white font-medium">Status</th></tr></thead><tbody>{subjects.map((subject, i) => { const subjectMetrics = store.getFacultyMetrics(selectedFaculty.id, cycleId, subject); const hasData = subjectMetrics.totalSubmissions > 0; return (<tr key={subject} style={{ backgroundColor: i % 2 === 0 ? '#EDEBE8' : '#F8F6F1' }}><td className="px-4 py-2 font-medium">{subject}</td><td className="px-4 py-2 text-center">{subjectMetrics.totalSubmissions}</td><td className="px-4 py-2 text-center font-bold" style={{ color: !hasData ? '#9CA3AF' : subjectMetrics.overallAverage >= 4.5 ? '#2E8B57' : subjectMetrics.overallAverage < BENCHMARK ? '#C41E3A' : '#1A1A1A' }}>{!hasData ? '—' : subjectMetrics.overallAverage.toFixed(2)}</td><td className="px-4 py-2 text-center"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: !hasData ? '#D5D8DC' : subjectMetrics.overallAverage >= 4.5 ? '#D1FAE5' : subjectMetrics.overallAverage >= BENCHMARK ? '#F5E6D3' : '#FEE2E2', color: !hasData ? '#6B7280' : subjectMetrics.overallAverage >= 4.5 ? '#2E8B57' : subjectMetrics.overallAverage >= BENCHMARK ? '#B87333' : '#C41E3A' }}>{!hasData ? 'No Data' : subjectMetrics.overallAverage >= 4.5 ? 'Excellent' : subjectMetrics.overallAverage >= BENCHMARK ? 'Good' : 'Below Benchmark'}</span></td></tr>); })}</tbody></table></div></div><div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}><MessageSquare size={16} style={{ color: '#B87333' }} />Evaluation Details (Admin View — Student IDs Visible)</h3><div className="space-y-2 max-h-80 overflow-y-auto">{store.getEvaluationsForFaculty(selectedFaculty.id, cycleId).map((ev, i) => { const student = store.getStudentById(ev.studentId || ''); const avgRating = Object.values(ev.ratings).reduce((a, b) => a + b, 0) / Object.values(ev.ratings).length; return (<div key={i} className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#F8F6F1', border: '1px solid #D5D8DC' }}><div className="flex items-center justify-between mb-1"><span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#002366', color: '#FFFFFF' }}>Student: {ev.studentId || 'Unknown'}</span><span className="text-xs" style={{ color: '#4B5563' }}>{ev.courseId} • {new Date(ev.submittedAt).toLocaleDateString()}</span></div>{student && <p className="text-xs mb-1" style={{ color: '#B87333' }}>Name: {student.name} | Program: {student.programId}</p>}<div className="flex items-center gap-2 mb-1"><span className="text-xs font-medium" style={{ color: '#4B5563' }}>Avg Rating:</span><span className="text-xs font-bold" style={{ color: avgRating >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>{avgRating.toFixed(2)}/5.0</span></div>{ev.feedback && <p className="text-xs italic" style={{ color: '#1A1A1A' }}>"{ev.feedback}"</p>}</div>); })}</div></div></div>); })()}
      {activeTab === 'cycles' && (<div className="space-y-6"><div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#002366' }}><Plus size={16} style={{ color: '#B87333' }} />Create New Cycle</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3"><input type="text" value={newCycleName} onChange={e => setNewCycleName(e.target.value)} placeholder="Internal name" className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /><input type="text" value={newCycleDisplayName} onChange={e => setNewCycleDisplayName(e.target.value)} placeholder="Display name" className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /><input type="date" value={newCycleStart} onChange={e => setNewCycleStart(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /><input type="date" value={newCycleEnd} onChange={e => setNewCycleEnd(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /></div><button onClick={async () => { if (newCycleName && newCycleDisplayName && newCycleStart && newCycleEnd) { await store.addCycle({ name: newCycleName, displayName: newCycleDisplayName, startDate: newCycleStart, endDate: newCycleEnd, status: 'upcoming' }); setNewCycleName(''); setNewCycleDisplayName(''); setNewCycleStart(''); setNewCycleEnd(''); } }} className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: '#002366' }}>Create Cycle</button></div><div className="space-y-3">{cycles.map(cycle => (<div key={cycle.id} className="rounded-xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-2" style={{ backgroundColor: '#EDEBE8' }}><div><p className="font-semibold text-sm" style={{ color: '#002366' }}>{cycle.displayName}</p><p className="text-xs" style={{ color: '#4B5563' }}>{cycle.startDate} — {cycle.endDate}</p></div><div className="flex items-center gap-2 flex-wrap"><span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: cycle.status === 'active' ? '#D1FAE5' : cycle.status === 'upcoming' ? '#F5E6D3' : cycle.status === 'archived' ? '#FEE2E2' : '#D5D8DC', color: cycle.status === 'active' ? '#2E8B57' : cycle.status === 'upcoming' ? '#B87333' : cycle.status === 'archived' ? '#C41E3A' : '#4B5563' }}>{cycle.status}</span>{cycle.status !== 'active' && cycle.status !== 'archived' && <button onClick={async () => { await store.activateCycle(cycle.id); }} className="px-3 py-1 rounded text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#2E8B57' }}>Activate</button>}<button onClick={() => setConfirmDialog({ open: true, type: 'danger', title: 'Remove Cycle', message: `Remove "${cycle.displayName}"?`, onConfirm: async () => { await store.removeCycle(cycle.id); setConfirmDialog(prev => ({ ...prev, open: false })); } })} className="px-2 py-1 rounded text-xs text-white hover:opacity-90" style={{ backgroundColor: '#C41E3A' }}><Trash2 size={12} /></button></div></div>))}</div></div>)}
      {activeTab === 'criteria' && (<div className="space-y-6"><div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}><h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#002366' }}><Plus size={16} style={{ color: '#B87333' }} />Add New Criterion</h3><div className="flex gap-3"><input type="text" value={newCriterionName} onChange={e => setNewCriterionName(e.target.value)} placeholder="Criterion name" className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /><button onClick={async () => { if (newCriterionName) { await store.addCriterion(newCriterionName); setNewCriterionName(''); } }} className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: '#002366' }}>Add</button></div></div><div className="space-y-3">{criteria.map(crit => { const subQs = store.getSubQuestionsForCriterion(crit.id); const isExpanded = expandedCriteria.has(crit.id); return (<div key={crit.id} className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: '#EDEBE8' }}><div className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#002366' }}>{crit.order}</span><div><span className="text-sm font-semibold">{crit.name}</span><p className="text-xs" style={{ color: '#9CA3AF' }}>{subQs.length} sub-questions</p></div></div><div className="flex items-center gap-2"><button onClick={() => setExpandedCriteria(prev => { const n = new Set(prev); if (n.has(crit.id)) n.delete(crit.id); else n.add(crit.id); return n; })} className="px-2 py-1 rounded text-xs font-medium hover:opacity-80" style={{ backgroundColor: '#F5E6D3', color: '#B87333' }}>{isExpanded ? 'Hide' : 'Manage'} Sub-Qs</button><button onClick={() => setConfirmDialog({ open: true, type: 'warning', title: 'Remove Criterion', message: `Remove "${crit.name}" and ${subQs.length} sub-questions?`, onConfirm: async () => { await store.removeCriterion(crit.id); setConfirmDialog(prev => ({ ...prev, open: false })); } })} className="px-2 py-1 rounded text-xs text-white hover:opacity-90" style={{ backgroundColor: '#C41E3A' }}><Trash2 size={12} /></button></div></div>{isExpanded && (<div className="px-4 pb-4 border-t" style={{ borderColor: '#D5D8DC' }}><div className="mt-3 space-y-2">{subQs.map(sq => (<div key={sq.id} className="p-2.5 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}><div className="flex items-center gap-2"><span className="text-xs font-bold w-6 text-center flex-shrink-0" style={{ color: '#B87333' }}>{sq.order}.</span><span className="text-xs flex-1">{sq.text}</span><button onClick={() => store.removeSubQuestion(sq.id)} className="px-2 py-1 rounded text-xs text-white hover:opacity-90" style={{ backgroundColor: '#C41E3A' }}><Trash2 size={10} /></button></div></div>))}</div><div className="mt-3 flex gap-2"><input type="text" value={newSubQs[crit.id] || ''} onChange={e => setNewSubQs(prev => ({ ...prev, [crit.id]: e.target.value }))} placeholder="New sub-question text..." className="flex-1 px-3 py-2 rounded-lg border text-xs outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} /><button onClick={async () => { const text = newSubQs[crit.id]?.trim(); if (text) { await store.addSubQuestion(crit.id, text); setNewSubQs(prev => ({ ...prev, [crit.id]: '' })); } }} className="px-3 py-2 rounded-lg text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#002366' }}><Plus size={12} />Add</button></div></div>)}</div>); })}</div></div>)}
      {activeTab === 'tna' && institutionalTNA && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#002366' }}>
              <Sparkles size={24} style={{ color: '#B87333' }} />
              AI-Driven Institutional Training Needs Analysis
            </h3>
            <span className="text-xs" style={{ color: '#4B5563' }}>
              Generated: {new Date(institutionalTNA.generatedAt).toLocaleString()}
            </span>
          </div>

          {/* Institutional Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
              <p className="text-xs font-medium" style={{ color: '#4B5563' }}>Institutional Average</p>
              <p className="text-2xl font-bold" style={{ color: institutionalTNA.institutionalAverage >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                {institutionalTNA.institutionalAverage.toFixed(2)}/5.0
              </p>
            </div>
            <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
              <p className="text-xs font-medium" style={{ color: '#4B5563' }}>Total Evaluations</p>
              <p className="text-2xl font-bold" style={{ color: '#002366' }}>{institutionalTNA.totalSubmissions}</p>
            </div>
            <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: institutionalTNA.criticalDepartments.length > 0 ? '#FEE2E2' : '#D1FAE5' }}>
              <p className="text-xs font-medium" style={{ color: '#4B5563' }}>Critical Departments</p>
              <p className="text-2xl font-bold" style={{ color: institutionalTNA.criticalDepartments.length > 0 ? '#C41E3A' : '#2E8B57' }}>
                {institutionalTNA.criticalDepartments.length}
              </p>
            </div>
          </div>

          {/* Cross-Departmental Themes */}
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Cross-Departmental Themes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#2E8B57' }}>Institutional Strengths:</p>
                {institutionalTNA.crossDepartmentalThemes.strengths.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {institutionalTNA.crossDepartmentalThemes.strengths.map((theme, i) => (
                      <span key={i} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#D1FAE5', color: '#2E8B57' }}>{theme}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic" style={{ color: '#9CA3AF' }}>No common strengths identified</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: '#C41E3A' }}>Institutional Challenges:</p>
                {institutionalTNA.crossDepartmentalThemes.weaknesses.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {institutionalTNA.crossDepartmentalThemes.weaknesses.map((theme, i) => (
                      <span key={i} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#FEE2E2', color: '#C41E3A' }}>{theme}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic" style={{ color: '#9CA3AF' }}>No common challenges identified</p>
                )}
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Department Performance Analysis</h4>
            <div className="space-y-4">
              {institutionalTNA.departments.map((dept, i) => (
                <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1', border: `2px solid ${dept.priorityScore > 10 ? '#C41E3A' : dept.priorityScore > 5 ? '#B87333' : '#D5D8DC'}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#002366' }}>{i + 1}</span>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#002366' }}>{dept.department}</p>
                        <p className="text-xs" style={{ color: '#4B5563' }}>{dept.totalSubmissions} evaluations</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: dept.overallAverage >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>{dept.overallAverage.toFixed(2)}/5.0</p>
                      <p className="text-xs" style={{ color: dept.priorityScore > 10 ? '#C41E3A' : dept.priorityScore > 5 ? '#B87333' : '#2E8B57' }}>Priority: {dept.priorityScore}</p>
                    </div>
                  </div>
                  
                  {dept.deficits.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-2" style={{ color: '#C41E3A' }}>Performance Deficits:</p>
                      <div className="space-y-1">
                        {dept.deficits.slice(0, 3).map((deficit, j) => (
                          <div key={j} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#FFFFFF' }}>
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: deficit.severity === 'critical' ? '#C41E3A' : deficit.severity === 'high' ? '#B87333' : '#9CA3AF' }}>
                                {deficit.severity === 'critical' ? '!' : deficit.severity === 'high' ? '⚠' : '•'}
                              </span>
                              <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{deficit.criterionName}</span>
                            </div>
                            <span className="text-xs font-bold" style={{ color: '#C41E3A' }}>{deficit.average.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {institutionalTNA.strategicRecommendations.departmentSpecific[dept.department] && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#002366' }}>Department-Specific Recommendations:</p>
                      <ul className="text-xs space-y-1" style={{ color: '#4B5563' }}>
                        {institutionalTNA.strategicRecommendations.departmentSpecific[dept.department].map((rec, k) => (
                          <li key={k}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Recommendations */}
          <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}>
              <Lightbulb size={16} style={{ color: '#B87333' }} />Institution-Wide Strategic Recommendations
            </h4>
            <div className="space-y-2">
              {institutionalTNA.strategicRecommendations.institutionWide.map((rec, i) => (
                <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1', border: '1px solid #D5D8DC' }}>
                  <p className="text-sm" style={{ color: '#1A1A1A' }}>{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis Info */}
          <div className="rounded-xl p-4" style={{ backgroundColor: '#F5E6D3', border: '1px solid #B87333' }}>
            <p className="text-xs" style={{ color: '#4B5563' }}>
              <strong>AI Analysis:</strong> This institutional TNA ingests raw evaluation data from all departments including criterion averages, sub-question ratings, course breakdown scores, and student feedback sentiment. The AI engine automatically diagnoses performance deficits below the {BENCHMARK}/5.0 benchmark and generates tailored development strategies at both department and institutional levels.
            </p>
          </div>
        </div>
      )}
      {activeTab === 'disputes' && (<div className="space-y-6"><h3 className="text-lg font-bold" style={{ color: '#002366' }}>Dispute Resolution Queue</h3><div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>{disputes.length === 0 ? (<p className="text-sm italic" style={{ color: '#9CA3AF' }}>No disputes submitted yet.</p>) : (<div className="space-y-3">{disputes.map(dispute => { const fm = faculty.find(f => f.id === dispute.facultyId); return (<div key={dispute.id} className="p-4 rounded-lg" style={{ backgroundColor: '#F8F6F1', border: `2px solid ${dispute.status === 'pending' ? '#C41E3A' : '#2E8B57'}` }}><div className="flex items-start justify-between mb-3"><div><p className="font-semibold text-sm" style={{ color: '#002366' }}>{fm?.name || 'Unknown'}</p><p className="text-xs" style={{ color: '#4B5563' }}>Submitted: {new Date(dispute.submittedAt).toLocaleDateString()}</p></div><span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: dispute.status === 'pending' ? '#FEE2E2' : '#D1FAE5', color: dispute.status === 'pending' ? '#C41E3A' : '#2E8B57' }}>{dispute.status}</span></div><p className="text-sm mb-3">{dispute.justification}</p>{dispute.status === 'pending' && (<div className="flex gap-2"><button onClick={() => { setSelectedDispute(dispute); setResolutionText(''); }} className="px-3 py-1.5 rounded text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#2E8B57' }}>Resolve</button></div>)}</div>); })}</div>)}</div></div>)}
      {selectedDispute && (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50" onClick={() => setSelectedDispute(null)} /><div className="relative w-full max-w-md rounded-xl shadow-2xl p-6" style={{ backgroundColor: '#EDEBE8' }}><h3 className="text-lg font-semibold mb-2" style={{ color: '#2E8B57' }}>Resolve Dispute</h3><textarea value={resolutionText} onChange={e => setResolutionText(e.target.value)} placeholder="Enter resolution details..." className="w-full px-3 py-2 rounded-lg border text-sm outline-none mb-4 resize-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} rows={6} /><div className="flex justify-end gap-2"><button onClick={() => setSelectedDispute(null)} className="px-3 py-1.5 rounded-lg text-sm border hover:bg-black/5" style={{ borderColor: '#D5D8DC' }}>Cancel</button><button onClick={async () => { if (resolutionText.trim()) { await store.resolveDispute(selectedDispute.id, 'admin', resolutionText); setSelectedDispute(null); setResolutionText(''); } }} disabled={!resolutionText.trim()} className="px-4 py-1.5 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#2E8B57' }}>Resolve Dispute</button></div></div></div>)}
      {activeTab === 'audit' && (<div className="rounded-xl shadow-sm overflow-hidden" style={{ backgroundColor: '#EDEBE8' }}><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr style={{ backgroundColor: '#002366' }}><th className="text-left px-4 py-3 text-white font-medium">Timestamp</th><th className="text-left px-4 py-3 text-white font-medium">Actor</th><th className="text-left px-4 py-3 text-white font-medium">Action</th><th className="text-left px-4 py-3 text-white font-medium">Details</th></tr></thead><tbody>{auditLog.slice(0, 100).map((entry, i) => (<tr key={entry.id} style={{ backgroundColor: i % 2 === 0 ? '#EDEBE8' : '#F8F6F1' }}><td className="px-4 py-2 text-xs" style={{ color: '#4B5563' }}>{new Date(entry.timestamp).toLocaleString()}</td><td className="px-4 py-2 text-xs font-medium">{entry.actor}</td><td className="px-4 py-2"><span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#F5E6D3', color: '#B87333' }}>{entry.action}</span></td><td className="px-4 py-2 text-xs" style={{ color: '#4B5563' }}>{entry.details || '—'}</td></tr>))}</tbody></table></div></div>)}
      {showAdminSignModal && (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50" onClick={() => setShowAdminSignModal(false)} /><div className="relative w-full max-w-lg rounded-xl shadow-2xl p-6" style={{ backgroundColor: '#EDEBE8' }}><h3 className="text-lg font-semibold mb-2" style={{ color: '#002366' }}>Admin System Release Contract</h3><p className="text-xs mb-4" style={{ color: '#4B5563' }}>Please review and sign the release contract to authorize data distribution to Deans and Faculty.</p><div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#F8F6F1', border: '1px solid #D5D8DC' }}><p className="text-xs font-semibold mb-2" style={{ color: '#002366' }}>Release Contract Terms:</p><ul className="text-xs space-y-1" style={{ color: '#4B5563' }}><li>• All evaluation data for this cycle has been reviewed and data integrity is confirmed.</li><li>• Department-aggregate data is authorized for release to Deans for review.</li><li>• Deans must separately sign to release data to individual faculty.</li><li>• All PII protections are in place for student anonymity.</li><li>• This release is irreversible for this evaluation cycle.</li></ul></div><SignaturePad onSignatureChange={setAdminSignature} width={450} height={200} /><div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowAdminSignModal(false)} className="px-3 py-1.5 rounded-lg text-sm border hover:bg-black/5" style={{ borderColor: '#D5D8DC' }}>Cancel</button><button onClick={handleAdminRelease} disabled={!adminSignature} className="px-4 py-1.5 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#002366' }}>Sign & Release</button></div></div></div>)}
      <ConfirmDialog isOpen={confirmDialog.open} title={confirmDialog.title} message={confirmDialog.message} type={confirmDialog.type} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))} />
    </div>
  );
}
