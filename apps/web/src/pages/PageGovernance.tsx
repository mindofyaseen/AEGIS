import React, { useState, useEffect } from 'react';
import { fetchBedrockGuardrailsSpec, fetchRulesDocument } from '../api';
import {
  Scale,
  Shield,
  Lock,
  Code,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export const PageGovernance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'layers' | 'guardrails_spec'>('rules');
  const [guardrailSpec, setGuardrailSpec] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>('RULE-01');

  useEffect(() => {
    fetchBedrockGuardrailsSpec()
      .then((data) => setGuardrailSpec(data))
      .catch((e) => console.warn('Guardrails spec fallback'));
  }, []);

  const rulesList = [
    {
      id: 'RULE-01',
      title: 'Target Cloud Boundary Enforcement',
      scope: 'Restricts investigation strictly to authorized AWS Account (237657481511) and us-east-1.',
      enforcement: 'Scoped IAM Policies & STS AssumeRole Allowlist',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-02',
      title: 'Strict Read-Only Operations',
      scope: 'Agent may never invoke mutation commands, apply infrastructure changes, or alter configurations.',
      enforcement: 'IAM Action Boundary & Action Group Whitelist',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-03',
      title: 'Zero Production Mutation',
      scope: 'Zero destructive execution tools (terraform apply, aws cli mutate, shell exec) exist in agent schema.',
      enforcement: 'Tool Inventory Isolation',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-04',
      title: 'Deterministic Knowledge Graph Modeling',
      scope: 'All infrastructure nodes and edges must be backed by verified AWS API telemetry or explicitly labeled demo fixtures.',
      enforcement: 'NetworkX Directed Graph Engine',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-05',
      title: 'Evidence-Backed Findings Mandate',
      scope: 'Every security finding must reference concrete resource IDs, discovery timestamps, and collector sources.',
      enforcement: 'Pydantic Strict Schemas',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-06',
      title: 'Context Completeness Gate',
      scope: 'Refuse safety determinations when telemetry is incomplete, contradictory, or missing essential collectors.',
      enforcement: 'Deterministic Mathematical Gate (Threshold >= 0.85)',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-07',
      title: 'Stale Snapshot Rejection (>24 Hours)',
      scope: 'Telemetry snapshots older than 24 hours are penalized and disqualified from safety determinations.',
      enforcement: 'Timestamp Verification Engine',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-08',
      title: 'Risk-Based Verdict Arbitration',
      scope: 'Agent must output one of three legal verdicts: BLOCK, INSUFFICIENT_CONTEXT, or READY_FOR_HUMAN_REVIEW.',
      enforcement: 'Policy Engine State Machine',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-09',
      title: 'Multi-Hop Attack Path Analysis',
      scope: 'Trace traversal from public ingress to private data tier using BFS graph traversal.',
      enforcement: 'AttackPathTracer Directed BFS',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-10',
      title: 'Adversarial Prompt Resistance',
      scope: 'Quarantine prompt injection attempts embedded in IaC comments, tags, or CloudTrail logs.',
      enforcement: 'Bedrock Harness Pre-Processor & Content Filters',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-11',
      title: 'Sensitive Information & Credential Protection',
      scope: 'Never log, print, or leak AWS secret keys, session tokens, or plaintext credentials.',
      enforcement: 'PII Regex Masking & Key Sanitizer',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-12',
      title: 'Least Privilege IAM Role Scoping',
      scope: 'Flag and block wildcard administrator privileges (*:*) on public compute nodes.',
      enforcement: 'IAM Policy AST Parser',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-13',
      title: 'Perimeter Ingress Hardening',
      scope: 'Prohibit 0.0.0.0/0 ingress to port 22 (SSH) and 3389 (RDP) on unhardened instances.',
      enforcement: 'SEC-NET-01 Gate',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-14',
      title: 'Human Review Confirmation & Patch Generation',
      scope: 'Generate unified diff patches with rollback plans. Real execution requires human review.',
      enforcement: 'RemediationPlanner Unified Diff Generator',
      status: 'ENFORCED'
    },
    {
      id: 'RULE-15',
      title: 'Immutable Audit Trail',
      scope: 'Persist all investigation reports, findings, and tool invocations with cryptographic hashes.',
      enforcement: 'Append-Only JSONL Audit Ledger',
      status: 'ENFORCED'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-aegis-border pb-4">
        <div>
          <h2 className="text-lg font-bold font-mono tracking-tight text-aegis-textPrimary">
            AGENT GOVERNANCE & SECURITY BOUNDARIES
          </h2>
          <p className="text-xs text-aegis-textSecondary">
            The 15 deterministic operating rules, 5-layer technical enforcement architecture, and Bedrock Guardrail specifications.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-aegis-bgSecondary border border-aegis-border rounded p-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === 'rules'
                ? 'bg-aegis-accentBlue text-black font-semibold'
                : 'text-aegis-textSecondary hover:text-aegis-textPrimary'
            }`}
          >
            15 Agent Rules
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === 'layers'
                ? 'bg-aegis-accentCyan text-black font-semibold'
                : 'text-aegis-textSecondary hover:text-aegis-textPrimary'
            }`}
          >
            5 Enforcement Layers
          </button>
          <button
            onClick={() => setActiveTab('guardrails_spec')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeTab === 'guardrails_spec'
                ? 'bg-aegis-aiViolet text-black font-semibold'
                : 'text-aegis-textSecondary hover:text-aegis-textPrimary'
            }`}
          >
            Bedrock Guardrails Spec
          </button>
        </div>
      </div>

      {/* Tab 1: 15 Deterministic Rules */}
      {activeTab === 'rules' && (
        <div className="aegis-card overflow-hidden">
          <div className="p-3 border-b border-aegis-border bg-aegis-bgSecondary flex items-center justify-between text-xs font-mono text-aegis-textMuted">
            <span>DETERMINISTIC AGENT RULES (AEGIS_AGENT_RULES.MD)</span>
            <span>STATUS: 15/15 ACTIVE & AUDITED</span>
          </div>

          <div className="divide-y divide-aegis-border">
            {rulesList.map((r) => {
              const isExpanded = expandedRule === r.id;
              return (
                <div key={r.id} className="p-4 hover:bg-aegis-bgSecondary/50 transition-colors">
                  <div
                    onClick={() => setExpandedRule(isExpanded ? null : r.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-aegis-accentCyan">{r.id}</span>
                      <h4 className="text-xs font-bold text-aegis-textPrimary">{r.title}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/20 text-aegis-success border border-emerald-600/30">
                        {r.status}
                      </span>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-aegis-textMuted" /> : <ChevronRight className="w-4 h-4 text-aegis-textMuted" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-aegis-border space-y-2 text-xs font-mono">
                      <div>
                        <span className="text-aegis-textMuted text-[10px] uppercase block">Operational Limit / Mandate:</span>
                        <p className="text-aegis-textSecondary font-sans leading-relaxed mt-0.5">{r.scope}</p>
                      </div>
                      <div>
                        <span className="text-aegis-textMuted text-[10px] uppercase block">Technical Enforcement Layer:</span>
                        <span className="text-aegis-accentBlue font-bold">{r.enforcement}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: 5 Layered Defense Architecture */}
      {activeTab === 'layers' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              num: '1',
              name: 'Scoped IAM Boundary',
              desc: 'Explicit read-only IAM policies prevent any Describe/Get permission from escalating to Put/Create/Delete.',
              type: 'Cloud Layer'
            },
            {
              num: '2',
              name: 'Action Group Allowlist',
              desc: 'Bedrock harness exposes only 6 read-only discovery tools. Mutation tools do not exist in the agent schema.',
              type: 'Harness Layer'
            },
            {
              num: '3',
              name: 'Context Completeness Gate',
              desc: 'Mathematical threshold (score >= 0.85) fail-closed mechanism rejecting verdicts when telemetry is missing.',
              type: 'Data Gate'
            },
            {
              num: '4',
              name: 'LLM Quarantine Filter',
              desc: 'Sanitizes untrusted IaC comments, tags, and logs to block prompt injection overrides.',
              type: 'Model Gate'
            },
            {
              num: '5',
              name: 'Rule 14 Human Review',
              desc: 'Automated remediation is strictly advisory (.patch files). Zero direct applying permitted.',
              type: 'Safety Barrier'
            }
          ].map((layer) => (
            <div key={layer.num} className="aegis-card p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded bg-aegis-bgSecondary border border-aegis-border flex items-center justify-center font-mono font-bold text-aegis-accentCyan text-sm mb-3">
                  0{layer.num}
                </div>
                <div className="text-[10px] font-mono text-aegis-accentBlue uppercase">{layer.type}</div>
                <h4 className="text-xs font-bold text-aegis-textPrimary mt-1">{layer.name}</h4>
                <p className="text-xs text-aegis-textSecondary leading-relaxed mt-2">{layer.desc}</p>
              </div>
              <div className="text-[10px] font-mono text-aegis-success pt-2 border-t border-aegis-border flex items-center gap-1">
                ✓ Verified Active
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Bedrock Native Guardrails Spec Viewer */}
      {activeTab === 'guardrails_spec' && (
        <div className="aegis-card overflow-hidden">
          <div className="p-3 border-b border-aegis-border bg-aegis-bgSecondary flex items-center justify-between text-xs font-mono">
            <span className="text-aegis-textPrimary font-semibold flex items-center gap-1.5">
              <Code className="w-4 h-4 text-aegis-aiViolet" />
              AWS Bedrock Guardrails Specification (boto3 create_guardrail)
            </span>
            <button
              onClick={() => {
                if (guardrailSpec) {
                  navigator.clipboard.writeText(JSON.stringify(guardrailSpec, null, 2));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className="text-[11px] text-aegis-textMuted hover:text-aegis-textPrimary flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
          </div>

          <pre className="p-4 bg-aegis-bg text-xs font-mono text-aegis-accentCyan overflow-x-auto leading-relaxed max-h-[500px]">
            {guardrailSpec
              ? JSON.stringify(guardrailSpec.boto3_create_guardrail_payload, null, 2)
              : '// Loading Bedrock Guardrail JSON specification...'}
          </pre>
        </div>
      )}
    </div>
  );
};
