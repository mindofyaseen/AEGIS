import React from 'react';
import { Verdict, InvestigationReport } from '../types';
import { ShieldAlert, ShieldCheck, HelpCircle, Layers } from 'lucide-react';

interface VerdictHeroProps {
  report: InvestigationReport | null;
  loading: boolean;
  selectedScenario: string;
  onSelectScenario: (id: string) => void;
  scenarios: { id: string; name: string; expected_verdict: Verdict }[];
}

export const VerdictHero: React.FC<VerdictHeroProps> = ({
  report,
  loading,
  selectedScenario,
  onSelectScenario,
  scenarios,
}) => {
  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-slate-800 animate-pulse flex flex-col items-center justify-center min-h-[220px]">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-200">Evaluating Knowledge Graph & Deterministic Policies...</h3>
        <p className="text-sm text-slate-400 mt-1">Checking Context Completeness Gate and Attack Paths (Zero-Mutation Engine)</p>
      </div>
    );
  }

  if (!report) return null;

  const verdict = report.verdict;

  const badgeConfig = {
    BLOCK: {
      color: 'bg-red-950/60 text-red-400 border-red-700/60',
      heroBorder: 'border-red-600/50 shadow-red-900/20',
      icon: ShieldAlert,
      title: 'BLOCK — MERGE & DEPLOYMENT PREVENTED',
      subtitle: 'Critical security violations or lateral attack paths detected.',
    },
    INSUFFICIENT_CONTEXT: {
      color: 'bg-amber-950/60 text-amber-400 border-amber-700/60',
      heroBorder: 'border-amber-600/50 shadow-amber-900/20',
      icon: HelpCircle,
      title: 'INSUFFICIENT CONTEXT — EVALUATION REFUSED',
      subtitle: 'Missing, stale, or contradictory evidence prevents safety determination.',
    },
    READY_FOR_HUMAN_REVIEW: {
      color: 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60',
      heroBorder: 'border-emerald-600/50 shadow-emerald-900/20',
      icon: ShieldCheck,
      title: 'READY FOR HUMAN REVIEW',
      subtitle: 'All collectors succeeded and zero critical perimeter violations exist.',
    },
  }[verdict];

  const Icon = badgeConfig.icon;
  const completeness = report.context_completeness;
  const scorePercent = Math.round(completeness.completeness_score * 100);

  return (
    <div className="space-y-4">
      {/* Scenario Benchmark Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 px-2 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Evaluation Scenario:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedScenario === sc.id
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
              }`}
            >
              <span>{sc.name}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  sc.expected_verdict === 'BLOCK'
                    ? 'bg-red-950 text-red-300'
                    : sc.expected_verdict === 'INSUFFICIENT_CONTEXT'
                    ? 'bg-amber-950 text-amber-300'
                    : 'bg-emerald-950 text-emerald-300'
                }`}
              >
                {sc.expected_verdict}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Verdict Card */}
      <div
        className={`glass-panel rounded-2xl p-6 border-2 transition-all shadow-xl ${badgeConfig.heroBorder}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Left: Verdict Banner */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border ${badgeConfig.color}`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  Policy Arbitration Verdict
                </span>
                <h1 className="text-2xl font-black text-white tracking-wide">{badgeConfig.title}</h1>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-medium bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              {report.verdict_reason}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Investigated Assets</span>
                <span className="text-lg font-bold text-white font-mono">{report.total_resources}</span>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Security Findings</span>
                <span
                  className={`text-lg font-bold font-mono ${
                    report.total_findings > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {report.total_findings} ({report.critical_findings} Critical)
                </span>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Evidenced Attack Paths</span>
                <span
                  className={`text-lg font-bold font-mono ${
                    report.attack_paths.length > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {report.attack_paths.length}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Context Completeness Gate Meter */}
          <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Context Completeness Gate
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                  completeness.verdict_eligible
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {completeness.verdict_eligible ? 'ELIGIBLE' : 'GATE FAILED'}
              </span>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-slate-400">Telemetry Completeness</span>
                <span className="text-xl font-bold font-mono text-cyan-400">{scorePercent}%</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    scorePercent >= 85
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : 'bg-gradient-to-r from-amber-600 to-red-500'
                  }`}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span>Successful Collectors:</span>
                <span className="font-mono text-slate-200">
                  {completeness.successful_collectors} / {completeness.total_collectors_run}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Stale Snapshots (&gt;24h):</span>
                <span className="font-mono text-slate-200">
                  {completeness.stale_snapshots_detected ? 'DETECTED' : 'NONE'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Unresolved Dependencies:</span>
                <span className="font-mono text-slate-200">
                  {completeness.unresolved_dependencies.length}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 leading-relaxed">
              {completeness.explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
