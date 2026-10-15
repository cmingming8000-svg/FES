import React, { useState, useEffect } from 'react';
import { store, BENCHMARK, THRESHOLD } from '../store';
import { useAuth } from '../auth';
import { exportDeanReport } from '../utils/deanReport';
import { exportDepartmentFacultyReport, exportDepartmentPerformancePDF } from '../utils/deanReports';
import type { Criterion, DeanFacultyDrilldown, DeanComparativeAnalytics, DeanEarlyWarning, DeanAcknowledgmentTracking, DeanDisputeManagement } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie } from 'recharts';
import { BarChart3, Users, TrendingUp, Shield, Award, CheckCircle, Download, AlertTriangle, MessageSquare, Printer, Eye, Clock, AlertCircle, TrendingDown, XCircle, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import DeanPrintReport from '../components/DeanPrintReport';
import SignaturePad from '../components/SignaturePad';

const STAR_COLORS = ['#DC2626', '#F59E0B', '#94A3B8', '#3B82F6', '#10B981'];

interface DeanDashboardProps { viewingCycleId?: string; onViewingCycleChange?: (cycleId: string) => void; }

export default function DeanDashboard({ viewingCycleId, onViewingCycleChange }: DeanDashboardProps) {
  const { user } = useAuth();
  const department = user?.department || '';
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(null);
  const [facultyDrilldown, setFacultyDrilldown] = useState<DeanFacultyDrilldown | null>(null);
  const [comparativeAnalytics, setComparativeAnalytics] = useState<DeanComparativeAnalytics | null>(null);
  const [earlyWarnings, setEarlyWarnings] = useState<DeanEarlyWarning[]>([]);
  const [acknowledgmentTracking, setAcknowledgmentTracking] = useState<DeanAcknowledgmentTracking[]>([]);
  const [disputeManagement, setDisputeManagement] = useState<DeanDisputeManagement | null>(null);
  
  const activeCycle = store.getActiveCycle();
  const cycleId = viewingCycleId || activeCycle?.id;
  const allCycles = store.getCycles();
  const viewingCycle = allCycles.find(c => c.id === cycleId);
  const faculty = store.getFacultyByDepartment(department);
  const deptMetrics = store.getDepartmentMetrics(department, cycleId);
  const acknowledged = faculty.filter(f => f.acknowledgmentStatus === 'acknowledged').length;
  const isAdminReleased = store.isCycleAdminReleased(cycleId);
  const isDeanReleased = store.isCycleDeanReleased(cycleId, department);
  const deanReceiptDeadline = store.getDeanReceiptDeadline(cycleId, department);
  
  const [showDeanSignModal, setShowDeanSignModal] = useState(false);
  const [deanSignature, setDeanSignature] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => { 
    setCriteria(store.getCriteria()); 
    const unsubs = [
      store.subscribe('submission_added', () => setCriteria(store.getCriteria())),
      store.subscribe('acknowledgment_changed', () => setCriteria(store.getCriteria())),
      store.subscribe('criteria_changed', () => setCriteria(store.getCriteria())),
      store.subscribe('cycle_changed', () => setCriteria(store.getCriteria()))
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // Load enhanced analytics when admin releases data
  useEffect(() => {
    if (isAdminReleased) {
      setComparativeAnalytics(store.getDeanComparativeAnalytics(department, cycleId));
      setEarlyWarnings(store.getDeanEarlyWarnings(department, cycleId));
      setAcknowledgmentTracking(store.getDeanAcknowledgmentTracking(department, cycleId));
      setDisputeManagement(store.getDeanDisputeManagement(department));
    }
  }, [isAdminReleased, department, cycleId]);

  // Load faculty drilldown when selected
  useEffect(() => {
    if (selectedFacultyId && isAdminReleased) {
      const drilldown = store.getDeanFacultyDrilldown(selectedFacultyId, cycleId);
      setFacultyDrilldown(drilldown);
    } else {
      setFacultyDrilldown(null);
    }
  }, [selectedFacultyId, isAdminReleased, cycleId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-export-menu]')) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showExportMenu]);

  const deptEvals = store.getEvaluationsForDepartment(department, cycleId);
  const facultyPerformance = faculty.map(f => { 
    const metrics = store.getFacultyMetrics(f.id, cycleId); 
    return { 
      id: f.id, 
      name: f.name, 
      totalSubmissions: metrics.totalSubmissions, 
      overallAverage: metrics.overallAverage, 
      acknowledgmentStatus: f.acknowledgmentStatus 
    }; 
  });

  const deptScoreDist = [0, 0, 0, 0, 0];
  deptEvals.forEach(ev => { 
    Object.values(ev.ratings).forEach(rating => { 
      if (rating >= 1 && rating <= 5) deptScoreDist[rating - 1]++; 
    }); 
  });
  const deptTotalRatings = deptScoreDist.reduce((a, b) => a + b, 0);
  const deptAvg = deptTotalRatings > 0 ? deptScoreDist.reduce((sum, count, idx) => sum + count * (idx + 1), 0) / deptTotalRatings : 0;
  const deptDonutData = [
    { name: '5★', value: deptScoreDist[4], percentage: deptTotalRatings > 0 ? ((deptScoreDist[4] / deptTotalRatings) * 100).toFixed(1) : '0' },
    { name: '4★', value: deptScoreDist[3], percentage: deptTotalRatings > 0 ? ((deptScoreDist[3] / deptTotalRatings) * 100).toFixed(1) : '0' },
    { name: '3★', value: deptScoreDist[2], percentage: deptTotalRatings > 0 ? ((deptScoreDist[2] / deptTotalRatings) * 100).toFixed(1) : '0' },
    { name: '2★', value: deptScoreDist[1], percentage: deptTotalRatings > 0 ? ((deptScoreDist[1] / deptTotalRatings) * 100).toFixed(1) : '0' },
    { name: '1★', value: deptScoreDist[0], percentage: deptTotalRatings > 0 ? ((deptScoreDist[0] / deptTotalRatings) * 100).toFixed(1) : '0' }
  ];

  const institutionCriteriaData = criteria.map(c => {
    let totalScore = 0, totalCount = 0;
    ['Computer Science', 'Mathematics', 'Physics'].forEach(dept => { 
      const m = store.getDepartmentMetrics(dept, cycleId); 
      const score = m.criteriaAverages[c.id] || 0; 
      if (score > 0) { totalScore += score; totalCount++; } 
    });
    return { name: c.name, score: totalCount > 0 ? Number((totalScore / totalCount).toFixed(2)) : 0 };
  });

  const handleExport = async () => { await exportDeanReport(department, cycleId); };
  const handlePrint = () => { setIsPrintMode(true); setTimeout(() => { window.print(); setIsPrintMode(false); }, 100); };

  const handleDeanRelease = async () => {
    if (!deanSignature || !cycleId) return;
    await store.deanReleaseCycle(cycleId, department, user?.id || '', deanSignature);
    setShowDeanSignModal(false);
    setDeanSignature(null);
  };

  const handleSendReminder = async (facultyId: string) => {
    await store.sendReminder(facultyId);
    setAcknowledgmentTracking(store.getDeanAcknowledgmentTracking(department, cycleId));
  };

  // Department-level TNA: criteria below benchmark
  const deptTNACriteria = criteria.map(c => ({
    name: c.name,
    average: deptMetrics.criteriaAverages[c.id] || 0,
  })).filter(c => c.average < BENCHMARK && c.average > 0).sort((a, b) => a.average - b.average);

  if (isPrintMode) return (<DeanPrintReport department={department} cycleName={viewingCycle?.displayName || 'Current Cycle'} criteria={criteria} />);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#002366' }}>Department Overview</h2>
          <p className="text-sm" style={{ color: '#4B5563' }}>{department} Department • {user?.displayName}</p>
          {viewingCycle && <p className="text-xs mt-1" style={{ color: '#B87333' }}>Viewing: {viewingCycle.displayName}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" data-export-menu>
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#2E8B57' }}>
              <Download size={14} />Export Reports <ChevronDown size={14} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg z-50" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D5D8DC' }}>
                <div className="py-1">
                  <button onClick={async () => { await handleExport(); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50" style={{ color: '#1A1A1A' }}>
                    <FileSpreadsheet size={16} style={{ color: '#2E8B57' }} />
                    <div>
                      <div className="font-medium">Department Report (Excel)</div>
                      <div className="text-xs" style={{ color: '#6B7280' }}>Overview with all departments</div>
                    </div>
                  </button>
                  <button onClick={async () => { await exportDepartmentFacultyReport(department, cycleId); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50" style={{ color: '#1A1A1A' }}>
                    <FileSpreadsheet size={16} style={{ color: '#B87333' }} />
                    <div>
                      <div className="font-medium">Faculty Report (Excel)</div>
                      <div className="text-xs" style={{ color: '#6B7280' }}>Detailed faculty metrics</div>
                    </div>
                  </button>
                  <button onClick={async () => { await exportDepartmentPerformancePDF(department, cycleId); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50" style={{ color: '#1A1A1A' }}>
                    <FileText size={16} style={{ color: '#002366' }} />
                    <div>
                      <div className="font-medium">Performance Summary (PDF)</div>
                      <div className="text-xs" style={{ color: '#6B7280' }}>Professional format with charts</div>
                    </div>
                  </button>
                  <button onClick={() => { handlePrint(); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50" style={{ color: '#1A1A1A' }}>
                    <Printer size={16} style={{ color: '#6B7280' }} />
                    <div>
                      <div className="font-medium">Print Report</div>
                      <div className="text-xs" style={{ color: '#6B7280' }}>Browser print dialog</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#F5E6D3', border: '1px solid #B87333' }}>
        <Shield size={16} style={{ color: '#B87333' }} />
        <p className="text-xs"><strong>Privacy Notice:</strong> Department-level aggregated metrics and individual faculty data are shown for oversight purposes.</p>
      </div>

      {/* Admin Release Status */}
      {!isAdminReleased && (
        <div className="rounded-xl p-5 flex items-center gap-3" style={{ backgroundColor: '#FEF3C7', border: '2px solid #B87333' }}>
          <Shield size={24} style={{ color: '#B87333' }} />
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: '#B87333' }}>⏳ Pending Admin Release</p>
            <p className="text-xs mt-1" style={{ color: '#4B5563' }}>The Administrator has not yet released evaluation data for this cycle. Department metrics and faculty data will become available after the Admin signs the Release Contract.</p>
          </div>
        </div>
      )}

      {/* Dean Receipt Status - Option C: 7-day deadline */}
      {isAdminReleased && !isDeanReleased && deanReceiptDeadline && (
        <div className="rounded-xl p-5" style={{ backgroundColor: deanReceiptDeadline.isOverdue ? '#FEE2E2' : '#EDEBE8', border: `2px solid ${deanReceiptDeadline.isOverdue ? '#C41E3A' : '#002366'}` }}>
          <div className="flex items-center gap-3 mb-4">
            {deanReceiptDeadline.isOverdue ? <XCircle size={24} style={{ color: '#C41E3A' }} /> : <Clock size={24} style={{ color: '#002366' }} />}
            <div>
              <p className="font-bold text-sm" style={{ color: deanReceiptDeadline.isOverdue ? '#C41E3A' : '#002366' }}>
                {deanReceiptDeadline.isOverdue ? '⚠️ Receipt Overdue' : '📋 Dean Receipt & Release Contract'}
              </p>
              <p className="text-xs mt-1" style={{ color: '#4B5563' }}>
                {deanReceiptDeadline.isOverdue 
                  ? `Receipt was due ${Math.abs(deanReceiptDeadline.daysRemaining)} days ago. Please sign immediately.`
                  : `You have ${deanReceiptDeadline.daysRemaining} days to sign the receipt contract. Faculty can already view their data.`}
              </p>
            </div>
          </div>
          <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#F8F6F1', border: '1px solid #D5D8DC' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#002366' }}>Contract Terms:</p>
            <ul className="text-xs space-y-1" style={{ color: '#4B5563' }}>
              <li>• I acknowledge receipt of the evaluation data for the {department} department.</li>
              <li>• I confirm the data has been reviewed for accuracy at the department aggregate level.</li>
              <li>• I understand that faculty may file disputes regarding their evaluation results.</li>
            </ul>
          </div>
          <button onClick={() => setShowDeanSignModal(true)} className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: '#002366' }}>
            Sign Receipt Contract
          </button>
        </div>
      )}

      {/* Dean Receipt Completed */}
      {isAdminReleased && isDeanReleased && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#D1FAE5', border: '1px solid #2E8B57' }}>
          <CheckCircle size={16} style={{ color: '#2E8B57' }} />
          <p className="text-xs font-medium" style={{ color: '#2E8B57' }}>✓ Receipt contract signed by {user?.displayName}. Department data released to faculty.</p>
        </div>
      )}

      {/* KPI Cards */}
      {isAdminReleased && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} style={{ color: '#002366' }} />
              <span className="text-xs font-medium" style={{ color: '#4B5563' }}>Total Submissions</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#002366' }}>{deptMetrics.totalSubmissions}</p>
          </div>
          <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} style={{ color: '#2E8B57' }} />
              <span className="text-xs font-medium" style={{ color: '#4B5563' }}>Dept Average</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#2E8B57' }}>{deptMetrics.institutionAverage.toFixed(2)}</p>
          </div>
          <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} style={{ color: '#B87333' }} />
              <span className="text-xs font-medium" style={{ color: '#4B5563' }}>Faculty Count</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#B87333' }}>{deptMetrics.totalFaculty}</p>
          </div>
          <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} style={{ color: '#C41E3A' }} />
              <span className="text-xs font-medium" style={{ color: '#4B5563' }}>Acknowledged</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#C41E3A' }}>{acknowledged}/{faculty.length}</p>
          </div>
        </div>
      )}

      {/* Early Warning Indicators */}
      {isAdminReleased && earlyWarnings.length > 0 && (
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#FEE2E2', border: '1px solid #C41E3A' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#C41E3A' }}>
            <AlertTriangle size={16} />Early Warning Indicators
          </h3>
          <div className="space-y-2">
            {earlyWarnings.slice(0, 5).map((warning, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" 
                        style={{ backgroundColor: warning.severity === 'high' ? '#C41E3A' : warning.severity === 'medium' ? '#B87333' : '#9CA3AF' }}>
                    {warning.severity === 'high' ? '!' : warning.severity === 'medium' ? '⚠' : '•'}
                  </span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{warning.name}</p>
                    <p className="text-xs" style={{ color: '#4B5563' }}>{warning.type}: {warning.message}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedFacultyId(warning.facultyId)} className="px-2 py-1 rounded text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#002366' }}>
                  <Eye size={12} /> View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparative Analytics */}
      {isAdminReleased && comparativeAnalytics && (
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}>
            <TrendingUp size={16} style={{ color: '#B87333' }} />Comparative Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
              <p className="text-xs" style={{ color: '#4B5563' }}>Department Average</p>
              <p className="text-xl font-bold" style={{ color: '#002366' }}>{comparativeAnalytics.departmentAverage.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
              <p className="text-xs" style={{ color: '#4B5563' }}>Institution Average</p>
              <p className="text-xl font-bold" style={{ color: '#002366' }}>{comparativeAnalytics.institutionAverage.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: comparativeAnalytics.difference >= 0 ? '#D1FAE5' : '#FEE2E2' }}>
              <p className="text-xs" style={{ color: '#4B5563' }}>Difference</p>
              <p className="text-xl font-bold" style={{ color: comparativeAnalytics.difference >= 0 ? '#2E8B57' : '#C41E3A' }}>
                {comparativeAnalytics.difference >= 0 ? '+' : ''}{comparativeAnalytics.difference.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#002366' }}>
                  <th className="text-left px-4 py-2 text-white font-medium">Rank</th>
                  <th className="text-left px-4 py-2 text-white font-medium">Faculty</th>
                  <th className="text-center px-4 py-2 text-white font-medium">Average</th>
                  <th className="text-center px-4 py-2 text-white font-medium">Percentile</th>
                  <th className="text-center px-4 py-2 text-white font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {comparativeAnalytics.facultyRankings.map((f, i) => (
                  <tr key={f.facultyId} style={{ backgroundColor: i % 2 === 0 ? '#EDEBE8' : '#F8F6F1' }}>
                    <td className="px-4 py-2 font-medium">#{f.rank}</td>
                    <td className="px-4 py-2">{f.name}</td>
                    <td className="px-4 py-2 text-center font-bold" style={{ color: f.average >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                      {f.average.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" 
                            style={{ 
                              backgroundColor: f.percentile === 'Top 25%' ? '#D1FAE5' : f.percentile === 'Bottom 25%' ? '#FEE2E2' : '#F5E6D3',
                              color: f.percentile === 'Top 25%' ? '#2E8B57' : f.percentile === 'Bottom 25%' ? '#C41E3A' : '#B87333'
                            }}>
                        {f.percentile}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => setSelectedFacultyId(f.facultyId)} className="px-2 py-1 rounded text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#002366' }}>
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Faculty Performance Summary */}
      {isAdminReleased && (
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Faculty Performance Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#002366' }}>
                  <th className="text-left px-4 py-2 text-white font-medium">Faculty</th>
                  <th className="text-center px-4 py-2 text-white font-medium">Submissions</th>
                  <th className="text-center px-4 py-2 text-white font-medium">Average</th>
                  <th className="text-center px-4 py-2 text-white font-medium">Status</th>
                  <th className="text-center px-4 py-2 text-white font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {facultyPerformance.map((f, i) => (
                  <tr key={f.id} style={{ backgroundColor: i % 2 === 0 ? '#EDEBE8' : '#F8F6F1' }}>
                    <td className="px-4 py-2 font-medium">{f.name}</td>
                    <td className="px-4 py-2 text-center">{f.totalSubmissions}</td>
                    <td className="px-4 py-2 text-center font-bold" style={{ color: f.totalSubmissions < THRESHOLD ? '#9CA3AF' : f.overallAverage >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                      {f.totalSubmissions < THRESHOLD ? '—' : f.overallAverage.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" 
                            style={{ backgroundColor: f.acknowledgmentStatus === 'acknowledged' ? '#D1FAE5' : '#F5E6D3', color: f.acknowledgmentStatus === 'acknowledged' ? '#2E8B57' : '#B87333' }}>
                        {f.acknowledgmentStatus === 'acknowledged' ? '✓ Ack' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => setSelectedFacultyId(f.id)} className="px-2 py-1 rounded text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#002366' }}>
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Faculty Drilldown Modal */}
      {facultyDrilldown && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedFacultyId(null)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-6" style={{ backgroundColor: '#EDEBE8' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#002366' }}>
              Faculty Drilldown: {facultyDrilldown.faculty.name}
            </h3>
            
            {/* Metrics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                <p className="text-xs" style={{ color: '#4B5563' }}>Total Submissions</p>
                <p className="text-xl font-bold" style={{ color: '#002366' }}>{facultyDrilldown.metrics.totalSubmissions}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                <p className="text-xs" style={{ color: '#4B5563' }}>Overall Average</p>
                <p className="text-xl font-bold" style={{ color: '#002366' }}>{facultyDrilldown.metrics.overallAverage.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                <p className="text-xs" style={{ color: '#4B5563' }}>Courses Taught</p>
                <p className="text-xl font-bold" style={{ color: '#002366' }}>{facultyDrilldown.courseBreakdown.length}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                <p className="text-xs" style={{ color: '#4B5563' }}>Status</p>
                <p className="text-sm font-bold" style={{ color: facultyDrilldown.acknowledgmentStatus === 'acknowledged' ? '#2E8B57' : '#B87333' }}>
                  {facultyDrilldown.acknowledgmentStatus.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            {/* Criteria Breakdown */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Criteria Breakdown</h4>
              <div className="space-y-3">
                {facultyDrilldown.criteriaBreakdown.map((crit) => (
                  <div key={crit.criterionId} className="p-3 rounded-lg" style={{ backgroundColor: '#F8F6F1' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{crit.criterionName}</p>
                      <p className="text-sm font-bold" style={{ color: crit.average >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                        {crit.average.toFixed(2)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {crit.subQuestions.map((sq) => (
                        <div key={sq.subQuestionId} className="flex items-center justify-between text-xs">
                          <span style={{ color: '#4B5563' }}>{sq.text}</span>
                          <span className="font-bold" style={{ color: sq.average >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                            {sq.average.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Breakdown */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Course Performance</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: '#002366' }}>
                      <th className="text-left px-4 py-2 text-white font-medium">Course</th>
                      <th className="text-center px-4 py-2 text-white font-medium">Submissions</th>
                      <th className="text-center px-4 py-2 text-white font-medium">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultyDrilldown.courseBreakdown.map((course, i) => (
                      <tr key={course.courseId} style={{ backgroundColor: i % 2 === 0 ? '#EDEBE8' : '#F8F6F1' }}>
                        <td className="px-4 py-2 font-medium">{course.courseId}</td>
                        <td className="px-4 py-2 text-center">{course.submissions}</td>
                        <td className="px-4 py-2 text-center font-bold" style={{ color: course.average >= BENCHMARK ? '#2E8B57' : '#C41E3A' }}>
                          {course.average.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feedback Themes */}
            {facultyDrilldown.feedbackThemes.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3" style={{ color: '#002366' }}>Feedback Themes</h4>
                <div className="space-y-2">
                  {facultyDrilldown.feedbackThemes.map((theme, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#F8F6F1' }}>
                      <span className="text-sm">{theme.theme}</span>
                      <span className="text-xs font-bold" style={{ color: '#B87333' }}>{theme.count} ({theme.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedFacultyId(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: '#002366' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Acknowledgment Tracking */}
      {isAdminReleased && acknowledgmentTracking.length > 0 && (
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}>
            <Clock size={16} style={{ color: '#B87333' }} />Acknowledgment Tracking
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#002366' }}>
                  <th className="text-left px-4 py-2 text-white font-medium">Faculty</th>
                  <th className="text-center px-4 py-2 text-white font-medium">Status</th>
                  <th className="text-center px-4 py-2 text-white font-medium">Days Since Ack</th>
                  <th className="text-center px-4 py-2 text-white font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {acknowledgmentTracking.map((track, i) => (
                  <tr key={track.facultyId} style={{ backgroundColor: i % 2 === 0 ? '#EDEBE8' : '#F8F6F1' }}>
                    <td className="px-4 py-2 font-medium">{track.name}</td>
                    <td className="px-4 py-2 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" 
                            style={{ 
                              backgroundColor: track.status === 'acknowledged' ? '#D1FAE5' : '#F5E6D3',
                              color: track.status === 'acknowledged' ? '#2E8B57' : '#B87333'
                            }}>
                        {track.status === 'acknowledged' ? '✓ Ack' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {track.daysSinceAcknowledgment !== null ? `${track.daysSinceAcknowledgment} days` : '—'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {track.needsReminder && (
                        <button onClick={() => handleSendReminder(track.facultyId)} className="px-2 py-1 rounded text-xs font-medium text-white hover:opacity-90" style={{ backgroundColor: '#B87333' }}>
                          Send Reminder
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispute Management */}
      {isAdminReleased && disputeManagement && disputeManagement.total > 0 && (
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#EDEBE8' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#002366' }}>
            <AlertCircle size={16} style={{ color: '#B87333' }} />Dispute Management
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEE2E2' }}>
              <p className="text-xs" style={{ color: '#4B5563' }}>Pending</p>
              <p className="text-xl font-bold" style={{ color: '#C41E3A' }}>{disputeManagement.pending}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#D1FAE5' }}>
              <p className="text-xs" style={{ color: '#4B5563' }}>Resolved</p>
              <p className="text-xl font-bold" style={{ color: '#2E8B57' }}>{disputeManagement.resolved}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5E6D3' }}>
              <p className="text-xs" style={{ color: '#4B5563' }}>Dismissed</p>
              <p className="text-xl font-bold" style={{ color: '#B87333' }}>{disputeManagement.dismissed}</p>
            </div>
          </div>
        </div>
      )}

      {/* Department TNA */}
      {isAdminReleased && deptTNACriteria.length > 0 && (
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#FEE2E2', border: '1px solid #C41E3A' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#C41E3A' }}>
            <AlertTriangle size={16} />Department Training Needs Analysis
          </h3>
          <p className="text-xs mb-3" style={{ color: '#4B5563' }}>
            The following department criteria scored below the {BENCHMARK.toFixed(1)}/5.0 benchmark, indicating department-wide training needs:
          </p>
          <div className="space-y-2">
            {deptTNACriteria.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#FFFFFF' }}>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#C41E3A' }}>{i + 1}</span>
                  <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{c.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#D5D8DC' }}>
                    <div className="h-full rounded-full" style={{ width: `${(c.average / 5) * 100}%`, backgroundColor: '#C41E3A' }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#C41E3A' }}>{c.average.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dean Signature Modal */}
      {showDeanSignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeanSignModal(false)} />
          <div className="relative w-full max-w-lg rounded-xl shadow-2xl p-6" style={{ backgroundColor: '#EDEBE8' }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#002366' }}>Dean Receipt & Release Signature</h3>
            <p className="text-xs mb-4" style={{ color: '#4B5563' }}>
              By signing below, you acknowledge receipt of evaluation data for the {department} department.
            </p>
            <SignaturePad onSignatureChange={setDeanSignature} width={450} height={200} />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowDeanSignModal(false)} className="px-3 py-1.5 rounded-lg text-sm border hover:bg-black/5" style={{ borderColor: '#D5D8DC' }}>
                Cancel
              </button>
              <button onClick={handleDeanRelease} disabled={!deanSignature} className="px-4 py-1.5 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#002366' }}>
                Sign Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
