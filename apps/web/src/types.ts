export type Verdict = 'BLOCK' | 'INSUFFICIENT_CONTEXT' | 'READY_FOR_HUMAN_REVIEW';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export interface ResourceEvidence {
  source_collector: string;
  discovered_at: string;
  api_call?: string;
  confidence: number;
}

export interface SecurityFinding {
  finding_id: string;
  rule_id: string;
  title: string;
  description: string;
  severity: Severity;
  affected_resource_id: string;
  affected_resource_type: string;
  remediation_recommendation: string;
  evidence_nodes: string[];
  confidence: number;
}

export interface AttackPathHop {
  hop_index: number;
  source_node: string;
  target_node: string;
  relationship: string;
  description: string;
  evidenced: boolean;
  assumptions: string[];
}

export interface AttackPath {
  path_id: string;
  title: string;
  severity: Severity;
  entry_point: string;
  target_asset: string;
  hops: AttackPathHop[];
  is_fully_evidenced: boolean;
  narrative: string;
}

export interface RemediationPatch {
  target_resource_id: string;
  suggested_action: string;
  terraform_patch?: string;
  cli_command_preview?: string;
  rollback_plan: string;
  verification_steps: string[];
}

export interface ContextCompleteness {
  completeness_score: number;
  total_collectors_run: number;
  successful_collectors: number;
  failed_collectors: string[];
  missing_critical_evidence: string[];
  stale_snapshots_detected: boolean;
  unresolved_dependencies: string[];
  verdict_eligible: boolean;
  explanation: string;
}

export interface InvestigationReport {
  investigation_id: string;
  account_id: string;
  region: string;
  investigated_at: string;
  verdict: Verdict;
  verdict_reason: string;
  context_completeness: ContextCompleteness;
  total_resources: number;
  total_findings: number;
  critical_findings: number;
  findings: SecurityFinding[];
  attack_paths: AttackPath[];
  remediation_patches: RemediationPatch[];
  agent_reasoning_summary: string;
  enforced_rules_evaluated: string[];
}

export interface TimelineEvent {
  event_id: string;
  event_time: string;
  event_name: string;
  event_source: string;
  actor_arn: string;
  actor_username: string;
  source_ip: string;
  target_resource_id?: string;
  security_significance: string;
  is_suspicious: boolean;
}

export interface AdversarialTest {
  id: string;
  name: string;
  status: string;
  defense: string;
}

export interface Scenario {
  id: string;
  name: string;
  expected_verdict: Verdict;
  description: string;
}

export interface RemediationPullRequest {
  pr_id: string;
  target_branch: string;
  remediation_branch: string;
  commit_message: string;
  pr_title: string;
  pr_body_markdown: string;
  patch_filename: string;
  unified_patch_content: string;
  target_resources: string[];
  created_at: string;
}

