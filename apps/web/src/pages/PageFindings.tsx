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
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-aegis-border pb-4">
        <div>
          <h2 className="text-lg font-bold font-mono tracking-tight text-aegis-textPrimary">
            SECURITY FINDINGS WORKSPACE
          </h2>
          <p className="text-xs text-aegis-textSecondary">
            Deterministic security violations, multi-hop perimeter exposures, and regulatory compliance mapping.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-aegis-bgSecondary border border-aegis-border rounded px-3 py-1.5 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-aegis-textMuted" />
            <input
              type="text"
              placeholder="Search rule, resource, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-aegis-textPrimary outline-none w-52 placeholder:text-aegis-textMuted font-mono"
            />
          </div>

          <div className="flex items-center gap-1 bg-aegis-bgSecondary border border-aegis-border rounded p-1 font-mono text-xs">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded transition-colors text-[11px] ${
                  selectedSeverity === sev
                    ? 'bg-aegis-accentBlue text-black font-semibold'
                    : 'text-aegis-textMuted hover:text-aegis-textPrimary'
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
          <div className="p-3 border-b border-aegis-border bg-aegis-bgSecondary text-xs font-mono text-aegis-textMuted flex items-center justify-between">
            <span>SHOWING {filteredFindings.length} OF {findings.length} DETECTED FINDINGS</span>
            <span>SORT: SEVERITY DESC</span>
          </div>

          <div className="divide-y divide-aegis-border overflow-y-auto max-h-[640px]">
            {filteredFindings.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-aegis-textMuted">
                ✓ No matching findings found for current filter criteria.
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
                    className={`p-4 cursor-pointer transition-all flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'bg-aegis-panelElevated border-l-4 border-l-aegis-accentCyan'
                        : 'hover:bg-aegis-bgSecondary/60'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${
                            f.severity === 'CRITICAL'
                              ? 'bg-aegis-critical/20 text-aegis-critical border-aegis-critical/30'
                              : 'bg-aegis-warning/20 text-aegis-warning border-aegis-warning/30'
                          }`}
                        >
                          {f.severity}
                        </span>
                        <span className="text-[11px] font-mono text-aegis-accentBlue font-bold">{f.rule_id}</span>
                        <span className="text-xs text-aegis-textMuted truncate">· {f.affected_resource_id}</span>
                      </div>
                      <h4 className="text-xs font-bold text-aegis-textPrimary truncate">{f.title}</h4>
                      <p className="text-xs text-aegis-textSecondary line-clamp-1">{f.description}</p>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-aegis-accentCyan translate-x-1' : 'text-aegis-textMuted'}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Comprehensive Finding Detail Drawer */}
        <div className="aegis-card p-5 space-y-5 flex flex-col justify-between h-[640px] overflow-y-auto">
          {selectedFinding ? (
            <div className="space-y-4">
              {/* Header with Mode Toggle */}
              <div className="space-y-2 border-b border-aegis-border pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-aegis-accentCyan uppercase tracking-wider font-semibold">
                    {selectedFinding.finding_id}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Inline Mode Switch */}
                    <div className="flex items-center bg-aegis-bgSecondary border border-aegis-border rounded p-0.5 text-[10px] font-mono">
                      <button
                        onClick={() => setDrawerAudience('business')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          drawerAudience === 'business'
                            ? 'bg-aegis-accentCyan text-black font-semibold'
                            : 'text-aegis-textMuted hover:text-aegis-textPrimary'
                        }`}
                      >
                        Business View
                      </button>
                      <button
                        onClick={() => setDrawerAudience('technical')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          drawerAudience === 'technical'
                            ? 'bg-aegis-accentBlue text-black font-semibold'
                            : 'text-aegis-textMuted hover:text-aegis-textPrimary'
                        }`}
                      >
                        Technical Spec
                      </button>
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        selectedFinding.severity === 'CRITICAL'
                          ? 'bg-aegis-critical/20 text-aegis-critical border-aegis-critical/30'
                          : 'bg-aegis-warning/20 text-aegis-warning border-aegis-warning/30'
                      }`}
                    >
                      {selectedFinding.severity}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-aegis-textPrimary leading-snug">
                  {drawerAudience === 'business'
                    ? getBusinessExplanation(selectedFinding).plainTitle
                    : selectedFinding.title}
                </h3>
                <div className="text-xs font-mono text-aegis-textMuted">
                  Target Asset: <strong className="text-aegis-accentBlue">{selectedFinding.affected_resource_id}</strong>
                </div>
              </div>

              {drawerAudience === 'business' ? (
                /* Business / Executive Plain English View */
                <div className="space-y-3.5">
                  {/* Financial Risk Exposure Banner */}
                  <div className="p-3.5 rounded-lg bg-red-950/20 border border-aegis-critical/40 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-aegis-critical tracking-wider block">
                      Estimated Financial & Legal Exposure:
                    </span>
                    <div className="text-xs font-bold text-white">
                      {getBusinessExplanation(selectedFinding).financialRisk}
                    </div>
                  </div>

                  {/* What this means in plain English */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-aegis-textMuted uppercase block">
                      What This Means (Plain English):
                    </span>
                    <p className="text-xs text-aegis-textSecondary leading-relaxed bg-aegis-bgSecondary p-3 rounded border border-aegis-border">
                      {getBusinessExplanation(selectedFinding).summary}
                    </p>
                  </div>

                  {/* Business & Customer Danger */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-aegis-textMuted uppercase block">
                      Real-World Business Threat:
                    </span>
                    <p className="text-xs text-aegis-textSecondary leading-relaxed bg-aegis-bgSecondary p-3 rounded border border-aegis-border">
                      {getBusinessExplanation(selectedFinding).businessRisk}
                    </p>
                  </div>

                  {/* Safe Resolution */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-aegis-textMuted uppercase block">
                      Recommended Safe Action:
                    </span>
                    <div className="p-3 rounded bg-emerald-950/20 border border-emerald-600/30 text-xs text-emerald-300 leading-relaxed">
                      {getBusinessExplanation(selectedFinding).executiveAction}
                    </div>
                  </div>
                </div>
              ) : (
                /* Technical SecOps View */
                <div className="space-y-4">
                  {/* Regulatory Mapping Tags */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-aegis-textMuted uppercase block">Regulatory Standard Tags:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {getComplianceTags(selectedFinding.rule_id).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-aegis-bgSecondary border border-aegis-border text-aegis-textSecondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Description & Root Cause */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-aegis-textMuted uppercase block">Technical Description & Root Cause:</span>
                    <p className="text-xs text-aegis-textSecondary leading-relaxed bg-aegis-bgSecondary p-3 rounded border border-aegis-border">
                      {selectedFinding.description}
                    </p>
                  </div>

                  {/* Remediation Recommendation */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-aegis-textMuted uppercase block">Recommended Fix (Rule 14):</span>
                    <div className="p-3 rounded bg-emerald-950/20 border border-emerald-600/30 text-xs text-emerald-300 leading-relaxed">
                      {selectedFinding.remediation_recommendation}
                    </div>
                  </div>

                  {/* Evidence Nodes */}
                  <div className="space-y-1 font-mono text-xs">
                    <span className="text-[10px] text-aegis-textMuted uppercase block">Evidenced Graph Nodes:</span>
                    <div className="text-aegis-textSecondary">
                      {selectedFinding.evidence_nodes.join(', ') || selectedFinding.affected_resource_id}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-aegis-textMuted text-xs my-auto">Select a finding to inspect details.</div>
          )}

          {/* Action Footer */}
          {selectedFinding && onNavigateRemediation && (
            <button
              onClick={onNavigateRemediation}
              className="w-full py-2.5 px-4 rounded bg-aegis-accentBlue hover:bg-blue-400 text-black font-semibold text-xs font-mono flex items-center justify-center gap-2 transition-colors mt-auto"
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
