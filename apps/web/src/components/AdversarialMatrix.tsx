import React from 'react';
import { AdversarialTest } from '../types';
import { ShieldCheck, CheckCircle2, Lock, Zap } from 'lucide-react';

interface AdversarialMatrixProps {
  tests: AdversarialTest[];
  totalTests: number;
  passedTests: number;
}

export const AdversarialMatrix: React.FC<AdversarialMatrixProps> = ({
  tests,
  totalTests,
  passedTests,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
      {/* Header with 100% Passing Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Adversarial Attack Simulation & Neutralization Suite
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              100% DEFENDED ({passedTests}/{totalTests} PASS)
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Rigorous automated red-team test battery executing prompt injection, comment injection, boundary breaches, and refusal enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/60 px-3.5 py-1.5 rounded-xl text-emerald-400 font-mono text-xs font-bold">
          <Zap className="w-4 h-4" />
          <span>Deterministic Interception Active</span>
        </div>
      </div>

      {/* Grid of 14 Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tests.map((test) => (
          <div
            key={test.id}
            className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {test.id}
                </span>
                <span className="text-xs font-bold text-white">{test.name}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                <Lock className="w-3 h-3 text-slate-500" />
                <span className="text-slate-500">Defensive Barrier:</span>
                <span className="text-slate-300 font-mono">{test.defense}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold font-mono shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              <span>{test.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
