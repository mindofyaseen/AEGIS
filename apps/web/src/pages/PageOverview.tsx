import React from 'react';
import {
  InvestigationReport,
  SecurityFinding,
  Severity
} from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Activity,
  Layers,
  ArrowRight,
  GitBranch,
  Server,
  Lock,
  Cpu,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { InfrastructureScene3D } from '../components/InfrastructureScene3D';

interface PageOverviewProps {
  report: InvestigationReport | null;
  loading: boolean;
  onNavigate: (page: any) => void;
  onSelectFinding: (finding: SecurityFinding) => void;
  isHardened?: boolean;
}

export const PageOverview: React.FC<PageOverviewProps> = ({
  report,
  loading,
  onNavigate,
  onSelectFinding,
  isHardened
}) => {
  if (loading || !report) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-aegis-panel rounded-lg border border-aegis-border" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-aegis-panel rounded-lg border border-aegis-border" />
          ))}
        </div>
        <div className="h-96 bg-aegis-panel rounded-lg border border-aegis-border" />
      </div>
    );
  }

  const isBlock = report.verdict === 'BLOCK';
  const isRefusal = report.verdict === 'INSUFFICIENT_CONTEXT';
  const isReady = report.verdict === 'READY_FOR_HUMAN_REVIEW';

  const completenessPct = Math.round(report.context_completeness.completeness_score * 100);

  return (
    <div className="space-y-6">
      {/* 1. Executive Verdict Command Hero */}
      <div
        className={`p-6 rounded-lg border shadow-panel relative overflow-hidden transition-all ${
          isBlock
            ? 'bg-gradient-to-r from-red-950/30 via-aegis-panel to-aegis-panel border-aegis-critical/40'
            : isRefusal
            ? 'bg-gradient-to-r from-amber-950/30 via-aegis-panel to-aegis-panel border-aegis-warning/40'
            : 'bg-gradient-to-r from-emerald-950/30 via-aegis-panel to-aegis-panel border-aegis-success/40'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-mono font-bold uppercase px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                  isBlock
                    ? 'bg-aegis-critical/20 text-aegis-critical border-aegis-critical/40'
                    : isRefusal
                    ? 'bg-aegis-warning/20 text-aegis-warning border-aegis-warning/40'
                    : 'bg-aegis-success/20 text-aegis-success border-aegis-success/40'
                }`}
              >
                {isBlock && <ShieldAlert className="w-3.5 h-3.5" />}
                {isRefusal && <AlertOctagon className="w-3.5 h-3.5" />}
                {isReady && <ShieldCheck className="w-3.5 h-3.5" />}
                VERDICT: {report.verdict}
              </span>
              <span className="text-xs font-mono text-aegis-textMuted">
                Investigation ID: <strong className="text-aegis-textPrimary">{report.investigation_id}</strong>
              </span>
            </div>

            <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-aegis-textPrimary">
              {report.verdict_reason}
            </h2>

            <p className="text-sm text-aegis-textSecondary leading-relaxed">
              {report.agent_reasoning_summary}
            </p>
          </div>

          {/* Context Completeness Progress Meter */}
          <div className="shrink-0 bg-aegis-bgSecondary/90 border border-aegis-border rounded-lg p-4 min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-aegis-textMuted">Telemetry Context:</span>
              <span className={`font-bold ${completenessPct >= 85 ? 'text-aegis-success' : 'text-aegis-warning'}`}>
                {completenessPct}% {report.context_completeness.verdict_eligible ? '(Eligible)' : '(Refusal)'}
              </span>
            </div>

            <div className="w-full bg-aegis-bg rounded-full h-2 overflow-hidden border border-aegis-border mb-2.5">
              <div
                className={`h-full transition-all duration-500 ${
                  completenessPct >= 85 ? 'bg-aegis-success' : 'bg-aegis-warning'
                }`}
                style={{ width: `${completenessPct}%` }}
              />
            </div>

            <div className="text-[11px] font-mono text-aegis-textMuted leading-tight">
              {report.context_completeness.successful_collectors} of {report.context_completeness.total_collectors_run} collectors verified.
              {report.context_completeness.stale_snapshots_detected && ' (Stale >24h snapshot detected)'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key High-Density Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="aegis-card p-4 space-y-2">
          <div className="flex items-center justify-between text-aegis-textMuted text-xs font-mono">
            <span>Discovered Assets</span>
            <Server className="w-4 h-4 text-aegis-accentBlue" />
          </div>
          <div className="text-2xl font-bold font-mono text-aegis-textPrimary">{report.total_resources}</div>
          <div className="text-[11px] text-aegis-textSecondary">Active AWS VPC, Subnet, EC2, IAM, S3 & RDS nodes</div>
        </div>

        {/* Metric 2 */}
        <div className="aegis-card p-4 space-y-2">
          <div className="flex items-center justify-between text-aegis-textMuted text-xs font-mono">
            <span>Security Findings</span>
            <AlertOctagon className="w-4 h-4 text-aegis-critical" />
          </div>
          <div className="text-2xl font-bold font-mono text-aegis-textPrimary flex items-baseline gap-2">
            <span>{report.total_findings}</span>
            <span className="text-xs font-normal text-aegis-critical font-mono">({report.critical_findings} Critical)</span>
          </div>
          <div className="text-[11px] text-aegis-textSecondary">Evaluated deterministically against 15 rules</div>
        </div>

        {/* Metric 3 */}
        <div className="aegis-card p-4 space-y-2">
          <div className="flex items-center justify-between text-aegis-textMuted text-xs font-mono">
            <span>Attack Paths</span>
            <GitBranch className="w-4 h-4 text-aegis-aiViolet" />
          </div>
          <div className="text-2xl font-bold font-mono text-aegis-textPrimary">{report.attack_paths.length}</div>
          <div className="text-[11px] text-aegis-textSecondary">Multi-hop traversals to private data tier</div>
        </div>

        {/* Metric 4 */}
        <div className="aegis-card p-4 space-y-2">
          <div className="flex items-center justify-between text-aegis-textMuted text-xs font-mono">
            <span>Remediation Plans</span>
            <ShieldCheck className="w-4 h-4 text-aegis-success" />
          </div>
          <div className="text-2xl font-bold font-mono text-aegis-textPrimary">{report.remediation_patches.length}</div>
          <div className="text-[11px] text-aegis-textSecondary">Rule 14 unified diffs & verification steps</div>
        </div>
      </div>

      {/* 3. Flagship 3D Topology Quick Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-aegis-textPrimary uppercase tracking-wider font-mono">
              Live Infrastructure 3D Spatial Canvas
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-aegis-accentCyan/10 text-aegis-accentCyan border border-aegis-accentCyan/20">
              Interactive WebGL
            </span>
          </div>
          <button
            onClick={() => onNavigate('explorer')}
            className="text-xs font-mono text-aegis-accentCyan hover:underline flex items-center gap-1"
          >
            Open Full Explorer <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <InfrastructureScene3D
          attackPaths={report.attack_paths}
          isHardened={isHardened}
          onSelectNode={(nodeId) => {
            const match = report.findings.find((f) => f.affected_resource_id === nodeId);
            if (match) onSelectFinding(match);
          }}
        />
      </div>

      {/* 4. Split Section: Priority Findings Queue vs Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Investigation Queue */}
        <div className="aegis-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-aegis-border pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-aegis-critical" />
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-aegis-textPrimary">
                Priority Investigation Queue ({report.findings.length})
              </h4>
            </div>
            <button
              onClick={() => onNavigate('findings')}
              className="text-[11px] font-mono text-aegis-accentCyan hover:underline"
            >
              View All Findings
            </button>
          </div>

          <div className="space-y-3">
            {report.findings.length === 0 ? (
              <div className="py-8 text-center text-xs text-aegis-textMuted font-mono">
                ✓ No active critical security violations identified in this environment.
              </div>
            ) : (
              report.findings.map((f) => (
                <div
                  key={f.finding_id}
                  onClick={() => {
                    onSelectFinding(f);
                    onNavigate('findings');
                  }}
                  className="p-3 rounded border border-aegis-border bg-aegis-bgSecondary hover:border-aegis-borderLight hover:bg-aegis-panelElevated transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-aegis-textPrimary truncate">{f.title}</span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border shrink-0 ${
                        f.severity === 'CRITICAL'
                          ? 'bg-aegis-critical/20 text-aegis-critical border-aegis-critical/30'
                          : 'bg-aegis-warning/20 text-aegis-warning border-aegis-warning/30'
                      }`}
                    >
                      {f.severity}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-aegis-accentBlue">Target: {f.affected_resource_id}</div>
                  <p className="text-xs text-aegis-textSecondary line-clamp-2 leading-relaxed">{f.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity & Investigation Traces */}
        <div className="aegis-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-aegis-border pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-aegis-accentCyan" />
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-aegis-textPrimary">
                Autonomous Agent Trace & Activity
              </h4>
            </div>
            <button
              onClick={() => onNavigate('agent_console')}
              className="text-[11px] font-mono text-aegis-accentCyan hover:underline"
            >
              Console Stream
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-start gap-2.5 p-2.5 rounded bg-aegis-bgSecondary border border-aegis-border">
              <span className="w-2 h-2 rounded-full bg-aegis-success shrink-0 mt-1.5" />
              <div className="space-y-0.5">
                <div className="text-aegis-textPrimary font-semibold">Discovery Ingestion Completed</div>
                <div className="text-[11px] text-aegis-textMuted">Discovered 12 AWS resources via read-only collectors</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded bg-aegis-bgSecondary border border-aegis-border">
              <span className="w-2 h-2 rounded-full bg-aegis-accentCyan shrink-0 mt-1.5" />
              <div className="space-y-0.5">
                <div className="text-aegis-textPrimary font-semibold">Context Completeness Gate Evaluated</div>
                <div className="text-[11px] text-aegis-textMuted">
                  Score: {completenessPct}% · {report.context_completeness.explanation}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded bg-aegis-bgSecondary border border-aegis-border">
              <span
                className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                  isBlock ? 'bg-aegis-critical' : 'bg-aegis-success'
                }`}
              />
              <div className="space-y-0.5">
                <div className="text-aegis-textPrimary font-semibold">Risk Verdict Arbitrated</div>
                <div className="text-[11px] text-aegis-textMuted">
                  Verdict issued as <strong>{report.verdict}</strong> across 15 deterministic governance rules
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded bg-aegis-bgSecondary border border-aegis-border">
              <span className="w-2 h-2 rounded-full bg-aegis-aiViolet shrink-0 mt-1.5" />
              <div className="space-y-0.5">
                <div className="text-aegis-textPrimary font-semibold">Rule 14 Remediation Plans Formulated</div>
                <div className="text-[11px] text-aegis-textMuted">
                  Synthesized {report.remediation_patches.length} minimal unified diffs with automated rollback plans
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
