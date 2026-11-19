import React, { useState } from 'react';
import { RemediationPatch } from '../types';
import { Wrench, Copy, Check, RotateCcw, CheckSquare, Square, Terminal, Code2 } from 'lucide-react';

interface RemediationDrawerProps {
  patches: RemediationPatch[];
  activePatchIndex: number;
  setActivePatchIndex: (index: number) => void;
}

export const RemediationDrawer: React.FC<RemediationDrawerProps> = ({
  patches,
  activePatchIndex,
  setActivePatchIndex,
}) => {
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedTf, setCopiedTf] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<{ [key: string]: boolean }>({});

  if (patches.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span>Remediation Planner (Rule 14)</span>
        </div>
        <p className="text-xs text-slate-400">
          No active remediation patches required. Architecture passes all security gates.
        </p>
      </div>
    );
  }

  const patch = patches[activePatchIndex] || patches[0];

  const handleCopyCli = () => {
    if (patch.cli_command_preview) {
      navigator.clipboard.writeText(patch.cli_command_preview);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    }
  };

  const handleCopyTf = () => {
    if (patch.terraform_patch) {
      navigator.clipboard.writeText(patch.terraform_patch);
      setCopiedTf(true);
      setTimeout(() => setCopiedTf(false), 2000);
    }
  };

  const toggleStep = (stepIdx: number) => {
    const key = `${activePatchIndex}-${stepIdx}`;
    setCheckedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Rule 14 Compliant Remediation Planner
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              ZERO-MUTATION PREVIEW
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Synthesized minimal diffs, rollback plans, and verification test checklists.
          </p>
        </div>

        {/* Patch selector tabs */}
        {patches.length > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {patches.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setActivePatchIndex(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  activePatchIndex === idx
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.target_resource_id.slice(0, 14)}...
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Target Resource & Action */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Target Resource:</span>
          <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {patch.target_resource_id}
          </span>
        </div>
        <p className="text-xs text-slate-200 font-semibold leading-relaxed">
          {patch.suggested_action}
        </p>
      </div>

      {/* Terraform Minimal Diff */}
      {patch.terraform_patch && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
              <Code2 className="w-4 h-4 text-cyan-400" />
              Proposed Terraform Diff (HCL)
            </span>
            <button
              onClick={handleCopyTf}
              className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 font-mono transition-colors"
            >
              {copiedTf ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTf ? 'Copied' : 'Copy HCL'}</span>
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-[#05070c] border border-slate-800/80 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
            {patch.terraform_patch}
          </pre>
        </div>
      )}

      {/* AWS CLI Command Preview */}
      {patch.cli_command_preview && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
              <Terminal className="w-4 h-4 text-amber-400" />
              Direct AWS CLI Repair Command
            </span>
            <button
              onClick={handleCopyCli}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 font-mono transition-colors"
            >
              {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCli ? 'Copied' : 'Copy CLI'}</span>
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-[#05070c] border border-slate-800/80 text-xs font-mono text-amber-300/90 overflow-x-auto leading-relaxed">
            {patch.cli_command_preview}
          </pre>
        </div>
      )}

      {/* Concrete Rollback Plan */}
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wide">
          <RotateCcw className="w-4 h-4 text-indigo-400" />
          <span>Deterministic Rollback Plan</span>
        </div>
        <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
          {patch.rollback_plan}
        </p>
      </div>

      {/* Verification Checklist */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          Pre/Post Verification Test Checklist
        </span>
        <div className="space-y-1.5">
          {patch.verification_steps.map((step, idx) => {
            const isChecked = !!checkedSteps[`${activePatchIndex}-${idx}`];
            return (
              <div
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="pt-0.5">
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <span className={`leading-relaxed ${isChecked ? 'line-through text-emerald-400/80' : ''}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
