import { store, BENCHMARK } from '../store';

/**
 * AI-Driven Training Needs Analysis (TNA) Engine
 * 
 * This engine analyzes evaluation data at department and institutional levels
 * to generate intelligent training recommendations based on performance deficits.
 */

export interface TNADeficit {
  criterionId: string;
  criterionName: string;
  average: number;
  deficit: number;
  severity: 'critical' | 'high' | 'medium';
  subQuestionDeficits: Array<{
    subQuestionId: string;
    subQuestionText: string;
    average: number;
    deficit: number;
  }>;
}

export interface DepartmentTNA {
  department: string;
  cycleId: string;
  generatedAt: string;
  overallAverage: number;
  totalSubmissions: number;
  deficits: TNADeficit[];
  feedbackThemes: {
    positive: string[];
    negative: string[];
    sentimentRatio: number;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  priorityScore: number;
}

export interface InstitutionalTNA {
  cycleId: string;
  generatedAt: string;
  departments: DepartmentTNA[];
  institutionalAverage: number;
  totalSubmissions: number;
  criticalDepartments: string[];
  crossDepartmentalThemes: {
    strengths: string[];
    weaknesses: string[];
  };
  strategicRecommendations: {
    institutionWide: string[];
    departmentSpecific: Record<string, string[]>;
  };
}

/**
 * Analyzes feedback sentiment using keyword-based AI approach
 */
function analyzeFeedbackSentiment(feedback: string[]): { positive: string[]; negative: string[]; sentimentRatio: number } {
  const positiveKeywords = ['excellent', 'great', 'good', 'amazing', 'wonderful', 'fantastic', 'engaging', 'clear', 'helpful', 'passionate', 'approachable', 'fair', 'organized', 'effective', 'knowledgeable', 'inspiring'];
  const negativeKeywords = ['poor', 'bad', 'terrible', 'confusing', 'unclear', 'unfair', 'disorganized', 'boring', 'slow', 'rude', 'unprofessional', 'unprepared', 'disengaged', 'unhelpful'];
  
  const positiveThemes: string[] = [];
  const negativeThemes: string[] = [];
  
  feedback.forEach(fb => {
    const lowerFb = fb.toLowerCase();
    positiveKeywords.forEach(kw => {
      if (lowerFb.includes(kw) && !positiveThemes.includes(kw)) {
        positiveThemes.push(kw);
      }
    });
    negativeKeywords.forEach(kw => {
      if (lowerFb.includes(kw) && !negativeThemes.includes(kw)) {
        negativeThemes.push(kw);
      }
    });
  });
  
  const positiveCount = feedback.filter(fb => positiveKeywords.some(kw => fb.toLowerCase().includes(kw))).length;
  const sentimentRatio = feedback.length > 0 ? (positiveCount / feedback.length) * 100 : 0;
  
  return { positive: positiveThemes, negative: negativeThemes, sentimentRatio };
}

/**
 * Identifies performance deficits below benchmark
 */
function identifyDeficits(department: string, cycleId: string): TNADeficit[] {
  const deptMetrics = store.getDepartmentMetrics(department, cycleId);
  const criteria = store.getCriteria();
  const subQuestions = store.getSubQuestions();
  
  const deficits: TNADeficit[] = [];
  
  criteria.forEach(criterion => {
    const avg = deptMetrics.criteriaAverages[criterion.id] || 0;
    
    if (avg < BENCHMARK && avg > 0) {
      const deficit = BENCHMARK - avg;
      const severity = deficit >= 1.5 ? 'critical' : deficit >= 0.8 ? 'high' : 'medium';
      
      // Analyze sub-question deficits
      const criterionSubQuestions = subQuestions.filter(sq => sq.criterionId === criterion.id);
      const subQuestionDeficits = criterionSubQuestions.map(sq => {
        const sqAvg = deptMetrics.criteriaAverages[criterion.id] || 0; // Using criterion avg as proxy
        return {
          subQuestionId: sq.id,
          subQuestionText: sq.text,
          average: sqAvg,
          deficit: BENCHMARK - sqAvg,
        };
      }).filter(sq => sq.deficit > 0);
      
      deficits.push({
        criterionId: criterion.id,
        criterionName: criterion.name,
        average: avg,
        deficit,
        severity,
        subQuestionDeficits,
      });
    }
  });
  
  return deficits.sort((a, b) => b.deficit - a.deficit);
}

/**
 * Generates AI-driven recommendations based on deficits and feedback
 */
function generateRecommendations(deficits: TNADeficit[], feedbackSentiment: { positive: string[]; negative: string[] }): {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
} {
  const immediate: string[] = [];
  const shortTerm: string[] = [];
  const longTerm: string[] = [];
  
  // Critical deficits require immediate action
  const criticalDeficits = deficits.filter(d => d.severity === 'critical');
  const highDeficits = deficits.filter(d => d.severity === 'high');
  
  if (criticalDeficits.length > 0) {
    immediate.push('Conduct emergency department meeting to address critical performance gaps');
    immediate.push('Implement intensive peer mentoring program for affected criteria');
    criticalDeficits.forEach(d => {
      immediate.push(`Deploy targeted workshop for ${d.criterionName} (Current: ${d.average.toFixed(2)}/5.0)`);
    });
  }
  
  if (highDeficits.length > 0) {
    shortTerm.push('Schedule department-wide training sessions for high-priority areas');
    shortTerm.push('Establish monthly progress review meetings');
    highDeficits.forEach(d => {
      shortTerm.push(`Develop improvement plan for ${d.criterionName}`);
    });
  }
  
  // Feedback-based recommendations
  if (feedbackSentiment.negative.includes('confusing') || feedbackSentiment.negative.includes('unclear')) {
    shortTerm.push('Implement clarity-focused teaching workshops');
    longTerm.push('Develop standardized communication guidelines');
  }
  
  if (feedbackSentiment.negative.includes('disorganized') || feedbackSentiment.negative.includes('unprepared')) {
    shortTerm.push('Create department-wide lesson planning templates');
    longTerm.push('Establish peer review system for course materials');
  }
  
  if (feedbackSentiment.negative.includes('boring') || feedbackSentiment.negative.includes('disengaged')) {
    shortTerm.push('Organize interactive teaching methodology seminar');
    longTerm.push('Implement student engagement tracking system');
  }
  
  // Long-term strategic recommendations
  longTerm.push('Establish continuous professional development program');
  longTerm.push('Create departmental teaching excellence awards');
  longTerm.push('Develop mentorship pairing system');
  
  if (feedbackSentiment.positive.includes('engaging') || feedbackSentiment.positive.includes('passionate')) {
    longTerm.push('Leverage high-performing faculty as department trainers');
  }
  
  return { immediate, shortTerm, longTerm };
}

/**
 * Calculates department priority score based on deficits and sentiment
 */
function calculatePriorityScore(deficits: TNADeficit[], sentimentRatio: number): number {
  const deficitScore = deficits.reduce((sum, d) => {
    const severityMultiplier = d.severity === 'critical' ? 3 : d.severity === 'high' ? 2 : 1;
    return sum + (d.deficit * severityMultiplier);
  }, 0);
  
  const sentimentPenalty = (100 - sentimentRatio) / 100;
  
  return Math.round((deficitScore * (1 + sentimentPenalty)) * 10) / 10;
}

/**
 * Generates department-level TNA analysis
 */
export function generateDepartmentTNA(department: string, cycleId?: string): DepartmentTNA {
  const effectiveCycleId = cycleId || store.getActiveCycle()?.id || '';
  const deptMetrics = store.getDepartmentMetrics(department, effectiveCycleId);
  
  // Collect all feedback for the department
  const allFeedback: string[] = [];
  const faculty = store.getFacultyByDepartment(department);
  faculty.forEach(f => {
    const metrics = store.getFacultyMetrics(f.id, effectiveCycleId);
    metrics.feedback.forEach(fb => allFeedback.push(fb.feedback));
  });
  
  const deficits = identifyDeficits(department, effectiveCycleId);
  const feedbackSentiment = analyzeFeedbackSentiment(allFeedback);
  const recommendations = generateRecommendations(deficits, feedbackSentiment);
  const priorityScore = calculatePriorityScore(deficits, feedbackSentiment.sentimentRatio);
  
  return {
    department,
    cycleId: effectiveCycleId,
    generatedAt: new Date().toISOString(),
    overallAverage: deptMetrics.institutionAverage,
    totalSubmissions: deptMetrics.totalSubmissions,
    deficits,
    feedbackThemes: feedbackSentiment,
    recommendations,
    priorityScore,
  };
}

/**
 * Generates institution-level TNA analysis
 */
export function generateInstitutionalTNA(cycleId?: string): InstitutionalTNA {
  const effectiveCycleId = cycleId || store.getActiveCycle()?.id || '';
  const departments = ['Computer Science', 'Mathematics', 'Physics'];
  
  const departmentTNAs = departments.map(dept => generateDepartmentTNA(dept, effectiveCycleId));
  
  // Calculate institutional metrics
  const totalSubmissions = departmentTNAs.reduce((sum, dept) => sum + dept.totalSubmissions, 0);
  const institutionalAverage = totalSubmissions > 0
    ? departmentTNAs.reduce((sum, dept) => sum + (dept.overallAverage * dept.totalSubmissions), 0) / totalSubmissions
    : 0;
  
  // Identify critical departments
  const criticalDepartments = departmentTNAs
    .filter(dept => dept.deficits.some(d => d.severity === 'critical'))
    .map(dept => dept.department);
  
  // Analyze cross-departmental themes
  const allPositiveThemes = departmentTNAs.flatMap(dept => dept.feedbackThemes.positive);
  const allNegativeThemes = departmentTNAs.flatMap(dept => dept.feedbackThemes.negative);
  
  const uniquePositive = [...new Set(allPositiveThemes)];
  const uniqueNegative = [...new Set(allNegativeThemes)];
  
  // Generate strategic recommendations
  const institutionWide: string[] = [];
  const departmentSpecific: Record<string, string[]> = {};
  
  if (criticalDepartments.length > 0) {
    institutionWide.push('Establish institution-wide teaching excellence task force');
    institutionWide.push('Allocate emergency training budget for critical departments');
  }
  
  if (uniqueNegative.includes('confusing') || uniqueNegative.includes('unclear')) {
    institutionWide.push('Develop institution-wide communication standards');
  }
  
  if (uniqueNegative.includes('disorganized')) {
    institutionWide.push('Implement standardized course management systems');
  }
  
  institutionWide.push('Create cross-departmental mentorship program');
  institutionWide.push('Establish annual teaching conference');
  
  // Department-specific recommendations
  departmentTNAs.forEach(dept => {
    const deptRecs: string[] = [];
    
    if (dept.deficits.length > 0) {
      deptRecs.push(`Focus improvement efforts on: ${dept.deficits.map(d => d.criterionName).join(', ')}`);
    }
    
    if (dept.feedbackThemes.sentimentRatio < 50) {
      deptRecs.push('Implement student feedback response system');
    }
    
    if (dept.priorityScore > 10) {
      deptRecs.push('Prioritize intensive intervention program');
    }
    
    departmentSpecific[dept.department] = deptRecs;
  });
  
  return {
    cycleId: effectiveCycleId,
    generatedAt: new Date().toISOString(),
    departments: departmentTNAs,
    institutionalAverage,
    totalSubmissions,
    criticalDepartments,
    crossDepartmentalThemes: {
      strengths: uniquePositive,
      weaknesses: uniqueNegative,
    },
    strategicRecommendations: {
      institutionWide,
      departmentSpecific,
    },
  };
}

/**
 * Extracts actionable insights from TNA data
 */
export function extractTNAInsights(tna: DepartmentTNA | InstitutionalTNA): {
  keyFindings: string[];
  actionItems: string[];
  riskFactors: string[];
} {
  const keyFindings: string[] = [];
  const actionItems: string[] = [];
  const riskFactors: string[] = [];
  
  if ('departments' in tna) {
    // Institutional TNA
    keyFindings.push(`Institutional average: ${tna.institutionalAverage.toFixed(2)}/5.0`);
    keyFindings.push(`Total evaluations: ${tna.totalSubmissions}`);
    
    if (tna.criticalDepartments.length > 0) {
      riskFactors.push(`Critical departments requiring immediate attention: ${tna.criticalDepartments.join(', ')}`);
      actionItems.push('Convene emergency academic council meeting');
    }
    
    if (tna.crossDepartmentalThemes.weaknesses.length > 0) {
      keyFindings.push(`Cross-departmental challenges: ${tna.crossDepartmentalThemes.weaknesses.join(', ')}`);
    }
    
    tna.strategicRecommendations.institutionWide.forEach(rec => {
      actionItems.push(rec);
    });
  } else {
    // Department TNA
    keyFindings.push(`Department average: ${tna.overallAverage.toFixed(2)}/5.0`);
    keyFindings.push(`Total evaluations: ${tna.totalSubmissions}`);
    
    if (tna.deficits.length > 0) {
      const criticalCount = tna.deficits.filter(d => d.severity === 'critical').length;
      if (criticalCount > 0) {
        riskFactors.push(`${criticalCount} critical performance deficit(s) identified`);
      }
      
      tna.deficits.forEach(deficit => {
        keyFindings.push(`${deficit.criterionName}: ${deficit.average.toFixed(2)}/5.0 (${deficit.severity} priority)`);
      });
    }
    
    if (tna.feedbackThemes.sentimentRatio < 50) {
      riskFactors.push(`Low student sentiment: ${tna.feedbackThemes.sentimentRatio.toFixed(1)}% positive`);
    }
    
    tna.recommendations.immediate.forEach(rec => actionItems.push(`IMMEDIATE: ${rec}`));
    tna.recommendations.shortTerm.forEach(rec => actionItems.push(`SHORT-TERM: ${rec}`));
    tna.recommendations.longTerm.forEach(rec => actionItems.push(`LONG-TERM: ${rec}`));
  }
  
  return { keyFindings, actionItems, riskFactors };
}
