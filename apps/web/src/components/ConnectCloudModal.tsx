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
  UploadCloud,
  Copy,
  Check
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
  const [connectMethod, setConnectMethod] = useState<'preset' | 'deploy' | 'role' | 'iac'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<'fintech-bank' | 'healthcare-hipaa' | 'retail-ecommerce'>('fintech-bank');
  const [accountId, setAccountId] = useState('237657481511');
  const [region, setRegion] = useState('us-east-1');
  const [roleArn, setRoleArn] = useState('arn:aws:iam::237657481511:role/AegisSecurityAuditRole');
  const [iacContent, setIacContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

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
      <div className="relative w-full max-w-2xl bg-[#141822] border border-white/[0.1] rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/[0.07] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white/[0.06] border border-white/[0.08] text-sky-400 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Connect AWS infrastructure</h3>
              <p className="text-xs text-zinc-400">
                Evaluate live cloud telemetry via read-only role, test an industry blueprint, or upload IaC.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => setConnectMethod('preset')}
              className={`p-2.5 rounded-md border text-left transition-colors flex flex-col gap-1 ${
                connectMethod === 'preset'
                  ? 'bg-white/[0.07] border-white/[0.15] text-white shadow-sm'
                  : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Play className={`w-3.5 h-3.5 shrink-0 ${connectMethod === 'preset' ? 'text-sky-400' : 'text-zinc-500'}`} />
                <span className={`font-medium ${connectMethod === 'preset' ? 'text-white' : 'text-zinc-300'}`}>
                  1-Click Presets
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 truncate">
                Instant test without AWS.
              </span>
            </button>

            <button
              onClick={() => setConnectMethod('deploy')}
              className={`p-2.5 rounded-md border text-left transition-colors flex flex-col gap-1 ${
                connectMethod === 'deploy'
                  ? 'bg-white/[0.07] border-white/[0.15] text-white shadow-sm'
                  : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Server className={`w-3.5 h-3.5 shrink-0 ${connectMethod === 'deploy' ? 'text-sky-400' : 'text-zinc-500'}`} />
                <span className={`font-medium ${connectMethod === 'deploy' ? 'text-white' : 'text-zinc-300'}`}>
                  Deploy in My AWS
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 truncate">
                In-account serverless stack.
              </span>
            </button>

            <button
              onClick={() => setConnectMethod('role')}
              className={`p-2.5 rounded-md border text-left transition-colors flex flex-col gap-1 ${
                connectMethod === 'role'
                  ? 'bg-white/[0.07] border-white/[0.15] text-white shadow-sm'
                  : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Lock className={`w-3.5 h-3.5 shrink-0 ${connectMethod === 'role' ? 'text-sky-400' : 'text-zinc-500'}`} />
                <span className={`font-medium ${connectMethod === 'role' ? 'text-white' : 'text-zinc-300'}`}>
                  Live Role Connect
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 truncate">
                Read-only IAM role.
              </span>
            </button>

            <button
              onClick={() => setConnectMethod('iac')}
              className={`p-2.5 rounded-md border text-left transition-colors flex flex-col gap-1 ${
                connectMethod === 'iac'
                  ? 'bg-white/[0.07] border-white/[0.15] text-white shadow-sm'
                  : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/[0.1]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <FileCode className={`w-3.5 h-3.5 shrink-0 ${connectMethod === 'iac' ? 'text-sky-400' : 'text-zinc-500'}`} />
                <span className={`font-medium ${connectMethod === 'iac' ? 'text-white' : 'text-zinc-300'}`}>
                  Upload IaC
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 truncate">
                CloudFormation or TF.
              </span>
            </button>
          </div>

          {/* Form Fields for 1-Click Presets */}
          {connectMethod === 'preset' && (
            <div className="space-y-3">
              <label className="text-[11px] text-zinc-400 font-medium block">
                Select an industry architecture blueprint
              </label>

              <div className="space-y-2">
                <div
                  onClick={() => setSelectedPreset('fintech-bank')}
                  className={`p-3.5 rounded-md border cursor-pointer transition-colors ${
                    selectedPreset === 'fintech-bank'
                      ? 'bg-white/[0.05] border-white/[0.15]'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Fintech Banking & Payment Cloud</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-mono border border-red-500/20">
                      $2.4M Risk Exposure
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Multi-tier banking application with public API gateway, Aurora transaction ledger, and open admin port.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedPreset('healthcare-hipaa')}
                  className={`p-3.5 rounded-md border cursor-pointer transition-colors ${
                    selectedPreset === 'healthcare-hipaa'
                      ? 'bg-white/[0.05] border-white/[0.15]'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Healthcare & EHR Patient Cloud</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-mono border border-red-500/20">
                      $1.9M HIPAA Penalty
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Hospital medical records system with unencrypted electronic Protected Health Information (ePHI) in S3.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-md bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  <strong>Designed for Leadership:</strong> Presets simulate real enterprise environments so you can see AEGIS evaluate risks, calculate financial penalties, and generate 1-click fixes without needing any AWS credentials.
                </span>
              </div>
            </div>
          )}

          {/* Form Fields for In-Account Customer Deployment */}
          {connectMethod === 'deploy' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-white">Deploy In-Account AI DevSecOps Engineer</h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Provision your private AEGIS runtime directly inside your AWS environment using native AWS CloudFormation. 100% of data and graphs remain inside your account boundary.
                </p>
              </div>

              {/* Step 1: Preflight */}
              <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Step 1: Automated Preflight Audit</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Zero-Cost Check</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Verifies caller credentials, CloudFormation template schemas, and Amazon Bedrock in-region model reachability before provisioning.
                </p>
                <div className="flex items-center justify-between bg-black/40 border border-white/[0.08] rounded p-2 text-xs font-mono text-zinc-300">
                  <span>python cli/aegis_cli.py --preflight</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("python cli/aegis_cli.py --preflight");
                      setCopiedCmd(true);
                      setTimeout(() => setCopiedCmd(false), 2000);
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Step 2: 1-Click Launch */}
              <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Step 2: 1-Click CloudFormation Deployment</span>
                  <span className="text-[10px] font-mono text-zinc-500">2 Mins Execution</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Deploys 5 serverless support resources (`aegis-*`) without modifying any existing production workloads.
                </p>
                <div className="bg-black/40 border border-white/[0.08] rounded p-2 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                  aws cloudformation deploy --template-file deploy/aws/aegis_customer_deployable_stack.yml --stack-name aegis-devsecops-engineer --capabilities CAPABILITY_NAMED_IAM
                </div>
              </div>

              {/* Guarantee Box */}
              <div className="p-3 rounded-md bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  <strong>Customer Account Ownership:</strong> You own the runtime, the IAM role, and the data. AEGIS runs strictly read-only and never reads S3 object contents or secrets.
                </span>
              </div>
            </div>
          )}

          {/* Form Fields */}
          {connectMethod === 'role' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-medium block">
                    AWS Account ID (12 Digits)
                  </label>
                  <input
                    type="text"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="e.g. 123456789012"
                    className="w-full bg-black/40 border border-white/[0.1] rounded-md px-3 py-2 text-xs font-mono text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400 font-medium block">
                    Target AWS Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.1] rounded-md px-3 py-2 text-xs font-mono text-white outline-none focus:border-sky-500"
                  >
                    <option value="us-east-1" className="bg-[#141822]">us-east-1 (N. Virginia)</option>
                    <option value="us-west-2" className="bg-[#141822]">us-west-2 (Oregon)</option>
                    <option value="eu-west-1" className="bg-[#141822]">eu-west-1 (Ireland)</option>
                    <option value="ap-southeast-1" className="bg-[#141822]">ap-southeast-1 (Singapore)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium block">
                  Read-Only Audit Role ARN
                </label>
                <input
                  type="text"
                  value={roleArn}
                  onChange={(e) => setRoleArn(e.target.value)}
                  placeholder="arn:aws:iam::123456789012:role/AegisSecurityAuditRole"
                  className="w-full bg-black/40 border border-white/[0.1] rounded-md px-3 py-2 text-xs font-mono text-white outline-none focus:border-sky-500"
                />
              </div>

              {/* Business Safe Guarantee Box */}
              <div className="p-3.5 rounded-md bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <div>
                  <strong>Enterprise Safety Guarantee:</strong> AEGIS operates under strict <strong>Zero-Mutation</strong> boundaries. The agent can only read infrastructure topology configuration and has zero privileges to modify, delete, or impact running production systems.
                </div>
              </div>
            </div>
          ) : connectMethod === 'iac' ? (
            <div className="space-y-2">
              <label className="text-[11px] text-zinc-400 font-medium block">
                Paste CloudFormation JSON/YAML or Terraform Plan AST
              </label>
              <textarea
                value={iacContent}
                onChange={(e) => setIacContent(e.target.value)}
                rows={8}
                placeholder="Paste your AWS CloudFormation or Terraform plan JSON here to evaluate potential attack paths before deploying..."
                className="w-full bg-black/40 border border-white/[0.1] rounded-md p-3 text-xs font-mono text-white outline-none focus:border-sky-500 resize-none leading-relaxed"
              />
            </div>
          ) : null}

          {errorMsg && (
            <div className="p-3 rounded-md bg-red-950/20 border border-red-500/30 text-xs text-red-400 flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/[0.07] bg-white/[0.02] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center gap-2 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Running autonomous investigation...' : 'Start dynamic audit'}
          </button>
        </div>
      </div>
    </div>
  );
};
