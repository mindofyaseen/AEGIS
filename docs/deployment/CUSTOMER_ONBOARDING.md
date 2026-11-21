# AEGIS — Customer Onboarding Guide
## First-Time User Journey from Deployment to Live Investigation

---

## 1. The 5-Minute Onboarding Flow

```
[ Step 1: Deploy Stack ]
         │
         ▼
[ Step 2: Open Private Console ] ──► (https://<distribution-id>.cloudfront.net)
         │
         ▼
[ Step 3: Run Initial Discovery ] ──► ("Discover My Infrastructure")
         │
         ▼
[ Step 4: Review Completeness Gate ] ──► (Verify 100% telemetry coverage)
         │
         ▼
[ Step 5: Interact with AI DevSecOps Agent ] ──► (Ask questions in natural language)
```

---

## 2. First-Time Verification Checklist

1. **Verify Stack Health:**
   - Open your private AEGIS Web Console URL provided in the CloudFormation Outputs.
   - Confirm that the top navigation header displays your AWS Account ID and Region with a green status indicator (`Harness active`).
2. **Execute First Discovery:**
   - Click **"+ Connect AWS"** $\to$ **1-Click Discovery**.
   - AEGIS runs the read-only collectors against your existing VPCs, EC2 instances, and IAM roles.
   - Discovered resources populate the **3D Spatial Infrastructure Explorer**.
3. **Inspect First Security Investigation:**
   - Navigate to **Executive Overview** to review the primary verdict banner:
     - `BLOCK`: Insecure configurations or attack paths detected.
     - `INSUFFICIENT_CONTEXT`: Telemetry missing; check collector logs.
     - `READY_FOR_HUMAN_REVIEW`: Hardened architecture with zero critical findings.
4. **Natural Language Interaction:**
   - Navigate to the **Agent Command Center** and type:
     *"Analyze my public perimeter and show me any lateral movement attack paths."*
   - Observe the agent explain the findings and reference Rule 14 remediation diffs.
