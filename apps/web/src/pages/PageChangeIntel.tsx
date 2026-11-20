import React, { useState } from 'react';
import { SecurityFinding, Verdict } from '../types';
import { analyzeCloudFormationTemplate } from '../api';
import {
  FileCode,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle,
  Copy,
  Code,
  ArrowRight
} from 'lucide-react';

interface PageChangeIntelProps {
  onNavigateRemediation?: () => void;
}

export const PageChangeIntel: React.FC<PageChangeIntelProps> = ({ onNavigateRemediation }) => {
  const [templateType, setTemplateType] = useState<'cloudformation' | 'terraform'>('cloudformation');
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const sampleTemplates = {
    cfnVulnerable: JSON.stringify({
      AWSTemplateFormatVersion: "2010-09-09",
      Description: "CloudFormation Pull Request with Perimeter Exposure",
      Resources: {
        BastionSecurityGroup: {
          Type: "AWS::EC2::SecurityGroup",
          Properties: {
            GroupDescription: "Insecure Bastion Ingress",
            SecurityGroupIngress: [
              {
                IpProtocol: "tcp",
                FromPort: 22,
                ToPort: 22,
                CidrIp: "0.0.0.0/0"
              }
            ]
          }
        },
        CustomerDataBucket: {
          Type: "AWS::S3::Bucket",
          Properties: {
            BucketName: "corp-unprotected-financial-records"
          }
        },
        WildcardAdminRole: {
          Type: "AWS::IAM::Role",
          Properties: {
            Policies: [
              {
                PolicyName: "AdminTakeover",
                PolicyDocument: {
                  Statement: [
                    {
                      Effect: "Allow",
                      Action: "*",
                      Resource: "*"
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    }, null, 2),
    tfVulnerable: `resource "aws_security_group_rule" "bastion_ssh" {
  type        = "ingress"
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"] # VIOLATION: SEC-TF-01
  security_group_id = aws_security_group.bastion.id
}

resource "aws_s3_bucket_public_access_block" "customer_vault" {
  bucket = aws_s3_bucket.customer_vault.id
  # VIOLATION: SEC-TF-02 actions: ["delete"]
}`
  };

  const [inputCode, setInputCode] = useState(sampleTemplates.cfnVulnerable);
  const [analysisResult, setAnalysisResult] = useState<{
    verdict: Verdict;
    findings: SecurityFinding[];
    summary: string;
  } | null>({
    verdict: 'BLOCK',
    findings: [
      {
        finding_id: 'CFN-SG-BastionSecurityGroup-22',
        rule_id: 'SEC-CFN-01',
        title: 'CloudFormation: Security Group allows open SSH (port 22) to 0.0.0.0/0',
        description: "Resource 'BastionSecurityGroup' defines an ingress rule allowing traffic from 0.0.0.0/0 to port 22.",
        severity: 'CRITICAL',
        affected_resource_id: 'BastionSecurityGroup',
        affected_resource_type: 'AWS::EC2::SecurityGroup',
        remediation_recommendation: 'Restrict ingress CIDR to trusted corporate IP/VPN range instead of 0.0.0.0/0.',
        evidence_nodes: ['BastionSecurityGroup'],
        confidence: 1.0
      },
      {
        finding_id: 'CFN-S3-CustomerDataBucket-NO-PAB',
        rule_id: 'SEC-CFN-02',
        title: 'CloudFormation: S3 Bucket missing PublicAccessBlockConfiguration',
        description: "Resource 'CustomerDataBucket' does not configure PublicAccessBlockConfiguration.",
        severity: 'HIGH',
        affected_resource_id: 'CustomerDataBucket',
        affected_resource_type: 'AWS::S3::Bucket',
        remediation_recommendation: 'Add PublicAccessBlockConfiguration with all four block flags set to true.',
        evidence_nodes: ['CustomerDataBucket'],
        confidence: 1.0
      },
      {
        finding_id: 'CFN-IAM-WildcardAdminRole-WILDCARD',
        rule_id: 'SEC-CFN-03',
        title: 'CloudFormation: IAM policy grants wildcard Administrator access (*:*)',
        description: "Resource 'WildcardAdminRole' defines an inline policy statement allowing Action: '*' on Resource: '*'.",
        severity: 'CRITICAL',
        affected_resource_id: 'WildcardAdminRole',
        affected_resource_type: 'AWS::IAM::Role',
        remediation_recommendation: 'Scope IAM permissions down to least-privilege actions and explicit resource ARNs.',
        evidence_nodes: ['WildcardAdminRole'],
        confidence: 1.0
      }
    ],
    summary: 'CloudFormation template contains 2 CRITICAL and 1 HIGH severity perimeter violations.'
  });

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      if (templateType === 'cloudformation') {
        const res = await analyzeCloudFormationTemplate(inputCode);
        const hasCritical = res.findings.some((f: any) => f.severity === 'CRITICAL');
        setAnalysisResult({
          verdict: hasCritical ? 'BLOCK' : (res.findings.length > 0 ? 'READY_FOR_HUMAN_REVIEW' : 'READY_FOR_HUMAN_REVIEW'),
          findings: res.findings,
          summary: `Analysis identified ${res.findings_count} security findings in template.`
        });
      } else {
        // Terraform simulation
        setAnalysisResult({
          verdict: 'BLOCK',
          findings: [
            {
              finding_id: 'TF-SG-bastion_ssh-22',
              rule_id: 'SEC-TF-01',
              title: 'Terraform: Ingress rule exposes port 22 SSH to 0.0.0.0/0',
              description: 'Resource aws_security_group_rule.bastion_ssh introduces open public ingress.',
              severity: 'CRITICAL',
              affected_resource_id: 'aws_security_group_rule.bastion_ssh',
              affected_resource_type: 'AWS::EC2::SecurityGroup',
              remediation_recommendation: 'Constrain cidr_blocks to trusted management IP.',
              evidence_nodes: ['aws_security_group_rule.bastion_ssh'],
              confidence: 1.0
            }
          ],
          summary: 'Terraform AST analyzer identified 1 CRITICAL perimeter exposure violation.'
        });
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
        <div>
          <h2 className="text-base font-semibold tracking-normal text-white">
            Change intelligence & IaC gatekeeper
          </h2>
          <p className="text-xs text-zinc-400">
            Pre-deployment AST analysis for AWS CloudFormation, AWS CDK synthesized templates, and Terraform plans.
          </p>
        </div>

        {/* IaC Format Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-md p-0.5 text-xs">
            <button
              onClick={() => {
                setTemplateType('cloudformation');
                setInputCode(sampleTemplates.cfnVulnerable);
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                templateType === 'cloudformation'
                  ? 'bg-white/10 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              CloudFormation / CDK
            </button>
            <button
              onClick={() => {
                setTemplateType('terraform');
                setInputCode(sampleTemplates.tfVulnerable);
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                templateType === 'terraform'
                  ? 'bg-white/10 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Terraform plan AST
            </button>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="px-3.5 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            Analyze template AST
          </button>
        </div>
      </div>

      {/* Main Split: Code Editor (Left) vs Analysis Verdict & Findings (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Code Editor Container */}
        <div className="aegis-card flex flex-col h-[600px] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02] flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-sky-400" />
              {templateType === 'cloudformation' ? 'cloudformation_template.json' : 'main.tf'}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(inputCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className="flex-1 w-full p-4 bg-black/40 text-zinc-200 font-mono text-xs outline-none resize-none leading-relaxed selection:bg-sky-500/20"
            placeholder="Paste raw CloudFormation JSON/YAML or Terraform AST here..."
          />
        </div>

        {/* Right: Security Verdict & AST Findings */}
        <div className="space-y-4">
          {analysisResult && (
            <>
              {/* Verdict Banner */}
              <div
                className={`p-5 rounded-lg border space-y-2 ${
                  analysisResult.verdict === 'BLOCK'
                    ? 'bg-white/[0.02] border-red-500/20 border-l-4 border-l-red-500'
                    : 'bg-white/[0.02] border-emerald-500/20 border-l-4 border-l-emerald-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-medium px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                      analysisResult.verdict === 'BLOCK'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {analysisResult.verdict === 'BLOCK' ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    Verdict: {analysisResult.verdict}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">CI/CD exit code: {analysisResult.verdict === 'BLOCK' ? '1 (FAIL)' : '0 (PASS)'}</span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Identified Findings List */}
              <div className="aegis-card p-4 space-y-3 h-[450px] overflow-y-auto">
                <div className="text-xs font-semibold text-white border-b border-white/[0.07] pb-2">
                  Static AST violations ({analysisResult.findings.length})
                </div>

                <div className="space-y-2.5">
                  {analysisResult.findings.map((f, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-md border border-white/[0.06] bg-white/[0.02] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-sky-400">{f.rule_id}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          {f.severity}
                        </span>
                      </div>
                      <h5 className="text-xs font-medium text-white">{f.title}</h5>
                      <p className="text-xs text-zinc-400 leading-relaxed">{f.description}</p>
                      <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/20 p-2 rounded border border-emerald-500/20">
                        Fix: {f.remediation_recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
