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
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-aegis-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold font-mono tracking-tight text-aegis-textPrimary">
            {viewAudience === 'business' ? '1-CLICK SAFETY FIXES & PULL REQUESTS' : 'REMEDIATION PLANNING & AUTOMATED GIT PR WORKSPACE'}
          </h2>
          <p className="text-xs text-aegis-textSecondary">
            {viewAudience === 'business'
              ? 'Safe, tested 1-click code fixes that lock down your cloud with zero downtime to your customers.'
              : 'Rule 14 deterministic minimal diffs, tested rollback plans, human verification checklists, and GitHub PR synthesis.'}
          </p>
        </div>

        {viewAudience === 'business' && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-600/40 text-xs text-emerald-300 font-sans flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-aegis-success" />
            <span>Zero Customer Downtime Guarantee</span>
          </div>
        )}
      </div>

      {patches.length === 0 ? (
        <div className="aegis-card p-12 text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-aegis-success mx-auto" />
          <h3 className="text-base font-bold text-aegis-textPrimary">No Active Remediation Plans Required</h3>
          <p className="text-xs text-aegis-textSecondary max-w-md mx-auto">
            All evaluated infrastructure assets comply with automated security boundaries. Zero drift or perimeter exposures identified.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Patch Selector Tabs */}
          <div className="flex gap-2 border-b border-aegis-border pb-2 font-mono text-xs overflow-x-auto">
            {patches.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedIndex(idx);
                  setGeneratedPr(null);
                }}
                className={`px-3 py-1.5 rounded transition-all flex items-center gap-2 whitespace-nowrap ${
                  selectedIndex === idx
                    ? 'bg-aegis-accentBlue text-black font-semibold'
                    : 'text-aegis-textSecondary hover:text-aegis-textPrimary'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
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
                  <div className="p-3 border-b border-aegis-border bg-aegis-bgSecondary flex items-center justify-between text-xs font-mono">
                    <span className="text-aegis-textPrimary font-semibold flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-aegis-accentCyan" />
                      Rule 14 Minimal Diff (.patch)
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activePatch.terraform_patch || '');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-[11px] text-aegis-textMuted hover:text-aegis-textPrimary flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copied ? 'Copied' : 'Copy Patch'}
                    </button>
                  </div>

                  <pre className="p-4 bg-aegis-bg text-xs font-mono overflow-x-auto text-emerald-400 leading-relaxed selection:bg-emerald-500 selection:text-black">
                    {activePatch.terraform_patch || '# No direct Terraform diff generated for this resource type.'}
                  </pre>
                </div>

                {/* AWS CLI Dry-Run Command */}
                {activePatch.cli_command_preview && (
                  <div className="aegis-card overflow-hidden">
                    <div className="p-3 border-b border-aegis-border bg-aegis-bgSecondary flex items-center gap-1.5 text-xs font-mono text-aegis-textPrimary">
                      <Terminal className="w-4 h-4 text-aegis-warning" />
                      AWS CLI Manual Repair Command Preview
                    </div>
                    <pre className="p-4 bg-aegis-bg text-xs font-mono text-aegis-warning overflow-x-auto leading-relaxed">
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
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-aegis-textPrimary flex items-center gap-2 mb-1.5">
                      <RotateCcw className="w-4 h-4 text-aegis-warning" />
                      Safe Rollback Procedure (Zero Mutation Boundary)
                    </h4>
                    <p className="text-xs text-aegis-textSecondary leading-relaxed bg-aegis-bgSecondary p-3 rounded border border-aegis-border font-mono">
                      {activePatch.rollback_plan}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-aegis-textPrimary flex items-center gap-2 mb-2">
                      <CheckSquare className="w-4 h-4 text-aegis-success" />
                      Human Verification Checklist
                    </h4>
                    <div className="space-y-1.5 font-mono text-xs text-aegis-textSecondary">
                      {activePatch.verification_steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2 bg-aegis-bgSecondary p-2 rounded border border-aegis-border">
                          <span className="text-aegis-success">✓</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Synthesize PR Action */}
                  <div className="pt-2 border-t border-aegis-border">
                    <button
                      onClick={handleGeneratePr}
                      disabled={generatingPr}
                      className="w-full py-2.5 px-4 rounded bg-aegis-accentCyan hover:bg-cyan-300 text-black font-semibold text-xs font-mono flex items-center justify-center gap-2 transition-all shadow-glow-cyan disabled:opacity-50"
                    >
                      <GitPullRequest className={`w-4 h-4 ${generatingPr ? 'animate-spin' : ''}`} />
                      {generatingPr ? 'Synthesizing Pull Request...' : 'Synthesize Ready-to-Merge GitHub PR'}
                    </button>
                  </div>
                </div>

                {/* Synthesized GitHub PR Flyout */}
                {generatedPr && (
                  <div className="aegis-card p-5 space-y-3 border-l-4 border-l-aegis-accentCyan bg-cyan-950/10">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-aegis-accentCyan font-bold">SYNTHESIZED PR ARTIFACT</span>
                      <span className="text-aegis-textMuted">{generatedPr.pr_id}</span>
                    </div>

                    <div className="space-y-1 font-mono text-xs">
                      <div>
                        <span className="text-aegis-textMuted text-[10px] block">BRANCH:</span>
                        <span className="text-aegis-textPrimary bg-aegis-bg p-1 rounded border border-aegis-border block">{generatedPr.remediation_branch}</span>
                      </div>
                      <div>
                        <span className="text-aegis-textMuted text-[10px] block">COMMIT MESSAGE:</span>
                        <span className="text-emerald-400 block">{generatedPr.commit_message}</span>
                      </div>
                      <div>
                        <span className="text-aegis-textMuted text-[10px] block">PATCH FILE:</span>
                        <span className="text-aegis-accentBlue block">{generatedPr.patch_filename}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-aegis-textSecondary leading-relaxed pt-2 border-t border-aegis-border">
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
