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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-aegis-border pb-4">
        <div>
          <h2 className="text-lg font-bold font-mono tracking-tight text-aegis-textPrimary">
            INFRASTRUCTURE AS CODE (IaC) CHANGE INTELLIGENCE
          </h2>
          <p className="text-xs text-aegis-textSecondary">
            Pre-deployment AST analysis for AWS CloudFormation, AWS CDK synthesized templates, and Terraform plans.
          </p>
        </div>

        {/* IaC Format Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-aegis-bgSecondary border border-aegis-border rounded p-1 font-mono text-xs">
            <button
              onClick={() => {
                setTemplateType('cloudformation');
                setInputCode(sampleTemplates.cfnVulnerable);
              }}
              className={`px-3 py-1.5 rounded transition-all ${
                templateType === 'cloudformation'
                  ? 'bg-aegis-accentCyan text-black font-semibold'
                  : 'text-aegis-textSecondary hover:text-aegis-textPrimary'
              }`}
            >
              CloudFormation / CDK
            </button>
            <button
              onClick={() => {
                setTemplateType('terraform');
                setInputCode(sampleTemplates.tfVulnerable);
              }}
              className={`px-3 py-1.5 rounded transition-all ${
                templateType === 'terraform'
                  ? 'bg-aegis-accentBlue text-black font-semibold'
                  : 'text-aegis-textSecondary hover:text-aegis-textPrimary'
              }`}
            >
              Terraform Plan AST
            </button>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="px-4 py-2 rounded bg-aegis-accentBlue hover:bg-blue-400 text-black font-semibold text-xs font-mono flex items-center gap-1.5 transition-all shadow-glow-cyan disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            Analyze Template AST
          </button>
        </div>
      </div>

      {/* Main Split: Code Editor (Left) vs Analysis Verdict & Findings (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Code Editor Container */}
        <div className="aegis-card flex flex-col h-[600px] overflow-hidden">
          <div className="p-3 border-b border-aegis-border bg-aegis-bgSecondary flex items-center justify-between text-xs font-mono">
            <span className="text-aegis-textMuted flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-aegis-accentCyan" />
              {templateType === 'cloudformation' ? 'cloudformation_template.json' : 'main.tf'}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(inputCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-[11px] text-aegis-textMuted hover:text-aegis-textPrimary flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className="flex-1 w-full p-4 bg-aegis-bg text-aegis-textPrimary font-mono text-xs outline-none resize-none leading-relaxed selection:bg-aegis-accentCyan selection:text-black"
            placeholder="Paste raw CloudFormation JSON/YAML or Terraform AST here..."
          />
        </div>

        {/* Right: Security Verdict & AST Findings */}
        <div className="space-y-4">
          {analysisResult && (
            <>
              {/* Verdict Banner */}
              <div
                className={`p-5 rounded-lg border shadow-panel space-y-2 ${
                  analysisResult.verdict === 'BLOCK'
                    ? 'bg-red-950/20 border-aegis-critical/40'
                    : 'bg-emerald-950/20 border-aegis-success/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                      analysisResult.verdict === 'BLOCK'
                        ? 'bg-aegis-critical/20 text-aegis-critical border-aegis-critical/40'
                        : 'bg-aegis-success/20 text-aegis-success border-aegis-success/40'
                    }`}
                  >
                    {analysisResult.verdict === 'BLOCK' ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    VERDICT: {analysisResult.verdict}
                  </span>
                  <span className="text-xs font-mono text-aegis-textMuted">CI/CD Exit Code: {analysisResult.verdict === 'BLOCK' ? '1 (FAIL)' : '0 (PASS)'}</span>
                </div>

                <p className="text-xs text-aegis-textPrimary leading-relaxed font-sans">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Identified Findings List */}
              <div className="aegis-card p-4 space-y-3 h-[450px] overflow-y-auto">
                <div className="text-xs font-bold font-mono uppercase tracking-wider text-aegis-textPrimary border-b border-aegis-border pb-2">
                  Static AST Violations ({analysisResult.findings.length})
                </div>

                <div className="space-y-3">
                  {analysisResult.findings.map((f, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded border border-aegis-border bg-aegis-bgSecondary space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-aegis-accentBlue font-bold">{f.rule_id}</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-aegis-critical/20 text-aegis-critical border border-aegis-critical/30">
                          {f.severity}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-aegis-textPrimary">{f.title}</h5>
                      <p className="text-xs text-aegis-textSecondary leading-relaxed">{f.description}</p>
                      <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/20 p-2 rounded border border-emerald-600/30">
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
