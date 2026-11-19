import React, { useState, useEffect } from 'react';
import { ComplianceReport, InvestigationReport } from '../types';
import { fetchComplianceReport } from '../api';
import {
  FileText,
  Award,
  CheckCircle,
  AlertTriangle,
  Download,
  Copy,
  ExternalLink,
  ShieldCheck,
  BarChart2
} from 'lucide-react';

interface PageComplianceAuditProps {
  report: InvestigationReport | null;
  selectedScenario: string;
}

export const PageComplianceAudit: React.FC<PageComplianceAuditProps> = ({
  report,
  selectedScenario
}) => {
  const [compReport, setCompReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchComplianceReport(selectedScenario)
      .then((data) => setCompReport(data))
      .catch((e) => console.warn('Compliance report fallback'))
      .finally(() => setLoading(false));
  }, [selectedScenario]);

  const handleDownloadReport = () => {
    if (!report) return;
    setDownloading(true);
    const content = JSON.stringify(
      {
        aegis_investigation_report: report,
        compliance_scorecards: compReport,
        audited_at: new Date().toISOString(),
        engine: 'AEGIS Autonomous Cloud Security & DevSecOps Platform'
      },
      null,
      2
    );

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AEGIS_AUDIT_REPORT_${report.investigation_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-aegis-border pb-4">
        <div>
          <h2 className="text-lg font-bold font-mono tracking-tight text-aegis-textPrimary">
            REGULATORY COMPLIANCE & AUDIT REPORTING
          </h2>
          <p className="text-xs text-aegis-textSecondary">
            Automated posture evaluation against CIS AWS Foundations Benchmark v3.0, SOC 2 Type II, and PCI-DSS v4.0.
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          disabled={downloading || !report}
          className="px-4 py-2 rounded bg-aegis-accentBlue hover:bg-blue-400 text-black font-semibold text-xs font-mono flex items-center gap-1.5 transition-all shadow-glow-cyan disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          Download JSON Audit Report
        </button>
      </div>

      {loading || !compReport ? (
        <div className="aegis-card p-12 text-center text-xs font-mono text-aegis-textMuted">
          Loading regulatory compliance scorecards...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Compliance Score Banner */}
          <div className="aegis-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-aegis-accentCyan">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-aegis-textMuted uppercase tracking-wider">
                COMPOSITE AUDIT SCORECARD
              </span>
              <h3 className="text-xl font-bold text-aegis-textPrimary">
                Overall Multi-Framework Compliance: {compReport.overall_compliance_pct}%
              </h3>
              <p className="text-xs text-aegis-textSecondary">
                Evaluated across {compReport.total_findings_mapped} discovered security findings and mapped to 4 active cybersecurity standards.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-4 text-center font-mono">
              <div className="bg-aegis-bgSecondary p-3 rounded border border-aegis-border min-w-[100px]">
                <div className="text-2xl font-bold text-aegis-textPrimary">{compReport.overall_compliance_pct}%</div>
                <div className="text-[10px] text-aegis-textMuted">Average Score</div>
              </div>
              <div className="bg-aegis-bgSecondary p-3 rounded border border-aegis-border min-w-[100px]">
                <div className="text-2xl font-bold text-aegis-accentCyan">{compReport.total_findings_mapped}</div>
                <div className="text-[10px] text-aegis-textMuted">Mapped Findings</div>
              </div>
            </div>
          </div>

          {/* 4 Framework Scorecards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(compReport.frameworks).map((fwKey) => {
              const fw = compReport.frameworks[fwKey];
              return (
                <div key={fwKey} className="aegis-card p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-aegis-border pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-aegis-textPrimary">{fw.framework_name}</h4>
                        <span className="text-[10px] font-mono text-aegis-textMuted">Version: {fw.version}</span>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          fw.compliance_score_pct === 100
                            ? 'bg-emerald-950/20 text-aegis-success border-emerald-600/30'
                            : 'bg-aegis-warning/20 text-aegis-warning border-aegis-warning/30'
                        }`}
                      >
                        {fw.compliance_score_pct}% Compliant
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-3 text-center font-mono text-xs">
                      <div className="p-2 rounded bg-aegis-bgSecondary border border-aegis-border">
                        <div className="text-aegis-textPrimary font-bold">{fw.total_checks}</div>
                        <div className="text-[10px] text-aegis-textMuted">Total</div>
                      </div>
                      <div className="p-2 rounded bg-aegis-bgSecondary border border-aegis-border">
                        <div className="text-aegis-success font-bold">{fw.passed_checks}</div>
                        <div className="text-[10px] text-aegis-textMuted">Passed</div>
                      </div>
                      <div className="p-2 rounded bg-aegis-bgSecondary border border-aegis-border">
                        <div className="text-aegis-critical font-bold">{fw.failed_checks}</div>
                        <div className="text-[10px] text-aegis-textMuted">Failed</div>
                      </div>
                    </div>

                    {fw.violations.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-aegis-border">
                        <span className="text-[10px] font-mono text-aegis-textMuted uppercase block">
                          Non-Compliant Controls ({fw.violations.length}):
                        </span>
                        <div className="space-y-1">
                          {fw.violations.map((v, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] font-mono p-1.5 rounded bg-aegis-bgSecondary border border-aegis-border flex items-center justify-between"
                            >
                              <span className="text-aegis-accentCyan font-bold">{v.control_id}</span>
                              <span className="text-aegis-textSecondary truncate max-w-[200px]">{v.control_title}</span>
                              <span className="text-aegis-critical text-[10px] uppercase font-bold">{v.severity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] font-mono text-aegis-textMuted pt-2 border-t border-aegis-border flex items-center justify-between">
                    <span>Audit Status: Evaluated</span>
                    <span>Deterministic Mapping</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
