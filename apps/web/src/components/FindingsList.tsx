import React from 'react';
import { SecurityFinding, Severity } from '../types';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';

interface FindingsListProps {
  findings: SecurityFinding[];
  onSelectFinding: (finding: SecurityFinding) => void;
  selectedFindingId?: string;
}

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  onSelectFinding,
  selectedFindingId,
}) => {
  if (findings.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center py-12 space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Zero Security Violations Detected</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          The investigated architecture conforms to all deterministic perimeter security policies and least-privilege standards.
        </p>
      </div>
    );
  }

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-400 border-red-800/80';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-400 border-amber-800/80';
      case 'MEDIUM':
        return 'bg-yellow-950/80 text-yellow-400 border-yellow-800/80';
      default:
        return 'bg-blue-950/80 text-blue-400 border-blue-800/80';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">
            Deterministic Security Findings ({findings.length})
          </h2>
          <p className="text-xs text-slate-400">
            Rule violations backed by immutable graph node evidence.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {findings.map((f) => {
          const isSelected = selectedFindingId === f.finding_id;
          return (
            <div
              key={f.finding_id}
              onClick={() => onSelectFinding(f)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getSeverityBadge(f.severity)}`}>
                      {f.severity}
                    </span>
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {f.rule_id}
                    </span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="font-mono text-xs text-slate-300">
                      Target: {f.affected_resource_id}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white pt-1">{f.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{f.description}</p>
                </div>

                <button className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 hover:bg-cyan-900/60 transition-colors text-xs font-semibold flex items-center gap-1 shrink-0">
                  <span>Remediate</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Evidence nodes citation */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Evidence Nodes:</span>
                  {f.evidence_nodes.map((node, i) => (
                    <span key={i} className="font-mono text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {node}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-mono">
                  <span>Confidence:</span>
                  <span>{(f.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
