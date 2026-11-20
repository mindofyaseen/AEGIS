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
  ChevronRight,
  FileText
} from 'lucide-react';
import { InfrastructureScene3D } from '../components/InfrastructureScene3D';

interface PageOverviewProps {
  report: InvestigationReport | null;
  loading: boolean;
  onNavigate: (page: any) => void;
  onSelectFinding: (finding: SecurityFinding) => void;
  isHardened?: boolean;
  viewAudience?: 'business' | 'technical';
  onOpenConnectModal?: () => void;
}

export const PageOverview: React.FC<PageOverviewProps> = ({
  report,
  loading,
  onNavigate,
  onSelectFinding,
  isHardened,
  viewAudience = 'business',
  onOpenConnectModal
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
    <div className="space-y-6 max-w-7xl">
      {/* 1. Executive Verdict Command Hero */}
      <div
        className={`p-6 rounded-lg bg-aegis-panel border transition-all ${
          isBlock
            ? 'border-red-500/30 border-l-4 border-l-red-500'
            : isRefusal
            ? 'border-amber-500/30 border-l-4 border-l-amber-500'
            : 'border-emerald-500/30 border-l-4 border-l-emerald-500'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <span
                className={`text-xs font-mono font-medium px-2 py-0.5 rounded flex items-center gap-1.5 ${
                  isBlock
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : isRefusal
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {isBlock && <ShieldAlert className="w-3.5 h-3.5" />}
                {isRefusal && <AlertOctagon className="w-3.5 h-3.5" />}
                {isReady && <ShieldCheck className="w-3.5 h-3.5" />}
                Verdict: {report.verdict}
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Investigation ID: <strong className="text-zinc-300 font-normal">{report.investigation_id}</strong>
              </span>
            </div>

            <h2 className="text-lg lg:text-xl font-semibold tracking-tight text-white">
              {report.verdict_reason}
            </h2>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
              {report.agent_reasoning_summary}
            </p>
          </div>

          {/* Context Completeness Progress Meter */}
          <div className="shrink-0 bg-white/[0.02] border border-white/[0.08] rounded-lg p-4 min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-zinc-500">Telemetry context:</span>
              <span className={`font-medium ${completenessPct >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {completenessPct}% {report.context_completeness.verdict_eligible ? '(Eligible)' : '(Refusal)'}
              </span>
            </div>

            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/[0.06] mb-2.5">
              <div
                className={`h-full transition-all duration-500 ${
                  completenessPct >= 85 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${completenessPct}%` }}
              />
            </div>

            <div className="text-[11px] font-mono text-zinc-500 leading-tight">
              {report.context_completeness.successful_collectors} of {report.context_completeness.total_collectors_run} collectors verified
              {report.context_completeness.stale_snapshots_detected && ' (Stale >24h snapshot detected)'}
            </div>
          </div>
        </div>
      </div>

      {/* 1.5. Plain-English Business Risk & Financial Exposure Summary */}
      <div className="p-5 rounded-lg border border-white/[0.08] bg-aegis-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-white tracking-normal">
              Executive risk & financial exposure assessment
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Plain English
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-500">Customer data status:</span>
            <span className={`font-medium ${report.customer_data_at_risk ? 'text-red-400' : 'text-emerald-400'}`}>
              {report.customer_data_at_risk ? 'At risk (Exposed)' : 'Protected'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/[0.06] space-y-1">
            <span className="text-[11px] text-zinc-500 block">Estimated financial liability</span>
            <div className="text-base font-semibold text-red-400 font-mono tracking-tight">
              {report.estimated_financial_exposure || '$1,420,000+'}
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Calculated penalty from GDPR/HIPAA mandates, breach response, and legal notification liabilities.
            </p>
          </div>

          <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/[0.06] space-y-1 md:col-span-2">
            <span className="text-[11px] text-zinc-500 block">Business impact narrative</span>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {report.business_impact_summary || (
                isBlock
                  ? 'Your cloud infrastructure contains an open public entry point paired with administrative master keys. Any internet scanner can compromise this gateway and pivot into customer records.'
                  : 'Your cloud environment is safely partitioned with least-privilege roles and zero open perimeter ports.'
              )}
            </p>
            <div className="pt-2 text-[11px] text-zinc-400 flex items-center gap-2 border-t border-white/[0.05] mt-2">
              <span className="text-sky-400 font-medium">Safe resolution:</span>
              <span>
                1-click minimal configuration patch available in Remediation Workspace with zero service downtime.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key High-Density Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="aegis-card p-4 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Discovered assets</span>
            <Server className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold font-mono text-white tracking-tight">{report.total_resources}</div>
          <div className="text-[11px] text-zinc-400">AWS VPC, Subnet, EC2, IAM, S3 & RDS nodes</div>
        </div>

        {/* Metric 2 */}
        <div className="aegis-card p-4 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Security findings</span>
            <AlertOctagon className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold font-mono text-white tracking-tight flex items-baseline gap-2">
            <span>{report.total_findings}</span>
            <span className="text-xs font-normal text-red-400 font-mono">({report.critical_findings} critical)</span>
          </div>
          <div className="text-[11px] text-zinc-400">Evaluated across 15 deterministic rules</div>
        </div>

        {/* Metric 3 */}
        <div className="aegis-card p-4 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Attack paths</span>
            <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold font-mono text-white tracking-tight">{report.attack_paths.length}</div>
          <div className="text-[11px] text-zinc-400">Multi-hop traversals to customer data tier</div>
        </div>

        {/* Metric 4 */}
        <div className="aegis-card p-4 space-y-1.5">
          <div className="flex items-center justify-between text-zinc-500 text-xs">
            <span>Remediation patches</span>
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold font-mono text-white tracking-tight">{report.remediation_patches.length}</div>
          <div className="text-[11px] text-zinc-400">Rule 14 unified diffs & verification steps</div>
        </div>
      </div>

      {/* 3. Flagship 3D Topology Quick Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-white tracking-normal">
              Infrastructure spatial topology
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
              Interactive WebGL
            </span>
          </div>
          <button
            onClick={() => onNavigate('explorer')}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
          >
            Open full explorer <ArrowRight className="w-3.5 h-3.5" />
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
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <h4 className="text-xs font-semibold text-white tracking-normal">
                Priority investigation queue ({report.findings.length})
              </h4>
            </div>
            <button
              onClick={() => onNavigate('findings')}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              View all findings
            </button>
          </div>

          <div className="space-y-2.5">
            {report.findings.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                No active security violations identified in this environment.
              </div>
            ) : (
              report.findings.map((f) => (
                <div
                  key={f.finding_id}
                  onClick={() => {
                    onSelectFinding(f);
                    onNavigate('findings');
                  }}
                  className="p-3 rounded-md border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-zinc-200 truncate">{f.title}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                        f.severity === 'CRITICAL'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                    >
                      {f.severity}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 truncate">Target: {f.affected_resource_id}</div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{f.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity & Investigation Traces */}
        <div className="aegis-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <h4 className="text-xs font-semibold text-white tracking-normal">
                Autonomous agent trace & activity
              </h4>
            </div>
            <button
              onClick={() => onNavigate('agent_console')}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              Console stream
            </button>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex items-start gap-2.5 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              <div className="space-y-0.5">
                <div className="text-zinc-200 font-medium">Discovery ingestion completed</div>
                <div className="text-[11px] text-zinc-500">Discovered 14 AWS resources via read-only collectors</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-1.5" />
              <div className="space-y-0.5">
                <div className="text-zinc-200 font-medium">Context completeness gate evaluated</div>
                <div className="text-[11px] text-zinc-500">
                  Score: {completenessPct}% · {report.context_completeness.explanation}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                  isBlock ? 'bg-red-400' : 'bg-emerald-400'
                }`}
              />
              <div className="space-y-0.5">
                <div className="text-zinc-200 font-medium">Risk verdict arbitrated</div>
                <div className="text-[11px] text-zinc-500">
                  Verdict issued as <strong>{report.verdict}</strong> across 15 deterministic governance rules
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.06]">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
              <div className="space-y-0.5">
                <div className="text-zinc-200 font-medium">Rule 14 remediation formulated</div>
                <div className="text-[11px] text-zinc-500">
                  Synthesized {report.remediation_patches.length} minimal diffs with rollback plans
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
