/**
 * WaaZ Test Report Generator
 * Generates comprehensive HTML reports from test results.
 * Usage: import { generateReport } from './report-generator';
 */

export interface TestResult {
  name: string;
  suite: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number; // ms
  error?: string;
  screenshot?: string; // base64 or URL
}

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestCount: number;
  errorRate: number;
}

export interface CoverageData {
  totalLines: number;
  coveredLines: number;
  totalFunctions: number;
  coveredFunctions: number;
  totalBranches: number;
  coveredBranches: number;
  files: { path: string; lineCoverage: number; functionCoverage: number }[];
}

export interface SecurityFinding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  remediation: string;
  location?: string;
}

export interface ReportData {
  projectName?: string;
  runDate?: string;
  environment?: string;
  branch?: string;
  commitHash?: string;
  tests: TestResult[];
  performance?: PerformanceMetric[];
  coverage?: CoverageData;
  security?: SecurityFinding[];
  recommendations?: string[];
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function severityColor(s: string) {
  const map: Record<string, string> = { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#2563eb', info: '#6b7280' };
  return map[s] || '#6b7280';
}

function statusIcon(s: string) {
  return s === 'passed' ? '✅' : s === 'failed' ? '❌' : '⏭️';
}

export function generateReport(data: ReportData): string {
  const { tests, performance, coverage, security, recommendations } = data;
  const total = tests.length;
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const skipped = tests.filter(t => t.status === 'skipped').length;
  const passRate = total ? ((passed / total) * 100).toFixed(1) : '0';
  const totalDuration = tests.reduce((s, t) => s + t.duration, 0);
  const runDate = data.runDate || new Date().toISOString();
  const projectName = data.projectName || 'WaaZ Platform';

  const suites = [...new Set(tests.map(t => t.suite))];

  const lineCov = coverage ? ((coverage.coveredLines / coverage.totalLines) * 100).toFixed(1) : null;
  const fnCov = coverage ? ((coverage.coveredFunctions / coverage.totalFunctions) * 100).toFixed(1) : null;
  const brCov = coverage ? ((coverage.coveredBranches / coverage.totalBranches) * 100).toFixed(1) : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(projectName)} – Test Report</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#e2e8f0;line-height:1.6}
.container{max-width:1200px;margin:0 auto;padding:24px}
header{background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:32px;margin-bottom:24px;border:1px solid #475569}
header h1{font-size:28px;font-weight:700;color:#f8fafc}
header .meta{display:flex;gap:24px;margin-top:12px;font-size:13px;color:#94a3b8;flex-wrap:wrap}
header .meta span{display:flex;align-items:center;gap:4px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px}
.card{background:#1e293b;border-radius:10px;padding:20px;text-align:center;border:1px solid #334155;transition:transform .15s}
.card:hover{transform:translateY(-2px)}
.card .value{font-size:36px;font-weight:800}
.card .label{font-size:13px;color:#94a3b8;margin-top:4px}
.card.pass .value{color:#22c55e}
.card.fail .value{color:#ef4444}
.card.skip .value{color:#eab308}
.card.rate .value{color:${Number(passRate) >= 90 ? '#22c55e' : Number(passRate) >= 70 ? '#eab308' : '#ef4444'}}
.card.time .value{color:#38bdf8;font-size:24px}
section{background:#1e293b;border-radius:10px;padding:24px;margin-bottom:24px;border:1px solid #334155}
section h2{font-size:20px;font-weight:700;margin-bottom:16px;color:#f8fafc;cursor:pointer;user-select:none}
section h2::before{content:'▸ ';color:#64748b;font-size:14px}
section h2.open::before{content:'▾ '}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;padding:10px 12px;background:#0f172a;color:#94a3b8;font-weight:600;position:sticky;top:0}
td{padding:10px 12px;border-top:1px solid #334155}
tr:hover td{background:#334155}
.status-passed{color:#22c55e;font-weight:600}
.status-failed{color:#ef4444;font-weight:600}
.status-skipped{color:#eab308;font-weight:600}
.error-msg{background:#1c1917;color:#fca5a5;padding:8px 12px;border-radius:6px;font-family:'Fira Code',monospace;font-size:12px;margin-top:6px;white-space:pre-wrap;max-height:120px;overflow:auto}
.bar{height:8px;border-radius:4px;background:#334155;overflow:hidden;margin-top:4px}
.bar-fill{height:100%;border-radius:4px;transition:width .4s}
.severity{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700;color:#fff}
.pill{display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;margin:2px}
.filter-bar{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.filter-bar button{background:#334155;color:#e2e8f0;border:none;padding:6px 16px;border-radius:999px;cursor:pointer;font-size:13px;transition:background .15s}
.filter-bar button.active,.filter-bar button:hover{background:#3b82f6;color:#fff}
.actions{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}
.actions button{background:#3b82f6;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;transition:background .15s}
.actions button:hover{background:#2563eb}
.actions button.secondary{background:#475569}
.actions button.secondary:hover{background:#64748b}
.rec-list{list-style:none;counter-reset:rec}
.rec-list li{counter-increment:rec;padding:10px 0 10px 36px;border-bottom:1px solid #334155;position:relative}
.rec-list li::before{content:counter(rec);position:absolute;left:0;top:10px;width:24px;height:24px;border-radius:50%;background:#3b82f6;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
@media print{body{background:#fff;color:#1e293b}.container{padding:0}header,.card,section{border:1px solid #e2e8f0;background:#fff}.actions,.filter-bar{display:none!important}}
@media(max-width:640px){.cards{grid-template-columns:repeat(2,1fr)}.card .value{font-size:28px}}
</style>
</head>
<body>
<div class="container">
<header>
  <h1>📊 ${escapeHtml(projectName)} – Test Report</h1>
  <div class="meta">
    <span>📅 ${new Date(runDate).toLocaleString()}</span>
    ${data.environment ? `<span>🌐 ${escapeHtml(data.environment)}</span>` : ''}
    ${data.branch ? `<span>🌿 ${escapeHtml(data.branch)}</span>` : ''}
    ${data.commitHash ? `<span>🔗 ${escapeHtml(data.commitHash.slice(0, 8))}</span>` : ''}
  </div>
</header>

<div class="actions">
  <button onclick="window.print()">📄 Export PDF</button>
  <button class="secondary" onclick="copyReport()">📋 Copy Summary</button>
  <button class="secondary" onclick="downloadJSON()">💾 Download JSON</button>
</div>

<!-- Summary Cards -->
<div class="cards">
  <div class="card"><div class="value">${total}</div><div class="label">Total Tests</div></div>
  <div class="card pass"><div class="value">${passed}</div><div class="label">Passed</div></div>
  <div class="card fail"><div class="value">${failed}</div><div class="label">Failed</div></div>
  <div class="card skip"><div class="value">${skipped}</div><div class="label">Skipped</div></div>
  <div class="card rate"><div class="value">${passRate}%</div><div class="label">Pass Rate</div></div>
  <div class="card time"><div class="value">${(totalDuration / 1000).toFixed(1)}s</div><div class="label">Total Duration</div></div>
</div>

<!-- Detailed Results -->
<section>
  <h2 class="open" onclick="toggle(this)">Detailed Test Results</h2>
  <div class="section-body">
    <div class="filter-bar">
      <button class="active" onclick="filterTests('all',this)">All (${total})</button>
      <button onclick="filterTests('passed',this)">✅ Passed (${passed})</button>
      <button onclick="filterTests('failed',this)">❌ Failed (${failed})</button>
      <button onclick="filterTests('skipped',this)">⏭️ Skipped (${skipped})</button>
    </div>
    <table id="test-table">
      <thead><tr><th>Status</th><th>Suite</th><th>Test</th><th>Duration</th><th>Details</th></tr></thead>
      <tbody>
${tests.map(t => `        <tr data-status="${t.status}">
          <td>${statusIcon(t.status)}</td>
          <td>${escapeHtml(t.suite)}</td>
          <td><span class="status-${t.status}">${escapeHtml(t.name)}</span>${t.error ? `<div class="error-msg">${escapeHtml(t.error)}</div>` : ''}</td>
          <td>${t.duration}ms</td>
          <td>${t.screenshot ? `<a href="${t.screenshot}" target="_blank" style="color:#38bdf8">📸</a>` : '—'}</td>
        </tr>`).join('\n')}
      </tbody>
    </table>
  </div>
</section>

${performance && performance.length ? `
<!-- Performance -->
<section>
  <h2 class="open" onclick="toggle(this)">Performance Metrics</h2>
  <div class="section-body">
    <table>
      <thead><tr><th>Endpoint</th><th>Method</th><th>Avg (ms)</th><th>P95 (ms)</th><th>P99 (ms)</th><th>Requests</th><th>Error %</th></tr></thead>
      <tbody>
${performance.map(p => `        <tr>
          <td>${escapeHtml(p.endpoint)}</td>
          <td><span class="pill" style="background:#475569">${p.method}</span></td>
          <td style="color:${p.avgResponseTime > 500 ? '#ef4444' : p.avgResponseTime > 200 ? '#eab308' : '#22c55e'}">${p.avgResponseTime}</td>
          <td>${p.p95ResponseTime}</td>
          <td>${p.p99ResponseTime}</td>
          <td>${p.requestCount}</td>
          <td style="color:${p.errorRate > 1 ? '#ef4444' : '#22c55e'}">${p.errorRate.toFixed(2)}%</td>
        </tr>`).join('\n')}
      </tbody>
    </table>
  </div>
</section>` : ''}

${coverage ? `
<!-- Coverage -->
<section>
  <h2 class="open" onclick="toggle(this)">Code Coverage</h2>
  <div class="section-body">
    <div class="cards" style="margin-bottom:20px">
      <div class="card"><div class="value" style="color:${Number(lineCov) >= 80 ? '#22c55e' : '#eab308'}">${lineCov}%</div><div class="label">Line Coverage</div><div class="bar"><div class="bar-fill" style="width:${lineCov}%;background:${Number(lineCov!) >= 80 ? '#22c55e' : '#eab308'}"></div></div></div>
      <div class="card"><div class="value" style="color:${Number(fnCov) >= 80 ? '#22c55e' : '#eab308'}">${fnCov}%</div><div class="label">Function Coverage</div><div class="bar"><div class="bar-fill" style="width:${fnCov}%;background:${Number(fnCov!) >= 80 ? '#22c55e' : '#eab308'}"></div></div></div>
      <div class="card"><div class="value" style="color:${Number(brCov) >= 80 ? '#22c55e' : '#eab308'}">${brCov}%</div><div class="label">Branch Coverage</div><div class="bar"><div class="bar-fill" style="width:${brCov}%;background:${Number(brCov!) >= 80 ? '#22c55e' : '#eab308'}"></div></div></div>
    </div>
    <table>
      <thead><tr><th>File</th><th>Lines</th><th>Functions</th></tr></thead>
      <tbody>
${coverage.files.map(f => `        <tr>
          <td style="font-family:monospace;font-size:13px">${escapeHtml(f.path)}</td>
          <td><div class="bar" style="width:120px;display:inline-block;vertical-align:middle"><div class="bar-fill" style="width:${f.lineCoverage}%;background:${f.lineCoverage >= 80 ? '#22c55e' : '#eab308'}"></div></div> ${f.lineCoverage.toFixed(0)}%</td>
          <td>${f.functionCoverage.toFixed(0)}%</td>
        </tr>`).join('\n')}
      </tbody>
    </table>
  </div>
</section>` : ''}

${security && security.length ? `
<!-- Security -->
<section>
  <h2 class="open" onclick="toggle(this)">Security Findings (${security.length})</h2>
  <div class="section-body">
    <div style="margin-bottom:16px">
      ${['critical','high','medium','low','info'].map(s => {
        const c = security.filter(f => f.severity === s).length;
        return c ? `<span class="severity" style="background:${severityColor(s)}">${s.toUpperCase()}: ${c}</span> ` : '';
      }).join('')}
    </div>
    <table>
      <thead><tr><th>ID</th><th>Severity</th><th>Finding</th><th>Remediation</th></tr></thead>
      <tbody>
${security.map(f => `        <tr>
          <td style="font-family:monospace">${escapeHtml(f.id)}</td>
          <td><span class="severity" style="background:${severityColor(f.severity)}">${f.severity.toUpperCase()}</span></td>
          <td><strong>${escapeHtml(f.title)}</strong><br><span style="color:#94a3b8;font-size:13px">${escapeHtml(f.description)}</span>${f.location ? `<br><code style="color:#38bdf8">${escapeHtml(f.location)}</code>` : ''}</td>
          <td style="font-size:13px">${escapeHtml(f.remediation)}</td>
        </tr>`).join('\n')}
      </tbody>
    </table>
  </div>
</section>` : ''}

${recommendations && recommendations.length ? `
<!-- Recommendations -->
<section>
  <h2 class="open" onclick="toggle(this)">Recommendations</h2>
  <div class="section-body">
    <ol class="rec-list">
${recommendations.map(r => `      <li>${escapeHtml(r)}</li>`).join('\n')}
    </ol>
  </div>
</section>` : ''}

<footer style="text-align:center;padding:24px;color:#64748b;font-size:13px">
  Generated by WaaZ Test Report Generator • ${new Date(runDate).toLocaleString()}
</footer>
</div>

<script>
function toggle(el){
  el.classList.toggle('open');
  const body=el.nextElementSibling;
  body.style.display=body.style.display==='none'?'':'none';
}
function filterTests(status,btn){
  document.querySelectorAll('.filter-bar button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#test-table tbody tr').forEach(r=>{
    r.style.display=(status==='all'||r.dataset.status===status)?'':'none';
  });
}
function copyReport(){
  const s=document.querySelector('header h1').textContent+'\\n'+
    'Pass: ${passed}/${total} (${passRate}%) | Failed: ${failed} | Skipped: ${skipped} | Duration: ${(totalDuration/1000).toFixed(1)}s';
  navigator.clipboard.writeText(s).then(()=>alert('Summary copied!'));
}
function downloadJSON(){
  const blob=new Blob([JSON.stringify(${JSON.stringify({total,passed,failed,skipped,passRate,totalDuration,runDate,tests:tests.map(t=>({name:t.name,suite:t.suite,status:t.status,duration:t.duration,error:t.error}))})},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='test-report.json';a.click();
}
</script>
</body>
</html>`;
}

// --- CI/CD Integration Helper ---
export function generateReportFromVitest(vitestJsonOutput: any): ReportData {
  const tests: TestResult[] = [];
  for (const file of vitestJsonOutput.testResults || []) {
    for (const t of file.assertionResults || []) {
      tests.push({
        name: t.title || t.fullName,
        suite: file.name?.replace(/^.*src\//, 'src/') || 'unknown',
        status: t.status === 'passed' ? 'passed' : t.status === 'pending' ? 'skipped' : 'failed',
        duration: t.duration || 0,
        error: t.failureMessages?.join('\n'),
      });
    }
  }
  return {
    projectName: 'WaaZ Platform',
    runDate: new Date().toISOString(),
    tests,
  };
}

// --- Sample data for demo ---
export function generateSampleReport(): ReportData {
  const suites = ['Auth', 'Admin Dashboard', 'Partner Claims', 'Customer Portal', 'API', 'Device Onboarding'];
  const tests: TestResult[] = [];
  suites.forEach(suite => {
    const count = 5 + Math.floor(Math.random() * 10);
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      const status: TestResult['status'] = r > 0.12 ? 'passed' : r > 0.05 ? 'failed' : 'skipped';
      tests.push({
        name: `${suite} test case #${i + 1}`,
        suite,
        status,
        duration: Math.floor(50 + Math.random() * 2000),
        error: status === 'failed' ? `AssertionError: expected 200 but received 500\n    at Object.<anonymous> (src/${suite.toLowerCase()}.test.ts:${10 + i}:5)` : undefined,
      });
    }
  });

  return {
    projectName: 'WaaZ Platform',
    runDate: new Date().toISOString(),
    environment: 'staging',
    branch: 'main',
    commitHash: 'a1b2c3d4e5f6',
    tests,
    performance: [
      { endpoint: '/api/claims', method: 'GET', avgResponseTime: 145, p95ResponseTime: 320, p99ResponseTime: 580, requestCount: 1000, errorRate: 0.2 },
      { endpoint: '/api/claims', method: 'POST', avgResponseTime: 230, p95ResponseTime: 450, p99ResponseTime: 890, requestCount: 100, errorRate: 0.5 },
      { endpoint: '/api/devices', method: 'GET', avgResponseTime: 98, p95ResponseTime: 210, p99ResponseTime: 350, requestCount: 1000, errorRate: 0.1 },
      { endpoint: '/api/dashboard', method: 'GET', avgResponseTime: 340, p95ResponseTime: 780, p99ResponseTime: 1200, requestCount: 500, errorRate: 0.8 },
      { endpoint: '/api/partners', method: 'GET', avgResponseTime: 120, p95ResponseTime: 250, p99ResponseTime: 400, requestCount: 300, errorRate: 0.0 },
    ],
    coverage: {
      totalLines: 4200, coveredLines: 3360,
      totalFunctions: 380, coveredFunctions: 310,
      totalBranches: 620, coveredBranches: 434,
      files: [
        { path: 'src/components/ClaimSubmissionForm.tsx', lineCoverage: 92, functionCoverage: 88 },
        { path: 'src/pages/admin/AdminDashboard.tsx', lineCoverage: 78, functionCoverage: 72 },
        { path: 'src/contexts/AuthContext.tsx', lineCoverage: 85, functionCoverage: 90 },
        { path: 'src/services/commissionService.ts', lineCoverage: 95, functionCoverage: 100 },
        { path: 'src/pages/partner/PartnerDashboard.tsx', lineCoverage: 70, functionCoverage: 65 },
      ],
    },
    security: [
      { id: 'SEC-001', severity: 'high', title: 'Missing rate limiting on login', description: 'No rate limiting on /auth/login endpoint allows brute-force attacks.', remediation: 'Add rate limiting middleware (max 5 attempts/min per IP).', location: 'src/contexts/AuthContext.tsx' },
      { id: 'SEC-002', severity: 'medium', title: 'Verbose error messages', description: 'API returns stack traces in error responses.', remediation: 'Sanitize error responses in production.', location: 'supabase/functions/' },
      { id: 'SEC-003', severity: 'low', title: 'Missing security headers', description: 'X-Content-Type-Options and X-Frame-Options headers not set.', remediation: 'Add security headers via middleware or CDN config.' },
    ],
    recommendations: [
      'Add rate limiting to authentication endpoints to prevent brute-force attacks',
      'Increase code coverage for PartnerDashboard from 70% to 80%+',
      'Optimize /api/dashboard endpoint — P99 latency (1200ms) exceeds 500ms target',
      'Add input validation tests for all form components',
      'Set up automated security scanning in CI/CD pipeline',
    ],
  };
}
