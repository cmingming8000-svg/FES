import { store, BENCHMARK } from '../store';
import type { DepartmentTNA, InstitutionalTNA, TNADeficit } from '../types';

export function generateDepartmentTNA(department: string, cycleId?: string): DepartmentTNA {
  const effectiveCycleId = cycleId || store.getActiveCycle()?.id;
  if (!effectiveCycleId) throw new Error('No active cycle found');

  const deptMetrics = store.getDepartmentMetrics(department, effectiveCycleId);
  const criteria = store.getCriteria();
  const subQuestions = store.getSubQuestions();
  const evaluations = store.getEvaluations().filter(e => e.cycleId === effectiveCycleId);
  
  const deptFaculty = store.getFacultyByDepartment(department);
  const deptEvals = evaluations.filter(e => deptFaculty.some(f => f.id === e.facultyId));

  // Identify deficits
  const deficits: TNADeficit[] = criteria.map(criterion => {
    const avg = deptMetrics.criteriaAverages[criterion.id] || 0;
    const deficit = BENCHMARK - avg;
    const severity: 'critical' | 'high' | 'medium' = deficit >= 1.5 ? 'critical' : deficit >= 0.8 ? 'high' : 'medium';
    
    const critSubQuestions = subQuestions.filter(sq => sq.criterionId === criterion.id);
    // Use criterion average as proxy for sub-question averages since we don't have granular data
    const subQuestionDeficits = critSubQuestions.map(sq => ({
      subQuestionId: sq.id,
      subQuestionText: sq.text,
      average: avg,
      deficit: deficit
    })).filter(sq => sq.deficit > 0);

    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      average: avg,
      deficit,
      severity,
      subQuestionDeficits
    };
  }).filter(d => d.deficit > 0);

  // Analyze feedback sentiment
  const feedbackTexts = deptEvals.map(e => e.feedback).filter(f => f && f.trim());
  const positiveKeywords = ['excellent', 'great', 'good', 'engaging', 'clear', 'helpful', 'passionate', 'organized'];
  const negativeKeywords = ['poor', 'bad', 'confusing', 'unclear', 'unfair', 'disorganized', 'boring'];
  
  const positive = feedbackTexts.filter(f => positiveKeywords.some(kw => f.toLowerCase().includes(kw)));
  const negative = feedbackTexts.filter(f => negativeKeywords.some(kw => f.toLowerCase().includes(kw)));
  const sentimentRatio = feedbackTexts.length > 0 ? (positive.length / feedbackTexts.length) * 100 : 0;

  // Generate recommendations
  const immediate: string[] = [];
  const shortTerm: string[] = [];
  const longTerm: string[] = [];

  deficits.forEach(deficit => {
    if (deficit.severity === 'critical') {
      immediate.push(`Critical: Address ${deficit.criterionName} (avg: ${deficit.average.toFixed(2)})`);
    } else if (deficit.severity === 'high') {
      shortTerm.push(`High Priority: Improve ${deficit.criterionName} (avg: ${deficit.average.toFixed(2)})`);
    } else {
      longTerm.push(`Monitor: ${deficit.criterionName} (avg: ${deficit.average.toFixed(2)})`);
    }
  });

  if (sentimentRatio < 50) {
    immediate.push('Low student sentiment detected - consider department-wide feedback review');
  }

  if (immediate.length === 0) immediate.push('No immediate actions required');
  if (shortTerm.length === 0) shortTerm.push('Continue current practices');
  if (longTerm.length === 0) longTerm.push('Maintain quality standards');

  // Calculate priority score
  const priorityScore = deficits.reduce((sum, d) => {
    const weight = d.severity === 'critical' ? 3 : d.severity === 'high' ? 2 : 1;
    return sum + (d.deficit * weight);
  }, 0);

  return {
    department,
    cycleId: effectiveCycleId,
    generatedAt: new Date().toISOString(),
    overallAverage: deptMetrics.institutionAverage,
    totalSubmissions: deptMetrics.totalSubmissions,
    deficits,
    feedbackThemes: {
      positive: positive.slice(0, 5),
      negative: negative.slice(0, 5),
      sentimentRatio
    },
    recommendations: { immediate, shortTerm, longTerm },
    priorityScore
  };
}

export function generateInstitutionalTNA(cycleId?: string): InstitutionalTNA {
  const effectiveCycleId = cycleId || store.getActiveCycle()?.id;
  if (!effectiveCycleId) throw new Error('No active cycle found');

  const departments = ['Computer Science', 'Mathematics', 'Physics'];
  const departmentTNAs = departments.map(dept => generateDepartmentTNA(dept, effectiveCycleId));

  const totalSubmissions = departmentTNAs.reduce((sum, d) => sum + d.totalSubmissions, 0);
  const institutionalAverage = totalSubmissions > 0
    ? departmentTNAs.reduce((sum, d) => sum + (d.overallAverage * d.totalSubmissions), 0) / totalSubmissions
    : 0;

  const criticalDepartments = departmentTNAs
    .filter(d => d.deficits.some(def => def.severity === 'critical'))
    .map(d => d.department);

  // Cross-departmental themes
  const allPositive = departmentTNAs.flatMap(d => d.feedbackThemes.positive);
  const allNegative = departmentTNAs.flatMap(d => d.feedbackThemes.negative);
  const strengths = [...new Set(allPositive)].slice(0, 5);
  const weaknesses = [...new Set(allNegative)].slice(0, 5);

  // Strategic recommendations
  const institutionWide: string[] = [];
  const departmentSpecific: Record<string, string[]> = {};

  if (criticalDepartments.length > 0) {
    institutionWide.push(`Focus resources on critical departments: ${criticalDepartments.join(', ')}`);
  }

  if (weaknesses.length > 0) {
    institutionWide.push(`Address common challenges: ${weaknesses.join(', ')}`);
  }

  institutionWide.push('Implement institution-wide faculty development program');
  institutionWide.push('Establish peer mentoring across departments');

  departmentTNAs.forEach(deptTNA => {
    departmentSpecific[deptTNA.department] = [
      ...deptTNA.recommendations.immediate,
      ...deptTNA.recommendations.shortTerm
    ];
  });

  return {
    cycleId: effectiveCycleId,
    generatedAt: new Date().toISOString(),
    departments: departmentTNAs,
    institutionalAverage,
    totalSubmissions,
    criticalDepartments,
    crossDepartmentalThemes: { strengths, weaknesses },
    strategicRecommendations: { institutionWide, departmentSpecific }
  };
}

export function extractTNAInsights(tna: DepartmentTNA | InstitutionalTNA) {
  if ('departments' in tna) {
    // Institutional TNA
    return {
      keyFindings: [
        `Institutional average: ${tna.institutionalAverage.toFixed(2)}/5.0`,
        `Total evaluations: ${tna.totalSubmissions}`,
        `Critical departments: ${tna.criticalDepartments.length > 0 ? tna.criticalDepartments.join(', ') : 'None'}`
      ],
      actionItems: tna.strategicRecommendations.institutionWide,
      riskFactors: tna.criticalDepartments.length > 0 
        ? [`${tna.criticalDepartments.length} department(s) require immediate attention`]
        : []
    };
  } else {
    // Department TNA
    return {
      keyFindings: [
        `Department average: ${tna.overallAverage.toFixed(2)}/5.0`,
        `Total evaluations: ${tna.totalSubmissions}`,
        `Priority score: ${tna.priorityScore.toFixed(1)}`
      ],
      actionItems: [
        ...tna.recommendations.immediate,
        ...tna.recommendations.shortTerm,
        ...tna.recommendations.longTerm
      ],
      riskFactors: tna.deficits.filter(d => d.severity === 'critical').length > 0
        ? [`${tna.deficits.filter(d => d.severity === 'critical').length} critical deficit(s) identified`]
        : []
    };
  }
}
