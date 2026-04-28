// FairLens Mock API Service
// Works entirely client-side - no backend needed!

const STORAGE_KEY = 'fairlens_data';

interface FairnessMetrics {
  demographic_parity: number;
  disparate_impact: number;
  severity: 'green' | 'amber' | 'red';
  group_scores: Record<string, number>;
}

interface AuditResult {
  id: string;
  projectId: string;
  metrics: Record<string, FairnessMetrics>;
  summary: {
    overall_score: number;
    critical_violations: number;
    warnings: number;
    passing: number;
  };
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

// Protected attribute patterns
const PROTECTED_PATTERNS = ['gender', 'sex', 'race', 'ethnicity', 'religion', 'age', 'caste', 'region', 'disability'];

function loadData(): { projects: Project[]; audits: AuditResult[] } {
  if (typeof window === 'undefined') return { projects: [], audits: [] };
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}
  
  return { projects: [], audits: [] };
}

function saveData(data: { projects: Project[]; audits: AuditResult[] }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

function detectSensitiveColumns(columns: string[]): string[] {
  return columns.filter(col => 
    PROTECTED_PATTERNS.some(pattern => col.toLowerCase().includes(pattern))
  );
}

function computeFairnessMetrics(data: Record<string, any>[], sensitiveCols: string[]): Record<string, FairnessMetrics> {
  const results: Record<string, FairnessMetrics> = {};
  
  for (const attr of sensitiveCols) {
    const groups: Record<string, number[]> = {};
    
    for (const row of data) {
      const val = String(row[attr] || 'unknown');
      if (!groups[val]) groups[val] = [];
      const score = row.score ?? row.prediction ?? Math.random() * 0.5 + 0.5;
      groups[val].push(score);
    }
    
    const groupAvgs = Object.entries(groups).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length] as const);
    
    if (groupAvgs.length >= 2) {
      const rates = groupAvgs.map(([, v]) => v);
      const maxRate = Math.max(...rates);
      const minRate = Math.min(...rates);
      const di = maxRate > 0 ? minRate / maxRate : 0;
      
      results[attr] = {
        demographic_parity: Math.abs(maxRate - minRate),
        disparate_impact: di,
        severity: di < 0.8 ? 'red' : di < 0.9 ? 'amber' : 'green',
        group_scores: Object.fromEntries(groupAvgs.map(([k, v]) => [k, Math.round(v * 100) / 100]))
      };
    }
  }
  
  return results;
}

export const mockApi = {
  // Projects
  async getProjects(): Promise<Project[]> {
    await this.delay(100);
    const data = loadData();
    return data.projects.length > 0 ? data.projects : this.getDemoProjects();
  },
  
  async createProject(name: string, description: string): Promise<Project> {
    await this.delay(200);
    const data = loadData();
    const project: Project = {
      id: `proj_${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString()
    };
    data.projects.push(project);
    saveData(data);
    return project;
  },
  
  // Datasets / Upload
  async uploadDataset(_projectId: string, file: File): Promise<{ 
    uploadId: string; 
    columns: string[]; 
    sensitiveColumns: string[];
    rowCount: number;
    sampleData: Record<string, any>[];
  }> {
    await this.delay(500);
    
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1, 101).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i]?.trim() }), {});
    });
    
    return {
      uploadId: `upload_${Date.now()}`,
      columns: headers,
      sensitiveColumns: detectSensitiveColumns(headers),
      rowCount: lines.length - 1,
      sampleData: rows.slice(0, 5)
    };
  },
  
  // Fairness Audit
  async runAudit(projectId: string, data: Record<string, any>[]): Promise<AuditResult> {
    await this.delay(800);
    
    const allColumns = Object.keys(data[0] || {});
    const sensitiveCols = detectSensitiveColumns(allColumns);
    const metrics = computeFairnessMetrics(data, sensitiveCols);
    
    const critical = Object.values(metrics).filter(m => m.severity === 'red').length;
    const warnings = Object.values(metrics).filter(m => m.severity === 'amber').length;
    const passing = Object.values(metrics).filter(m => m.severity === 'green').length;
    const score = Math.max(0, 1 - (critical * 0.3 + warnings * 0.1));
    
    const result: AuditResult = {
      id: `audit_${Date.now()}`,
      projectId,
      metrics,
      summary: {
        overall_score: Math.round(score * 100) / 100,
        critical_violations: critical,
        warnings,
        passing
      },
      createdAt: new Date().toISOString()
    };
    
    const stored = loadData();
    stored.audits.push(result);
    saveData(stored);
    
    return result;
  },
  
  // AI Insights (simulated with templates)
  async generateInsights(audit: AuditResult): Promise<{ insights: string; source: string }> {
    await this.delay(500);
    
    const { summary, metrics } = audit;
    const critical = summary.critical_violations;
    const warnings = summary.warnings;
    
    let insights = `## 📊 Fairness Audit Summary\n\n`;
    insights += `**Overall Fairness Score:** ${Math.round(summary.overall_score * 100)}%\n\n`;
    
    if (critical > 0) {
      insights += `### 🚨 CRITICAL ISSUES DETECTED\n`;
      insights += `${critical} violation${critical > 1 ? 's' : ''} found requiring immediate attention.\n\n`;
    } else if (warnings > 0) {
      insights += `### ⚠️ Warnings Detected\n`;
      insights += `${warnings} potential fairness issue${warnings > 1 ? 's' : ''} to monitor.\n\n`;
    } else {
      insights += `### ✅ Fairness Checks Passed\n`;
      insights += `All metrics within acceptable ranges.\n\n`;
    }
    
    insights += `### Key Findings\n\n`;
    for (const [attr, data] of Object.entries(metrics)) {
      const emoji = { red: '🚨', amber: '⚠️', green: '✅' }[data.severity];
      insights += `- ${emoji} **${attr}:** Disparate Impact = ${data.disparate_impact.toFixed(2)}\n`;
    }
    
    insights += `\n### Recommendations\n\n`;
    if (critical > 0) {
      insights += `1. 🔴 Review training data for representation issues\n`;
      insights += `2. 📊 Apply fairness constraints during model training\n`;
      insights += `3. ⚖️ Consider post-processing calibration\n`;
    } else if (warnings > 0) {
      insights += `1. ⚠️ Monitor metrics over time\n`;
      insights += `2. 📈 Collect more representative data\n`;
    } else {
      insights += `1. ✅ Continue current monitoring practices\n`;
      insights += `2. 📊 Track metrics for drift detection\n`;
    }
    
    return { insights, source: 'demo' };
  },
  
  // What-if Chat
  async whatIfChat(question: string): Promise<{ answer: string }> {
    await this.delay(300);
    
    const q = question.toLowerCase();
    let answer = '';
    
    if (q.includes('remove') || q.includes('drop') || q.includes('remove')) {
      answer = `When removing protected attributes:\n\n1. Check for proxy discrimination through correlated features\n2. Test model performance across demographic groups\n3. Consider adversarial debiasing techniques\n\nRemoving an attribute doesn't guarantee fairness if proxy variables exist.`;
    } else if (q.includes('improve') || q.includes('fix') || q.includes('bias')) {
      answer = `To improve fairness:\n\n1. **Rebalance data** - Ensure equal representation\n2. **Fairness constraints** - Add during training (e.g., equalized odds)\n3. **Post-processing** - Calibrate predictions per group\n4. **Regular audits** - Monitor in production\n\nWhich approach would you like to explore further?`;
    } else if (q.includes('demographic') || q.includes('parity')) {
      answer = `**Demographic Parity** measures the difference in positive prediction rates between groups.\n\n- Value = 0 means equal treatment\n- > 0.1 may indicate bias\n- > 0.2 is concerning\n\nWould you like me to explain other metrics?`;
    } else if (q.includes('disparate') || q.includes('impact')) {
      answer = `**Disparate Impact** uses the 80% rule:\n\n- Ratio < 0.8 = potential discrimination\n- Ratio >= 0.8 = generally acceptable\n- Ratio = 1.0 = perfect parity\n\nThis is a key metric for legal compliance.`;
    } else {
      answer = `I'm here to help with fairness questions! Ask me about:\n\n- Removing biased features\n- Improving model fairness\n- Understanding specific metrics\n- Recommendations for your data\n\nWhat would you like to know?`;
    }
    
    return { answer };
  },
  
  // Compliance Report
  async generateReport(audit: AuditResult): Promise<{ report: string }> {
    await this.delay(400);
    
    const { summary, metrics } = audit;
    const date = new Date().toLocaleDateString();
    
    let report = `# FairLens Compliance Report\n\n`;
    report += `**Generated:** ${date}\n`;
    report += `**Audit ID:** ${audit.id}\n\n`;
    report += `---\n\n`;
    report += `## Executive Summary\n\n`;
    report += `**Fairness Score:** ${Math.round(summary.overall_score * 100)}%\n`;
    report += `**Critical Issues:** ${summary.critical_violations}\n`;
    report += `**Warnings:** ${summary.warnings}\n\n`;
    report += `---\n\n`;
    report += `## Detailed Findings\n\n`;
    
    for (const [attr, data] of Object.entries(metrics)) {
      report += `### ${attr.charAt(0).toUpperCase() + attr.slice(1)}\n`;
      report += `- Disparate Impact: ${data.disparate_impact.toFixed(4)}\n`;
      report += `- Demographic Parity: ${data.demographic_parity.toFixed(4)}\n`;
      report += `- Severity: ${data.severity.toUpperCase()}\n\n`;
    }
    
    report += `---\n\n`;
    report += `## Recommendations\n\n`;
    
    if (summary.critical_violations > 0) {
      report += `1. Review critical violations immediately\n`;
      report += `2. Analyze training data for imbalances\n`;
      report += `3. Apply fairness-aware algorithms\n`;
    } else {
      report += `1. Continue monitoring in production\n`;
      report += `2. Set up drift detection\n`;
      report += `3. Schedule regular audits\n`;
    }
    
    report += `\n---\n\n*Generated by FairLens - AI Fairness Platform*\n`;
    
    return { report };
  },
  
  // Demo data
  getDemoProjects(): Project[] {
    return [
      { id: 'demo_1', name: 'Demo Fairness Audit', description: 'Sample project for testing', createdAt: new Date().toISOString() }
    ];
  },
  
  getDemoAudit(): AuditResult {
    return {
      id: 'demo_audit',
      projectId: 'demo_1',
      metrics: {
        gender: { demographic_parity: 0.15, disparate_impact: 0.72, severity: 'red', group_scores: { male: 0.85, female: 0.61 } },
        age: { demographic_parity: 0.08, disparate_impact: 0.91, severity: 'green', group_scores: { '18-35': 0.82, '36-50': 0.75, '51+': 0.73 } }
      },
      summary: { overall_score: 0.75, critical_violations: 1, warnings: 1, passing: 2 },
      createdAt: new Date().toISOString()
    };
  },
  
  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};