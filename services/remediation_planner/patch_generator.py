"""
AEGIS Remediation Planner & Patch Generator.
Strictly implements Rule 14:
- Generates minimal, compatible remediation diffs (Terraform & AWS CLI).
- Never mutates state or executes changes (zero-mutation).
- Provides deterministic rollback instructions.
- Provides blast radius estimations and verification test checklists.
"""

from typing import List, Optional
from backend.models import RemediationPatch, SecurityFinding, Severity


class RemediationPlanner:
    """
    Synthesizes compliant, verifiable remediation plans for detected security findings.
    """

    def generate_patches(self, findings: List[SecurityFinding]) -> List[RemediationPatch]:
        """
        Generates remediation patches for all actionable findings.
        """
        patches: List[RemediationPatch] = []
        for finding in findings:
            patch = self.generate_patch_for_finding(finding)
            if patch:
                patches.append(patch)
        return patches

    def generate_patch_for_finding(self, finding: SecurityFinding) -> Optional[RemediationPatch]:
        rule_id = finding.rule_id
        target_id = finding.affected_resource_id

        if rule_id in ("SEC-NET-01", "SEC-TF-01"):
            return RemediationPatch(
                target_resource_id=target_id,
                suggested_action="Restrict Security Group ingress to authorized corporate CIDR or VPN gateway",
                terraform_patch=f"""# Remediation for {target_id} ({rule_id})
# Replace 0.0.0.0/0 wildcard with corporate CIDR
resource "aws_security_group_rule" "restricted_management_ingress" {{
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["198.51.100.0/24"] # Corporate bastion/VPN egress only
  security_group_id = "{target_id}"
  description       = "Compliant administrative access restricted to corporate IP range"
}}""",
                cli_command_preview=(
                    f"aws ec2 revoke-security-group-ingress --group-id {target_id} "
                    f"--protocol tcp --port 22 --cidr 0.0.0.0/0\n"
                    f"aws ec2 authorize-security-group-ingress --group-id {target_id} "
                    f"--protocol tcp --port 22 --cidr 198.51.100.0/24"
                ),
                rollback_plan=(
                    f"Rollback command if emergency recovery is required:\n"
                    f"aws ec2 authorize-security-group-ingress --group-id {target_id} --protocol tcp --port 22 --cidr 0.0.0.0/0\n"
                    f"Note: Execute strictly within break-glass incident window."
                ),
                verification_steps=[
                    f"1. Run 'nmap -Pn -p 22 <public_ip>' from external network; verify port 22 reports 'filtered' or 'closed'.",
                    f"2. Confirm SSH connectivity succeeds when initiated through authorized corporate VPN (198.51.100.0/24).",
                    f"3. Verify VPC Flow Logs show zero ACCEPT packets on port 22 from non-corporate origins.",
                ],
            )

        elif rule_id == "SEC-IAM-01":
            return RemediationPatch(
                target_resource_id=target_id,
                suggested_action="Scope down wildcard Action: * and Resource: * to least-privilege specific actions",
                terraform_patch=f"""# Remediation for {target_id} ({rule_id})
# Scoped policy replacing Action: * / Resource: *
data "aws_iam_policy_document" "scoped_least_privilege" {{
  statement {{
    sid       = "ScopedOperationalAccess"
    effect    = "Allow"
    actions   = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::corporate-customer-financial-records",
      "arn:aws:s3:::corporate-customer-financial-records/*"
    ]
  }}
}}

resource "aws_iam_role_policy" "scoped_policy" {{
  name   = "AEGIS-Scoped-LeastPrivilege"
  role   = "{target_id}"
  policy = data.aws_iam_policy_document.scoped_least_privilege.json
}}""",
                cli_command_preview=(
                    f"aws iam put-role-policy --role-name {target_id} "
                    f"--policy-name AEGIS-Scoped-Policy --policy-document file://scoped-policy.json"
                ),
                rollback_plan=(
                    f"Rollback command:\n"
                    f"aws iam delete-role-policy --role-name {target_id} --policy-name AEGIS-Scoped-Policy\n"
                    f"aws iam attach-role-policy --role-name {target_id} --policy-arn arn:aws:iam::aws:policy/AdministratorAccess"
                ),
                verification_steps=[
                    f"1. Execute AWS IAM Access Analyzer validation on policy JSON to confirm zero high-risk findings.",
                    f"2. Test workload application requests against target S3 bucket to verify functional read access.",
                    f"3. Attempt unauthorized action (e.g. s3:DeleteBucket or iam:CreateUser) to confirm AccessDenied.",
                ],
            )

        elif rule_id == "SEC-S3-01":
            return RemediationPatch(
                target_resource_id=target_id,
                suggested_action="Enforce S3 Public Access Block configuration across all 4 controls",
                terraform_patch=f"""# Remediation for {target_id} ({rule_id})
resource "aws_s3_bucket_public_access_block" "enforce_block" {{
  bucket = "{target_id}"

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}}""",
                cli_command_preview=(
                    f"aws s3control put-public-access-block --account-id 237657481511 "
                    f"--public-access-block-configuration "
                    f"'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'"
                ),
                rollback_plan=(
                    f"Rollback command:\n"
                    f"aws s3api put-public-access-block --bucket {target_id} "
                    f"--public-access-block-configuration 'BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false'"
                ),
                verification_steps=[
                    f"1. Call 'aws s3api get-public-access-block --bucket {target_id}' and assert all 4 fields are true.",
                    f"2. Attempt unauthenticated anonymous HTTP GET request to object URL; verify HTTP 403 Forbidden.",
                ],
            )

        elif rule_id == "SEC-DB-01":
            return RemediationPatch(
                target_resource_id=target_id,
                suggested_action="Disable PubliclyAccessible flag and associate RDS instance exclusively with private subnets",
                terraform_patch=f"""# Remediation for {target_id} ({rule_id})
resource "aws_db_instance" "remediated_db" {{
  identifier          = "{target_id}"
  publicly_accessible = false
  # Ensure DB subnet group references private subnets only
}}""",
                cli_command_preview=(
                    f"aws rds modify-db-instance --db-instance-identifier {target_id} "
                    f"--no-publicly-accessible --apply-immediately"
                ),
                rollback_plan=(
                    f"Rollback command:\n"
                    f"aws rds modify-db-instance --db-instance-identifier {target_id} --publicly-accessible --apply-immediately"
                ),
                verification_steps=[
                    f"1. Call 'aws rds describe-db-instances --db-instance-identifier {target_id}' and assert PubliclyAccessible is False.",
                    f"2. Attempt external DNS resolution and TCP handshake to RDS endpoint from public internet; verify connection timed out.",
                    f"3. Confirm backend microservice in private VPC connects seamlessly via internal private IP.",
                ],
            )

        return None
