# AEGIS — Container Security Architecture
## Amazon ECR Discovery, Image Vulnerability Scanning & Dockerfile Governance

**Document Version:** 3.0-PHASE-0  
**Status:** Container Security Specification  

---

## 1. Container Security Lifecycle

AEGIS integrates container security seamlessly across the build, registry, and deployment lifecycle:

```
+-----------------------------------------------------------------------------------+
|                        AEGIS CONTAINER SECURITY PIPELINE                          |
|                                                                                   |
|  1. REGISTRY DISCOVERY (Amazon ECR)                                               |
|     * Boto3 enumerates ECR Repositories, Image Tags, and Push Timestamps          |
|     * Fetches native ECR Enhanced Scanning results (AWS Inspector / Clair)        |
|                                     │                                             |
|                                     ▼                                             |
|  2. IMAGE VULNERABILITY & SBOM SCANNING (Trivy / Syft / Grype)                    |
|     * Scans OS packages (Alpine APK, Debian DPKG, RedHat RPM)                     |
|     * Scans language dependencies (npm, pip, go mod, cargo)                       |
|     * Generates CycloneDX SBOM for software supply chain transparency             |
|                                     │                                             |
|                                     ▼                                             |
|  3. DOCKERFILE MISCONFIGURATION AUDIT                                             |
|     * Prohibits `USER root` / `USER 0` execution                                  |
|     * Detects unpinned base images (e.g. `FROM node:latest`)                      |
|     * Checks for embedded secrets or sensitive build arguments (`ARG AWS_KEY`)    |
|                                     │                                             |
|                                     ▼                                             |
|  4. KNOWLEDGE GRAPH TOPOLOGY FUSION                                               |
|     * Links discovered containers to deployed ECS tasks and EKS pods              |
|     * Graph Edge: `ContainerImage --[DEPLOYED_ON]--> EcsTask / EksPod`            |
|     * Elevates Attack Path severity if a public-facing compute node runs an       |
|       image with a Critical Known Exploited Vulnerability (KEV)                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Cost-Effective Scanning Strategy

Downloading multi-gigabyte container images can introduce significant data transfer costs. AEGIS employs a 3-tier cost-optimized scanning model:

1. **Tier 1: Native ECR Metadata Harvesting (Zero Bandwidth Cost):**
   - AEGIS first queries `ecr:DescribeImageScanFindings`. If the customer already has ECR scanning enabled, AEGIS ingests the findings with zero image download and zero compute charges.
2. **Tier 2: Remote Manifest & Layer Inspection:**
   - For un-scanned repositories, AEGIS queries the OCI registry manifest and inspects layer hashes without pulling the full image.
3. **Tier 3: In-Account Ephemeral Pull (Customer Authorized):**
   - Pulls only specifically requested images into an ephemeral container runner within the same AWS region (avoiding cross-region data transfer fees).
