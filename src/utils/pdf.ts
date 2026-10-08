import { jsPDF } from 'jspdf';
import { store, BENCHMARK } from '../store';

export async function exportFacultyPDF(facultyId: string, cycleId?: string): Promise<void> {
  const faculty = store.getFacultyById(facultyId);
  if (!faculty) { alert('Faculty not found'); return; }

  const allCycles = store.getCycles();
  const activeCycle = store.getActiveCycle();
  const effectiveCycleId = cycleId || activeCycle?.id;
  const cycle = allCycles.find(c => c.id === effectiveCycleId);
  const metrics = store.getFacultyMetrics(facultyId, effectiveCycleId);
  const criteria = store.getCriteria();
  const subQuestions = store.getSubQuestions();

  if (!metrics || metrics.totalSubmissions === 0) { alert('No evaluation data available for this period'); return; }

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;
    const trackingId = `FES-${Date.now()}-${facultyId}`;
    const generationTimestamp = new Date().toLocaleString();

    doc.setFillColor(0, 35, 102);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('FACULTY EVALUATION REPORT', margin, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Faculty Evaluation System', margin, 30);
    yPos = 50;
    doc.setTextColor(0, 0, 0);

    doc.setFillColor(248, 246, 241);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 35, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Metadata', margin + 5, yPos + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tracking ID: ${trackingId}`, margin + 5, yPos + 16);
    doc.text(`Generated: ${generationTimestamp}`, margin + 5, yPos + 22);
    doc.text(`Status: ${faculty.acknowledgmentStatus === 'acknowledged' ? '✓ Faculty Signed & Acknowledged' : '○ Pending Acknowledgment'}`, margin + 5, yPos + 28);
    yPos += 45;

    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 35, 102);
    doc.text('Faculty Information', margin, yPos); yPos += 10;
    doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);
    const facultyInfo = [
      ['Name:', faculty.name], ['Department:', faculty.department], ['Title:', faculty.title],
      ['Evaluation Period:', cycle?.displayName || 'N/A'], ['Total Submissions:', metrics.totalSubmissions.toString()],
      ['Overall Average:', `${metrics.overallAverage.toFixed(2)} / 5.0`],
    ];
    facultyInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold'); doc.text(label, margin, yPos);
      doc.setFont('helvetica', 'normal'); doc.text(value, margin + 50, yPos); yPos += 7;
    });
    yPos += 10;

    if (faculty.acknowledgmentStatus === 'acknowledged' && faculty.signature) {
      doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 35, 102);
      doc.text('Faculty Signature', margin, yPos); yPos += 10;
      try { doc.addImage(faculty.signature, 'PNG', margin, yPos, 80, 30); yPos += 35; } catch (e) { yPos += 5; }
    }

    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 35, 102);
    doc.text('Criteria Performance Breakdown', margin, yPos); yPos += 10;
    doc.setFillColor(0, 35, 102); doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Criterion', margin + 5, yPos + 5); doc.text('Average', margin + 100, yPos + 5); doc.text('Rating', margin + 130, yPos + 5);
    yPos += 8; doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal');

    criteria.forEach((crit, i) => {
      const critAvg = metrics.criteriaAverages[crit.id] || 0;
      const rating = critAvg >= 4.5 ? 'Excellent' : critAvg >= BENCHMARK ? 'Good' : critAvg >= 2 ? 'Needs Improvement' : 'Critical';
      if (i % 2 === 0) { doc.setFillColor(248, 246, 241); doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F'); }
      doc.text(crit.name, margin + 5, yPos + 5); doc.text(critAvg.toFixed(2), margin + 100, yPos + 5);
      if (critAvg >= BENCHMARK) doc.setTextColor(46, 139, 87); else doc.setTextColor(196, 30, 58);
      doc.text(rating, margin + 130, yPos + 5); doc.setTextColor(0, 0, 0); yPos += 7;
      const critSQs = subQuestions.filter(sq => sq.criterionId === crit.id);
      critSQs.forEach(sq => {
        const sqAvg = metrics.subQuestionAverages[sq.id] || 0;
        const sqRating = sqAvg >= 4.5 ? 'Excellent' : sqAvg >= BENCHMARK ? 'Good' : sqAvg >= 2 ? 'Needs Improvement' : 'Critical';
        if (yPos > 270) { doc.addPage(); yPos = margin; }
        doc.setFontSize(9);
        const sqTextLines = doc.splitTextToSize(`  → ${sq.text}`, 85);
        sqTextLines.forEach((line: string, lineIdx: number) => { doc.text(line, margin + 10, yPos + 4 + (lineIdx * 4)); });
        const textHeight = sqTextLines.length * 4;
        doc.text(sqAvg.toFixed(2), margin + 100, yPos + 4 + (textHeight - 4) / 2);
        if (sqAvg >= BENCHMARK) doc.setTextColor(46, 139, 87); else doc.setTextColor(196, 30, 58);
        doc.text(sqRating, margin + 130, yPos + 4 + (textHeight - 4) / 2);
        doc.setTextColor(0, 0, 0); doc.setFontSize(10); yPos += Math.max(6, textHeight + 2);
      });
    });

    yPos += 10;
    if (yPos > 240) { doc.addPage(); yPos = margin; }
    doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 35, 102);
    doc.text('Course Performance', margin, yPos); yPos += 10;
    doc.setFillColor(0, 35, 102); doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Course', margin + 5, yPos + 5); doc.text('Submissions', margin + 80, yPos + 5); doc.text('Average', margin + 120, yPos + 5);
    yPos += 8; doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal');
    Object.entries(metrics.courseBreakdown).forEach(([course, data], i) => {
      if (i % 2 === 0) { doc.setFillColor(248, 246, 241); doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F'); }
      doc.text(course, margin + 5, yPos + 5); doc.text(data.count.toString(), margin + 80, yPos + 5);
      if (data.average >= BENCHMARK) doc.setTextColor(46, 139, 87); else doc.setTextColor(196, 30, 58);
      doc.text(data.average.toFixed(2), margin + 120, yPos + 5); doc.setTextColor(0, 0, 0); yPos += 7;
    });

    const fileName = `FES_${faculty.name.replace(/[^a-zA-Z0-9]/g, '_')}_${cycle?.displayName.replace(/[^a-zA-Z0-9]/g, '_') || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    alert('Failed to generate PDF report. Please try again.');
  }
}
