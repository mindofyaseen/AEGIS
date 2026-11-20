import React, { useState } from 'react';
import { RemediationPatch, RemediationPullRequest } from '../types';
import { generateRemediationPullRequest } from '../api';
import {
  Wrench,
  GitPullRequest,
  CheckSquare,
  RotateCcw,
  Code,
  Copy,
  Terminal,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileCode
} from 'lucide-react';

interface PageRemediationProps {
  patches: RemediationPatch[];
  viewAudience?: 'business' | 'technical';
}

export const PageRemediation: React.FC<PageRemediationProps> = ({
  patches,
  viewAudience = 'business'
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [generatingPr, setGeneratingPr] = useState(false);
  const [generatedPr, setGeneratedPr] = useState<RemediationPullRequest | null>(null);
  const [copied, setCopied] = useState(false);

  const activePatch = patches.length > 0 ? patches[selectedIndex] : null;

  const handleGeneratePr = async () => {
    if (!activePatch) return;
    setGeneratingPr(true);
    try {
      const res = await generateRemediationPullRequest(activePatch);
      setGeneratedPr(res);
    } catch (err) {
      console.error('Failed to synthesize PR:', err);
    } finally {
      setGeneratingPr(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="border-b border-white/[0.07] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-normal text-white">
            {viewAudience === 'business' ? '1-Click safety fixes' : 'Remediation workspace'}
          </h2>
          <p className="text-xs text-zinc-400">
            {viewAudience === 'business'
              ? 'Safe, tested 1-click code fixes that lock down your cloud with zero downtime to your customers.'
              : 'Rule 14 deterministic minimal diffs, tested rollback plans, human verification checklists, and GitHub PR synthesis.'}
          </p>
        </div>

        {viewAudience === 'business' && (
          <div className="px-3 py-1 rounded-md bg-white/[0.02] border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero customer downtime guarantee</span>
          </div>
        )}
      </div>

      {patches.length === 0 ? (
        <div className="aegis-card p-12 text-center space-y-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No active remediation plans required</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            All evaluated infrastructure assets comply with automated security boundaries. Zero drift or perimeter exposures identified.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Patch Selector Tabs */}
          <div className="flex gap-2 border-b border-white/[0.07] pb-2 font-mono text-xs overflow-x-auto">
            {patches.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedIndex(idx);
                  setGeneratedPr(null);
                }}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${
                  selectedIndex === idx
                    ? 'bg-white/10 text-white font-medium border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 text-zinc-400" />
                <span>{p.target_resource_id}</span>
              </button>
            ))}
          </div>

          {activePatch && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Column: Terraform Patch & CLI Preview */}
              <div className="space-y-4">
                {/* Unified Diff Viewer */}
                <div className="aegis-card overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02] flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-sky-400" />
                      Rule 14 minimal diff (.patch)
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activePatch.terraform_patch || '');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      {copied ? 'Copied' : 'Copy patch'}
                    </button>
                  </div>

                  <pre className="p-4 bg-black/40 text-xs font-mono overflow-x-auto text-emerald-400 leading-relaxed">
                    {activePatch.terraform_patch || '# No direct Terraform diff generated for this resource type.'}
                  </pre>
                </div>

                {/* AWS CLI Dry-Run Command */}
                {activePatch.cli_command_preview && (
                  <div className="aegis-card overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02] flex items-center gap-1.5 text-xs font-mono text-zinc-200">
                      <Terminal className="w-4 h-4 text-amber-400" />
                      AWS CLI manual repair command preview
                    </div>
                    <pre className="p-4 bg-black/40 text-xs font-mono text-amber-300 overflow-x-auto leading-relaxed">
                      {activePatch.cli_command_preview}
                    </pre>
                  </div>
                )}
              </div>

              {/* Right Column: Rollback, Verification & Synthesize Git PR */}
              <div className="space-y-4">
                {/* Rollback Plan & Human Checklist */}
                <div className="aegis-card p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-white flex items-center gap-2 mb-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      Safe rollback procedure (Zero mutation boundary)
                    </h4>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.02] p-3 rounded-md border border-white/[0.06] font-mono">
                      {activePatch.rollback_plan}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-white flex items-center gap-2 mb-2">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      Human verification checklist
                    </h4>
                    <div className="space-y-1.5 font-mono text-xs text-zinc-300">
                      {activePatch.verification_steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2 bg-white/[0.02] p-2 rounded-md border border-white/[0.06]">
                          <span className="text-emerald-400">✓</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Synthesize PR Action */}
                  <div className="pt-2 border-t border-white/[0.07]">
                    <button
                      onClick={handleGeneratePr}
                      disabled={generatingPr}
                      className="w-full py-2 px-3 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                    >
                      <GitPullRequest className={`w-3.5 h-3.5 ${generatingPr ? 'animate-spin' : ''}`} />
                      {generatingPr ? 'Synthesizing Pull Request...' : 'Synthesize Ready-to-Merge GitHub PR'}
                    </button>
                  </div>
                </div>

                {/* Synthesized GitHub PR Flyout */}
                {generatedPr && (
                  <div className="aegis-card p-5 space-y-3 border-l-4 border-l-sky-500 bg-white/[0.02]">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-sky-400 font-medium">Synthesized PR artifact</span>
                      <span className="text-zinc-500">{generatedPr.pr_id}</span>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                      <div>
                        <span className="text-zinc-500 text-[10px] block">Branch:</span>
                        <span className="text-zinc-200 bg-black/40 p-1.5 rounded border border-white/[0.06] block">{generatedPr.remediation_branch}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block">Commit message:</span>
                        <span className="text-emerald-400 block">{generatedPr.commit_message}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block">Patch file:</span>
                        <span className="text-sky-400 block">{generatedPr.patch_filename}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-400 leading-relaxed pt-2 border-t border-white/[0.05]">
                      PR Markdown body generated with collapsible sections, verification steps, and one-click apply instructions for review by human engineering leads.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
