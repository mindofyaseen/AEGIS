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
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
        <div>
          <h2 className="text-base font-semibold tracking-normal text-white">
            Regulatory compliance & audit reporting
          </h2>
          <p className="text-xs text-zinc-400">
            Automated posture evaluation against CIS AWS Foundations Benchmark v3.0, SOC 2 Type II, and PCI-DSS v4.0.
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          disabled={downloading || !report}
          className="px-3.5 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          Download JSON audit report
        </button>
      </div>

      {loading || !compReport ? (
        <div className="aegis-card p-12 text-center text-xs font-mono text-zinc-500">
          Loading regulatory compliance scorecards...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Compliance Score Banner */}
          <div className="aegis-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-sky-500">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-zinc-500 block">
                COMPOSITE AUDIT SCORECARD
              </span>
              <h3 className="text-lg font-semibold text-white">
                Multi-framework compliance: {compReport.overall_compliance_pct}%
              </h3>
              <p className="text-xs text-zinc-400">
                Evaluated across {compReport.total_findings_mapped} discovered security findings and mapped to 4 active cybersecurity standards.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3 text-center font-mono">
              <div className="bg-white/[0.02] p-3 rounded-md border border-white/[0.06] min-w-[90px]">
                <div className="text-xl font-semibold text-white tracking-tight">{compReport.overall_compliance_pct}%</div>
                <div className="text-[10px] text-zinc-500">Average score</div>
              </div>
              <div className="bg-white/[0.02] p-3 rounded-md border border-white/[0.06] min-w-[90px]">
                <div className="text-xl font-semibold text-sky-400 tracking-tight">{compReport.total_findings_mapped}</div>
                <div className="text-[10px] text-zinc-500">Violations</div>
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
                    <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                      <div>
                        <h4 className="text-xs font-semibold text-white">{fw.framework_name}</h4>
                        <span className="text-[10px] font-mono text-zinc-500">Version: {fw.version}</span>
                      </div>
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded border ${
                          fw.compliance_score_pct === 100
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {fw.compliance_score_pct}% compliant
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-3 text-center font-mono text-xs">
                      <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                        <div className="text-zinc-200 font-semibold">{fw.total_checks}</div>
                        <div className="text-[10px] text-zinc-500">Total</div>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                        <div className="text-emerald-400 font-semibold">{fw.passed_checks}</div>
                        <div className="text-[10px] text-zinc-500">Passed</div>
                      </div>
                      <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
                        <div className="text-red-400 font-semibold">{fw.failed_checks}</div>
                        <div className="text-[10px] text-zinc-500">Failed</div>
                      </div>
                    </div>

                    {fw.violations.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-white/[0.07]">
                        <span className="text-[11px] text-zinc-500 block">
                          Non-compliant controls ({fw.violations.length}):
                        </span>
                        <div className="space-y-1">
                          {fw.violations.map((v, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] font-mono p-1.5 rounded bg-white/[0.02] border border-white/[0.06] flex items-center justify-between"
                            >
                              <span className="text-sky-400">{v.control_id}</span>
                              <span className="text-zinc-400 truncate max-w-[200px]">{v.control_title}</span>
                              <span className="text-red-400 text-[10px]">{v.severity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/[0.07] flex items-center justify-between">
                    <span>Audit status: Evaluated</span>
                    <span>Deterministic mapping</span>
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
