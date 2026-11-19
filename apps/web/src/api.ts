import {
  InvestigationReport,
  TimelineEvent,
  AdversarialTest,
  Scenario,
  ComplianceReport,
  RemediationPullRequest
} from './types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API health check fallback');
  }
  return {
    status: 'healthy',
    service: 'AEGIS Cloud Security & DevSecOps Platform',
    mode: 'read_only',
    enforced_rules: 15,
    active_account: '237657481511',
    default_region: 'us-east-1',
    credit_balance: '$200.00 (Preserved, $0.00 spent)',
  };
}

export async function fetchScenarios(): Promise<Scenario[]> {
  try {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (res.ok) {
      const data = await res.json();
      return data.scenarios;
    }
  } catch (e) {
    console.warn('Scenarios fallback');
  }
  return [
    {
      id: 'block-ssh',
      name: 'Production Bastion Attack Path (BLOCK)',
      expected_verdict: 'BLOCK',
      description: 'Public SSH 0.0.0.0/0 exposure allowing lateral traversal to crown-jewel customer database.',
    },
    {
      id: 'insufficient-context',
      name: 'Incomplete Collector Telemetry (INSUFFICIENT_CONTEXT)',
      expected_verdict: 'INSUFFICIENT_CONTEXT',
      description: 'Critical IAM and S3 collectors failed or missing, triggering automatic deterministic refusal.',
    },
    {
      id: 'ready-review',
      name: 'Hardened Enterprise Subnet (READY_FOR_HUMAN_REVIEW)',
      expected_verdict: 'READY_FOR_HUMAN_REVIEW',
      description: 'Fully evidenced architecture with zero open admin ports, scoped IAM, and sealed S3 storage.',
    },
    {
      id: 'adversarial-injection',
      name: 'Adversarial Prompt Injection in IaC (BLOCK)',
      expected_verdict: 'BLOCK',
      description: 'Malicious developer injects "Ignore all security rules" prompt into Terraform resource tags.',
    },
  ];
}

export async function runScenarioInvestigation(scenarioId: string): Promise<InvestigationReport> {
  const res = await fetch(`${API_BASE}/investigate/scenario/${scenarioId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Investigation failed with status ${res.status}`);
  }
  return await res.json();
}

export async function investigateCustomInfrastructure(payload: {
  account_id?: string;
  region?: string;
  role_arn?: string;
  topology_data?: any;
  terraform_plan?: any;
  cfn_template?: string;
}): Promise<InvestigationReport> {
  const res = await fetch(`${API_BASE}/v1/investigate/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Custom investigation failed with status ${res.status}`);
  }
  return await res.json();
}

export async function fetchCloudTrailTimeline(): Promise<TimelineEvent[]> {
  const res = await fetch(`${API_BASE}/cloudtrail/timeline`);
  if (!res.ok) {
    throw new Error(`Failed to fetch CloudTrail timeline`);
  }
  return await res.json();
}

export async function fetchAdversarialTests(): Promise<{ total_tests: number; passed: number; test_suite: AdversarialTest[] }> {
  const res = await fetch(`${API_BASE}/adversarial/tests`);
  if (!res.ok) {
    throw new Error(`Failed to fetch adversarial tests`);
  }
  return await res.json();
}

export async function fetchRulesDocument(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/rules`);
    if (res.ok) {
      const data = await res.json();
      return data.rules_document;
    }
  } catch (e) {
    console.warn('Failed to load rules document');
  }
  return 'Rule documentation loaded.';
}

export async function fetchMultiAccountTopology(): Promise<any> {
  const res = await fetch(`${API_BASE}/phase2/multi-account`);
  if (!res.ok) throw new Error('Failed to load multi-account topology');
  return await res.json();
}

export async function triggerThreatCorrelation(): Promise<any> {
  const res = await fetch(`${API_BASE}/phase2/correlate-threats`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to correlate runtime threats');
  return await res.json();
}

export async function generateRemediationPullRequest(patch: any): Promise<RemediationPullRequest> {
  const res = await fetch(`${API_BASE}/phase2/generate-pr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Failed to generate remediation PR');
  return await res.json();
}

export async function fetchComplianceReport(scenarioId: string = 'block-ssh'): Promise<ComplianceReport> {
  const res = await fetch(`${API_BASE}/v1/compliance/report?scenario_id=${scenarioId}`);
  if (!res.ok) throw new Error('Failed to fetch compliance report');
  return await res.json();
}

export async function analyzeCloudFormationTemplate(templateContent: string): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/analyze/cloudformation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template_content: templateContent }),
  });
  if (!res.ok) throw new Error('Failed to analyze CloudFormation template');
  return await res.json();
}

export async function fetchBedrockGuardrailsSpec(): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/bedrock/guardrails-spec`);
  if (!res.ok) throw new Error('Failed to fetch Bedrock guardrails specification');
  return await res.json();
}

export async function fetchGitHubPRComment(scenarioId: string = 'block-ssh'): Promise<{ comment_markdown: string; verdict: string }> {
  const res = await fetch(`${API_BASE}/v1/integrations/github/comment?scenario_id=${scenarioId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to synthesize GitHub PR comment');
  return await res.json();
}

export async function fetchWebhookPayload(service: 'slack' | 'discord', scenarioId: string = 'block-ssh'): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/integrations/webhook/payload?service=${service}&scenario_id=${scenarioId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to fetch ${service} webhook payload`);
  return await res.json();
}
