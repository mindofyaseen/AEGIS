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
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="border-b border-white/[0.07] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-normal text-white">
            {viewAudience === 'business' ? 'Hacker break-in simulation' : 'Attack path intelligence'}
          </h2>
          <p className="text-xs text-zinc-400">
            {viewAudience === 'business'
              ? 'Real-world visual simulation demonstrating how an attacker can pivot from the internet to your confidential customer database.'
              : 'Multi-hop lateral movement analysis from perimeter ingress to crown-jewel customer data stores.'}
          </p>
        </div>

        {viewAudience === 'business' && (
          <div className="px-3 py-1 rounded-md bg-white/[0.02] border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>Estimated breach exposure: <strong>$1,420,000+</strong></span>
          </div>
        )}
      </div>

      {attackPaths.length === 0 ? (
        <div className="aegis-card p-12 text-center space-y-3">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-semibold text-white">Zero attack paths evidenced</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            The infrastructure topology contains no verified lateral traversal routes from public ingress to protected internal data assets.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Path Selector Tabs */}
          <div className="flex gap-2 border-b border-white/[0.07] pb-2 font-mono text-xs">
            {attackPaths.map((p, idx) => (
              <button
                key={p.path_id}
                onClick={() => setSelectedPathIndex(idx)}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                  selectedPathIndex === idx
                    ? 'bg-white/10 text-white font-medium border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5 text-zinc-400" />
                <span>Path #{idx + 1}: {p.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-red-400 border border-white/[0.06]">
                  {p.severity}
                </span>
              </button>
            ))}
          </div>

          {activePath && (
            <div className="space-y-6">
              {/* Path Overview Banner */}
              <div className="aegis-card p-5 border-l-4 border-l-red-500 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                      Critical attack path
                    </span>
                    <span className="text-xs font-mono text-zinc-500">ID: {activePath.path_id}</span>
                  </div>
                  <div className="text-xs font-mono text-zinc-400">
                    Entry: <strong className="text-zinc-200 font-normal">{activePath.entry_point}</strong> ➔ Target: <strong className="text-red-400 font-normal">{activePath.target_asset}</strong>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.02] p-3 rounded-md border border-white/[0.06]">
                  {activePath.narrative}
                </p>
              </div>

              {/* Hop-by-Hop Visual Sequence Timeline */}
              <div className="aegis-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                  <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-sky-400" />
                    Multi-hop lateral movement sequence ({activePath.hops.length} hops)
                  </h3>
                  <span className="text-xs font-mono text-emerald-400">
                    Verified in graph
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                  {activePath.hops.map((hop, hopIdx) => (
                    <div
                      key={hop.hop_index}
                      className="p-3.5 rounded-md bg-white/[0.02] border border-white/[0.07] relative space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="w-5 h-5 rounded-full bg-white/[0.06] text-zinc-200 border border-white/[0.08] flex items-center justify-center font-medium text-[10px]">
                          {hop.hop_index}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">{hop.relationship}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[11px] font-mono text-zinc-300 truncate">{hop.source_node}</div>
                        <div className="flex items-center justify-center my-1 text-zinc-500">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-[11px] font-mono text-red-400 font-medium truncate">{hop.target_node}</div>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed pt-2 border-t border-white/[0.05]">
                        {hop.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blast Radius & Target Asset Vulnerability */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="aegis-card p-5 space-y-3">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    Blast radius assessment
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Because the compromised Bastion Host holds an IAM instance profile mapped to <code>AdministratorAccess</code>, the effective blast radius encompasses:
                  </p>
                  <ul className="text-xs font-mono text-zinc-400 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-zinc-200 font-normal">Customer Financial Database:</strong> Full dump & drop privileges</li>
                    <li><strong className="text-zinc-200 font-normal">Encrypted S3 Data Lake:</strong> Unauthorized reading and key tampering</li>
                    <li><strong className="text-zinc-200 font-normal">VPC Route Tables:</strong> Traffic hijacking and persistence establishment</li>
                  </ul>
                </div>

                <div className="aegis-card p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      Required perimeter remediation
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                      Applying Rule 14 patch immediately severs this lateral movement vector by revoking public ingress port 22 and scoping down the IAM role to least privilege.
                    </p>
                  </div>

                  {onNavigateRemediation && (
                    <button
                      onClick={onNavigateRemediation}
                      className="w-full py-2 px-3 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
                    >
                      Inspect unified diff patch in Remediation Workspace
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
