import React, { useState } from 'react';
import {
  X,
  Server,
  Cloud,
  FileCode,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Play,
  ArrowRight,
  ExternalLink,
  Lock,
  UploadCloud
} from 'lucide-react';
import { investigateCustomInfrastructure } from '../api';
import { InvestigationReport } from '../types';

interface ConnectCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (report: InvestigationReport) => void;
}

export const ConnectCloudModal: React.FC<ConnectCloudModalProps> = ({
  isOpen,
  onClose,
  onConnected
}) => {
  const [connectMethod, setConnectMethod] = useState<'preset' | 'role' | 'iac'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<'fintech-bank' | 'healthcare-hipaa' | 'retail-ecommerce'>('fintech-bank');
  const [accountId, setAccountId] = useState('237657481511');
  const [region, setRegion] = useState('us-east-1');
  const [roleArn, setRoleArn] = useState('arn:aws:iam::237657481511:role/AegisSecurityAuditRole');
  const [iacContent, setIacContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        account_id: accountId.trim() || '237657481511',
        region: region.trim() || 'us-east-1',
        role_arn: roleArn.trim()
      };

      if (connectMethod === 'preset') {
        payload.preset_name = selectedPreset;
        payload.account_id = selectedPreset === 'fintech-bank' ? '884920194812' : selectedPreset === 'healthcare-hipaa' ? '551928401928' : '237657481511';
      } else if (connectMethod === 'iac' && iacContent.trim()) {
        payload.cfn_template = iacContent.trim();
      }

      const report = await investigateCustomInfrastructure(payload);
      onConnected(report);
      onClose();
    } catch (err: any) {
      console.error('Connection failed:', err);
      setErrorMsg(err.message || 'Failed to connect infrastructure. Verify your parameters.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-aegis-panelElevated border border-aegis-borderLight rounded-xl shadow-panel-elevated overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-aegis-border bg-aegis-bgSecondary flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-aegis-accentBlue/20 text-aegis-accentCyan border border-aegis-accentCyan/30 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-aegis-textPrimary">Connect Cloud Infrastructure</h3>
              <p className="text-[11px] text-aegis-textSecondary">
                Evaluate your own AWS cloud, test a pre-configured business architecture, or upload infrastructure code.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-aegis-textMuted hover:text-aegis-textPrimary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            <button
              onClick={() => setConnectMethod('preset')}
              className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1.5 ${
                connectMethod === 'preset'
                  ? 'bg-aegis-panel border-aegis-accentCyan shadow-sm'
                  : 'bg-aegis-bgSecondary border-aegis-border text-aegis-textMuted hover:border-aegis-borderLight'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Play className={`w-3.5 h-3.5 shrink-0 ${connectMethod === 'preset' ? 'text-aegis-accentCyan' : ''}`} />
                <span className={`font-bold ${connectMethod === 'preset' ? 'text-aegis-textPrimary' : ''}`}>
                  1-Click Presets
                </span>
              </div>
              <span className="text-[10px] text-aegis-textMuted font-sans">
                Instant test without setting up AWS.
              </span>
            </button>

            <button
              onClick={() => setConnectMethod('role')}
              className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1.5 ${
                connectMethod === 'role'
                  ? 'bg-aegis-panel border-aegis-accentCyan shadow-sm'
                  : 'bg-aegis-bgSecondary border-aegis-border text-aegis-textMuted hover:border-aegis-borderLight'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Lock className={`w-3.5 h-3.5 shrink-0 ${connectMethod === 'role' ? 'text-aegis-accentCyan' : ''}`} />
                <span className={`font-bold ${connectMethod === 'role' ? 'text-aegis-textPrimary' : ''}`}>
                  Live AWS Account
                </span>
              </div>
              <span className="text-[10px] text-aegis-textMuted font-sans">
                Read-only IAM Role. 100% safe.
              </span>
            </button>

            <button
              onClick={() => setConnectMethod('iac')}
              className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1.5 ${
                connectMethod === 'iac'
                  ? 'bg-aegis-panel border-aegis-accentBlue shadow-sm'
                  : 'bg-aegis-bgSecondary border-aegis-border text-aegis-textMuted hover:border-aegis-borderLight'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <FileCode className={`w-3.5 h-3.5 shrink-0 ${connectMethod === 'iac' ? 'text-aegis-accentBlue' : ''}`} />
                <span className={`font-bold ${connectMethod === 'iac' ? 'text-aegis-textPrimary' : ''}`}>
                  Upload IaC
                </span>
              </div>
              <span className="text-[10px] text-aegis-textMuted font-sans">
                Paste CloudFormation/Terraform.
              </span>
            </button>
          </div>

          {/* Form Fields for 1-Click Presets */}
          {connectMethod === 'preset' && (
            <div className="space-y-3">
              <label className="text-[11px] font-mono text-aegis-textMuted uppercase block">
                Select an Industry Architecture Blueprint
              </label>

              <div className="space-y-2">
                <div
                  onClick={() => setSelectedPreset('fintech-bank')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    selectedPreset === 'fintech-bank'
                      ? 'bg-aegis-panel border-aegis-accentCyan'
                      : 'bg-aegis-bgSecondary border-aegis-border hover:border-aegis-borderLight'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-aegis-textPrimary">Fintech Banking & Payment Cloud</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-aegis-critical/20 text-aegis-critical font-mono font-bold">
                      $2.4M Risk Exposure
                    </span>
                  </div>
                  <p className="text-[11px] text-aegis-textSecondary mt-1 leading-relaxed">
                    Multi-tier banking application with public API gateway, Aurora transaction ledger, and open admin port.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedPreset('healthcare-hipaa')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    selectedPreset === 'healthcare-hipaa'
                      ? 'bg-aegis-panel border-aegis-accentCyan'
                      : 'bg-aegis-bgSecondary border-aegis-border hover:border-aegis-borderLight'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-aegis-textPrimary">Healthcare & EHR Patient Cloud</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-aegis-critical/20 text-aegis-critical font-mono font-bold">
                      $1.9M HIPAA Penalty
                    </span>
                  </div>
                  <p className="text-[11px] text-aegis-textSecondary mt-1 leading-relaxed">
                    Hospital medical records system with unencrypted electronic Protected Health Information (ePHI) in S3.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-600/30 text-xs text-blue-300 font-sans flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-aegis-accentCyan mt-0.5" />
                <span>
                  <strong>Designed for Non-Technical Users:</strong> Presets simulate real enterprise environments so you can see AEGIS evaluate risks, calculate financial penalties, and generate 1-click fixes without needing any AWS credentials.
                </span>
              </div>
            </div>
          )}

          {/* Form Fields */}
          {connectMethod === 'role' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-aegis-textMuted uppercase block">
                    AWS Account ID (12 Digits)
                  </label>
                  <input
                    type="text"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="e.g. 123456789012"
                    className="w-full bg-aegis-bg border border-aegis-border rounded px-3 py-2 text-xs font-mono text-aegis-textPrimary outline-none focus:border-aegis-accentCyan"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-aegis-textMuted uppercase block">
                    Target AWS Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-aegis-bg border border-aegis-border rounded px-3 py-2 text-xs font-mono text-aegis-textPrimary outline-none focus:border-aegis-accentCyan"
                  >
                    <option value="us-east-1">us-east-1 (N. Virginia)</option>
                    <option value="us-west-2">us-west-2 (Oregon)</option>
                    <option value="eu-west-1">eu-west-1 (Ireland)</option>
                    <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-aegis-textMuted uppercase block">
                  Read-Only Audit Role ARN
                </label>
                <input
                  type="text"
                  value={roleArn}
                  onChange={(e) => setRoleArn(e.target.value)}
                  placeholder="arn:aws:iam::123456789012:role/AegisSecurityAuditRole"
                  className="w-full bg-aegis-bg border border-aegis-border rounded px-3 py-2 text-xs font-mono text-aegis-textPrimary outline-none focus:border-aegis-accentCyan"
                />
              </div>

              {/* Business Safe Guarantee Box */}
              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-600/30 text-xs text-emerald-300 leading-relaxed flex items-start gap-2.5 font-sans">
                <ShieldCheck className="w-4 h-4 shrink-0 text-aegis-success mt-0.5" />
                <div>
                  <strong>Enterprise Safety Guarantee:</strong> AEGIS operates under strict <strong>Zero-Mutation</strong> boundaries. The agent can only read infrastructure topology configuration and has zero privileges to modify, delete, or impact running production systems.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[11px] font-mono text-aegis-textMuted uppercase block">
                Paste CloudFormation JSON/YAML or Terraform Plan AST
              </label>
              <textarea
                value={iacContent}
                onChange={(e) => setIacContent(e.target.value)}
                rows={8}
                placeholder="Paste your AWS CloudFormation or Terraform plan JSON here to evaluate potential attack paths before deploying..."
                className="w-full bg-aegis-bg border border-aegis-border rounded p-3 text-xs font-mono text-aegis-textPrimary outline-none focus:border-aegis-accentCyan resize-none leading-relaxed"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded bg-red-950/20 border border-aegis-critical/40 text-xs text-aegis-critical flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-aegis-border bg-aegis-bgSecondary flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-mono text-aegis-textSecondary hover:text-aegis-textPrimary transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-5 py-2 rounded bg-aegis-accentCyan hover:bg-cyan-300 text-black font-semibold text-xs font-mono flex items-center gap-2 transition-all shadow-glow-cyan disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Running Autonomous Investigation...' : 'Start Dynamic Audit'}
          </button>
        </div>
      </div>
    </div>
  );
};
