import React, { useState, useMemo } from 'react';
import { SecurityFinding, Severity } from '../types';
import {
  Search,
  AlertOctagon,
  ShieldAlert,
  Filter,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  ArrowUpDown,
  Tag,
  BookOpen,
  Wrench,
  Info
} from 'lucide-react';

interface PageFindingsProps {
  findings: SecurityFinding[];
  onSelectFinding: (finding: SecurityFinding) => void;
  onNavigateRemediation?: () => void;
  viewAudience?: 'business' | 'technical';
}

export const PageFindings: React.FC<PageFindingsProps> = ({
  findings,
  onSelectFinding,
  onNavigateRemediation,
  viewAudience = 'business'
}) => {
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(
    findings.length > 0 ? findings[0] : null
  );
  const [drawerAudience, setDrawerAudience] = useState<'business' | 'technical'>(viewAudience);

  // Sync drawerAudience when prop changes
  React.useEffect(() => {
    setDrawerAudience(viewAudience);
  }, [viewAudience]);

  // Helper to translate cryptic technical findings into plain English business risk
  const getBusinessExplanation = (finding: SecurityFinding) => {
    if (finding.rule_id.includes('NET') || finding.description.includes('0.0.0.0/0') || finding.description.includes('port 22')) {
      return {
        plainTitle: 'Customer Database / Server Accessible to the Entire Public Internet',
        summary: 'Your internal server has an open front door. Anyone on the internet with a computer can try to connect to it without going through your private company VPN.',
        businessRisk: 'High risk of credential guessing, ransomware deployment, and direct unauthorized data theft.',
        financialRisk: '$1,400,000+ estimated regulatory fines and incident response costs.',
        executiveAction: 'Lock down port 22 immediately to corporate VPN only. Zero downtime for web users.'
      };
    }
    if (finding.rule_id.includes('IAM') || finding.description.includes('AdministratorAccess') || finding.description.includes('Action: *')) {
      return {
        plainTitle: 'Server Has Master Admin Keys with Unrestricted Cloud Control',
        summary: 'This computer was given complete administrator access to your entire AWS account. If an attacker breaches this server, they inherit the master keys to control everything.',
        businessRisk: 'Total cloud account takeover, rogue resource creation, and confidential data exfiltration.',
        financialRisk: '$1,800,000+ disaster recovery and business interruption liability.',
        executiveAction: 'Replace master keys with least-privilege permissions. Web apps continue operating without disruption.'
      };
    }
    if (finding.rule_id.includes('S3') || finding.description.includes('Encryption') || finding.description.includes('SSE-KMS')) {
      return {
        plainTitle: 'Confidential Customer Data Stored Unencrypted (Plaintext)',
        summary: 'Your cloud data storage bucket is saving files without military-grade encryption. It is like mailing sensitive customer records on an unsealed postcard.',
        businessRisk: 'Violates HIPAA, GDPR, and PCI-DSS compliance mandates. Severe audit failure.',
        financialRisk: '$950,000+ statutory regulatory penalties for storing unencrypted customer records.',
        executiveAction: 'Enable AWS KMS server-side encryption with 1 click. Completely transparent to existing apps.'
      };
    }
    return {
      plainTitle: finding.title,
      summary: finding.description,
      businessRisk: 'Violates organizational security and compliance baselines.',
      financialRisk: '$500,000+ operational and security remediation costs.',
      executiveAction: finding.remediation_recommendation
    };
  };

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSearch =
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.rule_id.toLowerCase().includes(search.toLowerCase()) ||
        f.affected_resource_id.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) return false;
      return true;
    });
  }, [findings, search, selectedSeverity]);

  // Regulatory mapping lookup based on Rule ID
  const getComplianceTags = (ruleId: string) => {
    switch (ruleId) {
      case 'SEC-RULE-01':
      case 'SEC-TF-01':
      case 'SEC-CFN-01':
        return ['CIS AWS 4.1', 'SOC 2 CC6.6', 'PCI-DSS 1.3.1', 'NIST SC-7'];
      case 'SEC-RULE-02':
      case 'SEC-CFN-03':
        return ['CIS AWS 1.16', 'SOC 2 CC6.1', 'PCI-DSS 7.2.1', 'NIST AC-6'];
      case 'SEC-RULE-03':
      case 'SEC-TF-02':
      case 'SEC-CFN-02':
        return ['CIS AWS 2.1.5', 'SOC 2 CC6.1', 'PCI-DSS 1.2.1', 'NIST AC-3'];
      case 'SEC-THREAT-01':
        return ['CIS AWS 3.1', 'SOC 2 CC7.2', 'PCI-DSS 10.2.1', 'NIST SI-4'];
      default:
        return ['CIS AWS v3.0', 'SOC 2 Type II'];
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
        <div>
          <h2 className="text-base font-semibold tracking-normal text-white">
            Security findings
          </h2>
          <p className="text-xs text-zinc-400">
            Deterministic rule violations, perimeter ingress risks, and regulatory compliance mapping.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-1.5 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search rule, resource, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 outline-none w-56 placeholder:text-zinc-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-md p-0.5 text-xs">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded transition-colors text-[11px] font-mono ${
                  selectedSeverity === sev
                    ? 'bg-white/10 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Split Layout: Findings List Table (Left) + Detail Inspector (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Findings Table (2 cols on XL) */}
        <div className="xl:col-span-2 aegis-card overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02] text-xs font-mono text-zinc-400 flex items-center justify-between">
            <span>Showing {filteredFindings.length} of {findings.length} findings</span>
            <span>Sort: Severity</span>
          </div>

          <div className="divide-y divide-white/[0.06] overflow-y-auto max-h-[640px]">
            {filteredFindings.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-zinc-500">
                No matching findings found for current filter criteria.
              </div>
            ) : (
              filteredFindings.map((f) => {
                const isSelected = selectedFinding?.finding_id === f.finding_id;
                return (
                  <div
                    key={f.finding_id}
                    onClick={() => {
                      setSelectedFinding(f);
                      onSelectFinding(f);
                    }}
                    className={`p-4 cursor-pointer transition-colors flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'bg-white/[0.05] border-l-2 border-sky-400'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-medium ${
                            f.severity === 'CRITICAL'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="text-[11px] font-mono text-sky-400">{f.rule_id}</span>
                        <span className="text-xs text-zinc-400 truncate">· {f.affected_resource_id}</span>
                      </div>
                      <h4 className="text-xs font-medium text-zinc-100 truncate">{f.title}</h4>
                      <p className="text-xs text-zinc-400 line-clamp-1">{f.description}</p>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-sky-400 translate-x-0.5' : 'text-zinc-600'}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Comprehensive Finding Detail Drawer */}
        <div className="aegis-card p-5 space-y-4 flex flex-col justify-between h-[640px] overflow-y-auto">
          {selectedFinding ? (
            <div className="space-y-4">
              {/* Header with Mode Toggle */}
              <div className="space-y-2.5 border-b border-white/[0.07] pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-sky-400 font-medium">
                    {selectedFinding.finding_id}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Inline Mode Switch */}
                    <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded p-0.5 text-[10px] font-mono">
                      <button
                        onClick={() => setDrawerAudience('business')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          drawerAudience === 'business'
                            ? 'bg-white/10 text-white font-medium'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Business view
                      </button>
                      <button
                        onClick={() => setDrawerAudience('technical')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          drawerAudience === 'technical'
                            ? 'bg-white/10 text-white font-medium'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Technical spec
                      </button>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                        selectedFinding.severity === 'CRITICAL'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {selectedFinding.severity}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white leading-snug">
                  {drawerAudience === 'business'
                    ? getBusinessExplanation(selectedFinding).plainTitle
                    : selectedFinding.title}
                </h3>
                <div className="text-xs font-mono text-zinc-400">
                  Target resource: <strong className="text-zinc-200 font-normal">{selectedFinding.affected_resource_id}</strong>
                </div>
              </div>

              {drawerAudience === 'business' ? (
                /* Business / Executive Plain English View */
                <div className="space-y-3">
                  {/* Financial Risk Exposure Banner */}
                  <div className="p-3.5 rounded-md bg-white/[0.02] border border-red-500/20 space-y-1">
                    <span className="text-[10px] font-mono text-red-400 block font-medium">
                      Estimated financial & legal exposure
                    </span>
                    <div className="text-xs font-semibold text-red-300 font-mono">
                      {getBusinessExplanation(selectedFinding).financialRisk}
                    </div>
                  </div>

                  {/* What this means in plain English */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-500 block">
                      Plain English explanation
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.02] p-3 rounded border border-white/[0.06]">
                      {getBusinessExplanation(selectedFinding).summary}
                    </p>
                  </div>

                  {/* Business & Customer Danger */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-500 block">
                      Business risk context
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.02] p-3 rounded border border-white/[0.06]">
                      {getBusinessExplanation(selectedFinding).businessRisk}
                    </p>
                  </div>

                  {/* Safe Resolution */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-500 block">
                      Recommended safe action
                    </span>
                    <div className="p-3 rounded bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed">
                      {getBusinessExplanation(selectedFinding).executiveAction}
                    </div>
                  </div>
                </div>
              ) : (
                /* Technical SecOps View */
                <div className="space-y-3.5">
                  {/* Regulatory Mapping Tags */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-zinc-500 block">Compliance controls</span>
                    <div className="flex flex-wrap gap-1.5">
                      {getComplianceTags(selectedFinding.rule_id).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Description & Root Cause */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-500 block">Technical root cause</span>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.02] p-3 rounded border border-white/[0.06] font-mono">
                      {selectedFinding.description}
                    </p>
                  </div>

                  {/* Remediation Recommendation */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-500 block">Remediation guidance</span>
                    <div className="p-3 rounded bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed">
                      {selectedFinding.remediation_recommendation}
                    </div>
                  </div>

                  {/* Evidence Nodes */}
                  <div className="space-y-1 font-mono text-xs">
                    <span className="text-[11px] text-zinc-500 block">Graph evidence</span>
                    <div className="text-zinc-400 text-[11px]">
                      {selectedFinding.evidence_nodes.join(', ') || selectedFinding.affected_resource_id}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-zinc-500 text-xs my-auto">Select a finding to inspect details.</div>
          )}

          {/* Action Footer */}
          {selectedFinding && onNavigateRemediation && (
            <button
              onClick={onNavigateRemediation}
              className="w-full py-2 px-3 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] mt-auto"
            >
              <Wrench className="w-3.5 h-3.5" />
              Open in Remediation Workspace
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
