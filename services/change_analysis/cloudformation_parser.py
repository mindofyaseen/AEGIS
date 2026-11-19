"""
AEGIS — AWS CloudFormation & AWS CDK Template Analyzer
Deterministic AST parser for CloudFormation JSON/YAML and CDK synth output.
Enforces Rule 02 (Zero Mutation), Rule 08 (Risk Verdict), Rule 14 (Deterministic Patches).
"""

from typing import List, Dict, Any
import json
import uuid
from backend.models import SecurityFinding, Severity, ResourceType

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


class CloudFormationAnalyzer:
    """
    Parses AWS CloudFormation templates and AWS CDK synthesized output to detect:
    1. SEC-CFN-01: Public Ingress (0.0.0.0/0 on port 22/3389) in Security Groups
    2. SEC-CFN-02: S3 Buckets missing or disabling PublicAccessBlockConfiguration
    3. SEC-CFN-03: IAM Roles with wildcard Action (*) and Resource (*) permissions
    4. SEC-CFN-04: RDS DB Instances with PubliclyAccessible set to true
    """

    def parse_template(self, content: str) -> Dict[str, Any]:
        """Parse raw JSON or YAML template string safely."""
        content = content.strip()
        if not content:
            return {}
        
        # Try JSON first
        if content.startswith("{"):
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                pass
        
        # Try YAML if available
        if HAS_YAML:
            try:
                parsed = yaml.safe_load(content)
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                pass

        try:
            return json.loads(content)
        except Exception:
            return {"Resources": {}}

    def analyze(self, template_content: str) -> List[SecurityFinding]:
        """Analyzes a CloudFormation template string and returns security findings."""
        findings: List[SecurityFinding] = []
        parsed = self.parse_template(template_content)
        
        resources = parsed.get("Resources", {})
        if not isinstance(resources, dict):
            return findings

        for resource_name, resource_data in resources.items():
            if not isinstance(resource_data, dict):
                continue

            r_type = resource_data.get("Type", "")
            props = resource_data.get("Properties", {})
            if not isinstance(props, dict):
                props = {}

            # 1. AWS::EC2::SecurityGroup & Ingress
            if r_type in ("AWS::EC2::SecurityGroup", "AWS::EC2::SecurityGroupIngress"):
                findings.extend(self._check_security_group(resource_name, r_type, props))

            # 2. AWS::S3::Bucket
            elif r_type == "AWS::S3::Bucket":
                findings.extend(self._check_s3_bucket(resource_name, props))

            # 3. AWS::IAM::Role or AWS::IAM::Policy
            elif r_type in ("AWS::IAM::Role", "AWS::IAM::Policy"):
                findings.extend(self._check_iam(resource_name, props))

            # 4. AWS::RDS::DBInstance
            elif r_type == "AWS::RDS::DBInstance":
                findings.extend(self._check_rds(resource_name, props))

        return findings

    def _check_security_group(self, name: str, r_type: str, props: Dict[str, Any]) -> List[SecurityFinding]:
        findings = []
        rules = []

        if r_type == "AWS::EC2::SecurityGroup":
            rules = props.get("SecurityGroupIngress", [])
        else:
            rules = [props]

        if not isinstance(rules, list):
            rules = [rules]

        for rule in rules:
            if not isinstance(rule, dict):
                continue
            cidr = rule.get("CidrIp") or rule.get("CidrIpv6")
            from_port = rule.get("FromPort")
            to_port = rule.get("ToPort")

            is_open = cidr in ("0.0.0.0/0", "::/0")
            is_ssh = (from_port is not None and to_port is not None and int(from_port) <= 22 <= int(to_port))
            is_rdp = (from_port is not None and to_port is not None and int(from_port) <= 3389 <= int(to_port))

            if is_open and (is_ssh or is_rdp):
                service = "SSH (port 22)" if is_ssh else "RDP (port 3389)"
                findings.append(SecurityFinding(
                    finding_id=f"CFN-SG-{name}-{from_port}",
                    rule_id="SEC-CFN-01",
                    severity=Severity.CRITICAL,
                    title=f"CloudFormation: Security Group allows open {service} to 0.0.0.0/0",
                    description=(
                        f"Resource '{name}' defines an ingress rule allowing traffic from {cidr} "
                        f"to sensitive port ({from_port}-{to_port}), exposing infrastructure to the public internet."
                    ),
                    affected_resource_id=name,
                    affected_resource_type=ResourceType.SECURITY_GROUP,
                    remediation_recommendation=f"Restrict ingress CIDR to trusted corporate IP/VPN range instead of {cidr}.",
                    confidence=1.0,
                    evidence_nodes=[name]
                ))

        return findings

    def _check_s3_bucket(self, name: str, props: Dict[str, Any]) -> List[SecurityFinding]:
        findings = []
        pab = props.get("PublicAccessBlockConfiguration")

        if not pab or not isinstance(pab, dict):
            findings.append(SecurityFinding(
                finding_id=f"CFN-S3-{name}-NO-PAB",
                rule_id="SEC-CFN-02",
                severity=Severity.HIGH,
                title="CloudFormation: S3 Bucket missing PublicAccessBlockConfiguration",
                description=(
                    f"Resource '{name}' does not configure PublicAccessBlockConfiguration. "
                    "Buckets must enforce block public access settings to prevent accidental data leaks."
                ),
                affected_resource_id=name,
                affected_resource_type=ResourceType.S3_BUCKET,
                remediation_recommendation="Add PublicAccessBlockConfiguration with BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy, and RestrictPublicBuckets all set to true.",
                confidence=1.0,
                evidence_nodes=[name]
            ))
        else:
            block_acls = pab.get("BlockPublicAcls")
            block_policy = pab.get("BlockPublicPolicy")
            if block_acls is False or block_policy is False:
                findings.append(SecurityFinding(
                    finding_id=f"CFN-S3-{name}-DISABLED-PAB",
                    rule_id="SEC-CFN-02",
                    severity=Severity.HIGH,
                    title="CloudFormation: S3 Bucket disables PublicAccessBlock protections",
                    description=f"Resource '{name}' explicitly sets S3 BlockPublic protections to false.",
                    affected_resource_id=name,
                    affected_resource_type=ResourceType.S3_BUCKET,
                    remediation_recommendation="Set all PublicAccessBlockConfiguration fields to true.",
                    confidence=1.0,
                    evidence_nodes=[name]
                ))

        return findings

    def _check_iam(self, name: str, props: Dict[str, Any]) -> List[SecurityFinding]:
        findings = []
        policies = props.get("Policies", [])
        if not isinstance(policies, list):
            policies = [policies]

        for p in policies:
            if not isinstance(p, dict):
                continue
            doc = p.get("PolicyDocument", {})
            statements = doc.get("Statement", [])
            if not isinstance(statements, list):
                statements = [statements]

            for s in statements:
                if not isinstance(s, dict):
                    continue
                effect = s.get("Effect", "")
                actions = s.get("Action", [])
                resources = s.get("Resource", [])

                if isinstance(actions, str):
                    actions = [actions]
                if isinstance(resources, str):
                    resources = [resources]

                if effect == "Allow":
                    has_wildcard_action = "*" in actions or "*:*" in actions
                    has_wildcard_resource = "*" in resources

                    if has_wildcard_action and has_wildcard_resource:
                        findings.append(SecurityFinding(
                            finding_id=f"CFN-IAM-{name}-WILDCARD",
                            rule_id="SEC-CFN-03",
                            severity=Severity.CRITICAL,
                            title="CloudFormation: IAM policy grants wildcard Administrator access (*:*)",
                            description=(
                                f"Resource '{name}' defines an inline policy statement allowing Action: '*' "
                                "on Resource: '*', granting unrestricted administrative permissions."
                            ),
                            affected_resource_id=name,
                            affected_resource_type=ResourceType.IAM_ROLE,
                            remediation_recommendation="Scope IAM permissions down to least-privilege actions and explicit resource ARNs.",
                            confidence=1.0,
                            evidence_nodes=[name]
                        ))

        return findings

    def _check_rds(self, name: str, props: Dict[str, Any]) -> List[SecurityFinding]:
        findings = []
        publicly_accessible = props.get("PubliclyAccessible")
        if publicly_accessible is True or str(publicly_accessible).lower() == "true":
            findings.append(SecurityFinding(
                finding_id=f"CFN-RDS-{name}-PUBLIC",
                rule_id="SEC-CFN-04",
                severity=Severity.CRITICAL,
                title="CloudFormation: RDS database instance configured with PubliclyAccessible=true",
                description=(
                    f"Resource '{name}' sets PubliclyAccessible to true, giving the database a public DNS endpoint "
                    "resolvable from the public internet."
                ),
                affected_resource_id=name,
                affected_resource_type=ResourceType.RDS_INSTANCE,
                remediation_recommendation="Set PubliclyAccessible to false and place the database in a private DB subnet group.",
                confidence=1.0,
                evidence_nodes=[name]
            ))
        return findings
