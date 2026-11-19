import React, { useState } from 'react';
import { AttackPath, AttackPathHop, Severity } from '../types';
import {
  GitBranch,
  ShieldAlert,
  ArrowRight,
  Server,
  Lock,
  Database,
  Globe,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Crosshair
} from 'lucide-react';

interface PageAttackPathsProps {
  attackPaths: AttackPath[];
  onNavigateRemediation?: () => void;
  viewAudience?: 'business' | 'technical';
}

export const PageAttackPaths: React.FC<PageAttackPathsProps> = ({
  attackPaths,
  onNavigateRemediation,
  viewAudience = 'business'
}) => {
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);

  const activePath = attackPaths.length > 0 ? attackPaths[selectedPathIndex] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-aegis-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold font-mono tracking-tight text-aegis-textPrimary">
            {viewAudience === 'business' ? 'HACKER BREAK-IN SIMULATION & BUSINESS IMPACT' : 'ATTACK PATH INTELLIGENCE & BLAST RADIUS'}
          </h2>
          <p className="text-xs text-aegis-textSecondary">
            {viewAudience === 'business'
              ? 'Real-world visual simulation demonstrating how an attacker can pivot from the internet to your confidential customer database.'
              : 'Multi-hop lateral movement analysis from perimeter ingress to crown-jewel customer data stores.'}
          </p>
        </div>

        {viewAudience === 'business' && (
          <div className="px-3 py-1.5 rounded-lg bg-red-950/30 border border-aegis-critical/40 text-xs text-red-300 font-sans flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-aegis-critical animate-ping" />
            <span>Estimated Breach Exposure: <strong>$1,420,000+</strong></span>
          </div>
        )}
      </div>

      {attackPaths.length === 0 ? (
        <div className="aegis-card p-12 text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-aegis-success mx-auto" />
          <h3 className="text-base font-bold text-aegis-textPrimary">Zero Attack Paths Evidenced</h3>
          <p className="text-xs text-aegis-textSecondary max-w-md mx-auto">
            The infrastructure topology contains no verified lateral traversal routes from public ingress to protected internal data assets.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Path Selector Tabs */}
          <div className="flex gap-2 border-b border-aegis-border pb-2 font-mono text-xs">
            {attackPaths.map((p, idx) => (
              <button
                key={p.path_id}
                onClick={() => setSelectedPathIndex(idx)}
                className={`px-3 py-1.5 rounded transition-all flex items-center gap-2 ${
                  selectedPathIndex === idx
                    ? 'bg-aegis-critical/20 text-aegis-critical border border-aegis-critical/40 font-bold'
                    : 'text-aegis-textSecondary hover:text-aegis-textPrimary'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Path #{idx + 1}: {p.title}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-aegis-bg uppercase">{p.severity}</span>
              </button>
            ))}
          </div>

          {activePath && (
            <div className="space-y-6">
              {/* Path Overview Banner */}
              <div className="aegis-card p-5 border-l-4 border-l-aegis-critical space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-aegis-critical/20 text-aegis-critical border border-aegis-critical/40">
                      CRITICAL ATTACK PATH
                    </span>
                    <span className="text-xs font-mono text-aegis-textMuted">ID: {activePath.path_id}</span>
                  </div>
                  <div className="text-xs font-mono text-aegis-textMuted">
                    Entry: <strong className="text-aegis-warning">{activePath.entry_point}</strong> ➔ Target: <strong className="text-aegis-critical">{activePath.target_asset}</strong>
                  </div>
                </div>

                <p className="text-xs text-aegis-textSecondary leading-relaxed bg-aegis-bgSecondary p-3 rounded border border-aegis-border">
                  {activePath.narrative}
                </p>
              </div>

              {/* Hop-by-Hop Visual Sequence Timeline */}
              <div className="aegis-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-aegis-border pb-3">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-aegis-textPrimary flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-aegis-accentCyan" />
                    Multi-Hop Lateral Movement Sequence ({activePath.hops.length} Hops)
                  </h3>
                  <span className="text-[11px] font-mono text-aegis-success">
                    ✓ 100% Fully Evidenced in Graph
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                  {activePath.hops.map((hop, hopIdx) => (
                    <div
                      key={hop.hop_index}
                      className="aegis-card-elevated p-4 rounded border border-aegis-borderLight relative space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="w-5 h-5 rounded-full bg-aegis-critical/20 text-aegis-critical border border-aegis-critical/40 flex items-center justify-center font-bold text-[10px]">
                          {hop.hop_index}
                        </span>
                        <span className="text-[10px] text-aegis-textMuted uppercase">{hop.relationship}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[11px] font-mono text-aegis-accentBlue truncate">{hop.source_node}</div>
                        <div className="flex items-center justify-center my-1 text-aegis-critical">
                          <ArrowRight className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="text-[11px] font-mono text-aegis-critical font-bold truncate">{hop.target_node}</div>
                      </div>

                      <p className="text-[11px] text-aegis-textSecondary leading-relaxed pt-2 border-t border-aegis-border">
                        {hop.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blast Radius & Target Asset Vulnerability */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="aegis-card p-5 space-y-3">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-aegis-textPrimary flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-aegis-warning" />
                    Blast Radius Assessment
                  </h4>
                  <p className="text-xs text-aegis-textSecondary leading-relaxed">
                    Because the compromised Bastion Host holds an IAM instance profile mapped to <code>AdministratorAccess</code>, the effective blast radius encompasses:
                  </p>
                  <ul className="text-xs font-mono text-aegis-textSecondary space-y-1.5 list-disc list-inside">
                    <li><strong className="text-aegis-critical">Customer Financial Database:</strong> Full dump & drop privileges</li>
                    <li><strong className="text-aegis-critical">Encrypted S3 Data Lake:</strong> Unauthorized reading and key tampering</li>
                    <li><strong className="text-aegis-warning">VPC Route Tables:</strong> Traffic hijacking and persistence establishment</li>
                  </ul>
                </div>

                <div className="aegis-card p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-aegis-textPrimary flex items-center gap-2">
                      <Lock className="w-4 h-4 text-aegis-success" />
                      Required Perimeter Remediation
                    </h4>
                    <p className="text-xs text-aegis-textSecondary leading-relaxed mt-2">
                      Applying Rule 14 patch immediately severs this lateral movement vector by revoking public ingress port 22 and scoping down the IAM role to least privilege.
                    </p>
                  </div>

                  {onNavigateRemediation && (
                    <button
                      onClick={onNavigateRemediation}
                      className="w-full py-2.5 px-4 rounded bg-aegis-accentBlue hover:bg-blue-400 text-black font-semibold text-xs font-mono flex items-center justify-center gap-2 transition-colors"
                    >
                      Inspect Unified Diff Patch in Remediation Workspace
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
