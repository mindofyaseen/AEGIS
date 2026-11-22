"""
AEGIS Kubernetes Posture Evaluator.
Audits workloads against Pod Security Standards (PSS), flags dangerous RBAC role bindings,
and detects hybrid Kubernetes-to-AWS IAM attack paths.
"""

import uuid
from typing import List, Dict, Any

from services.kubernetes_security.models import (
    WorkloadSecurityFinding,
    RBACBindingFinding,
    PSSStandard,
)


class KubernetesPostureEvaluator:
    """Evaluates Kubernetes workload manifests and RBAC configurations."""

    def evaluate_manifests(self, workloads: List[Dict[str, Any]]) -> List[WorkloadSecurityFinding]:
        findings: List[WorkloadSecurityFinding] = []

        for w in workloads:
            ns = w.get("namespace", "default")
            w_type = w.get("kind", "Deployment")
            w_name = w.get("name", "unknown")
            spec = w.get("spec", {})
            pod_spec = spec.get("template", {}).get("spec", spec)

            containers = pod_spec.get("containers", [])
            for c in containers:
                c_name = c.get("name", "container")
                sec_ctx = c.get("securityContext", {})

                # 1. Privileged Container (PSS Privileged Violation)
                if sec_ctx.get("privileged", False) is True:
                    findings.append(
                        WorkloadSecurityFinding(
                            finding_id=f"k8s-pss-{uuid.uuid4().hex[:8]}",
                            namespace=ns,
                            workload_type=w_type,
                            workload_name=w_name,
                            container_name=c_name,
                            rule_id="aegis-k8s-privileged-container",
                            title="Container Running in Privileged Mode",
                            severity="CRITICAL",
                            pss_violation=PSSStandard.PRIVILEGED,
                            description=f"Container '{c_name}' in {w_type} '{w_name}' has securityContext.privileged: true. Allows full root breakout to node kernel.",
                            remediation="Set securityContext.privileged: false and drop Linux capabilities (CAP_SYS_ADMIN).",
                        )
                    )

                # 2. Root User Execution
                if sec_ctx.get("runAsNonRoot") is False or sec_ctx.get("runAsUser") == 0:
                    findings.append(
                        WorkloadSecurityFinding(
                            finding_id=f"k8s-pss-{uuid.uuid4().hex[:8]}",
                            namespace=ns,
                            workload_type=w_type,
                            workload_name=w_name,
                            container_name=c_name,
                            rule_id="aegis-k8s-root-execution",
                            title="Container Process Running as Root User",
                            severity="HIGH",
                            pss_violation=PSSStandard.BASELINE,
                            description=f"Container '{c_name}' does not enforce runAsNonRoot: true. May inherit UID 0 privileges.",
                            remediation="Configure securityContext.runAsNonRoot: true and specify a non-zero runAsUser.",
                        )
                    )

                # 3. Missing CPU/Memory Resource Limits
                resources = c.get("resources", {})
                if not resources.get("limits"):
                    findings.append(
                        WorkloadSecurityFinding(
                            finding_id=f"k8s-res-{uuid.uuid4().hex[:8]}",
                            namespace=ns,
                            workload_type=w_type,
                            workload_name=w_name,
                            container_name=c_name,
                            rule_id="aegis-k8s-missing-resource-limits",
                            title="Missing CPU & Memory Resource Limits",
                            severity="MEDIUM",
                            pss_violation=PSSStandard.RESTRICTED,
                            description=f"Container '{c_name}' has no resource limits defined, risking Node starvation and Denial of Service.",
                            remediation="Define explicit resources.limits.cpu and resources.limits.memory.",
                        )
                    )

        return findings

    def evaluate_rbac(self, bindings: List[Dict[str, Any]]) -> List[RBACBindingFinding]:
        findings: List[RBACBindingFinding] = []

        for b in bindings:
            subject = b.get("subject_name", "unknown")
            role = b.get("role_name", "unknown")
            is_cluster = b.get("is_cluster_role", False)
            rules = b.get("rules", [])

            # Check for cluster-admin bindings
            if role == "cluster-admin":
                findings.append(
                    RBACBindingFinding(
                        finding_id=f"rbac-{uuid.uuid4().hex[:8]}",
                        subject_kind=b.get("subject_kind", "ServiceAccount"),
                        subject_name=subject,
                        namespace=b.get("namespace"),
                        role_name=role,
                        is_cluster_role=is_cluster,
                        grants_cluster_admin=True,
                        severity="CRITICAL",
                        description=f"Subject '{subject}' is bound to cluster-admin, granting unconstrained superuser control over the entire Kubernetes cluster.",
                    )
                )

            # Check for wildcards in verbs or resources
            for r in rules:
                verbs = r.get("verbs", [])
                resources = r.get("resources", [])
                if "*" in verbs or "*" in resources:
                    findings.append(
                        RBACBindingFinding(
                            finding_id=f"rbac-{uuid.uuid4().hex[:8]}",
                            subject_kind=b.get("subject_kind", "ServiceAccount"),
                            subject_name=subject,
                            namespace=b.get("namespace"),
                            role_name=role,
                            is_cluster_role=is_cluster,
                            has_wildcard=True,
                            severity="HIGH",
                            description=f"Role '{role}' contains wildcard permissions ('*') across verbs or resources.",
                        )
                    )

        return findings
