# AEGIS — 3-Minute Video Demonstration Script & Walkthrough

## Target Duration: Under 3 Minutes (180 Seconds)
**Platform:** AWS Builder Center Hackathon: *"Agents, your rules: Bedrock Managed Agents build"*  
**Demonstrator:** Muhammad Yaseen  
**Video Output URL:** YouTube / Vimeo (Public)

---

## Storyboard & Timing Breakdown

### Segment 1: The Problem & Vision (0:00 - 0:35 | 35s)
- **Visual:** Open on title card "AEGIS — Autonomous Cloud Security Platform" transitioning to AWS Builder Center and a terminal showing a Terraform PR modifying a security group.
- **Voiceover:**
  > *"Welcome to AEGIS, an autonomous cloud security and DevSecOps engineering platform built on Amazon Bedrock Managed Agents. Modern engineering teams push hundreds of Infrastructure as Code pull requests every day. But when a misconfiguration opens port 22 or creates a wildcard IAM role, traditional static linters lack the topological context to know if an attacker can reach your sensitive databases. Worse, if discovery telemetry fails, traditional scanners report zero errors—the dangerous 'Silent Green' blind spot. AEGIS changes this forever."*

### Segment 2: Architecture & The Bedrock AgentCore Engine (0:35 - 1:05 | 30s)
- **Visual:** Show System Architecture diagram in `docs/architecture/SYSTEM_ARCHITECTURE.md`, highlighting the Bedrock AgentCore harness, Boto3 read-only discovery collectors, and NetworkX knowledge graph.
- **Voiceover:**
  > *"AEGIS adheres strictly to the hackathon's core mandate: exactly one defined job. It performs read-only, evidence-backed security investigations. It discovers VPCs, Subnets, Security Groups, IAM Roles, and S3 buckets, building an in-memory directed knowledge graph. Crucially, AEGIS decouples LLM reasoning from policy arbitration: our deterministic Context Completeness Gate evaluates evidence freshness and completeness before any safety determination is permitted."*

### Segment 3: Live Investigation & Multi-Hop Attack Path (1:05 - 1:45 | 40s)
- **Visual:** Switch to live AEGIS Web Dashboard running locally.
- **Actions:**
  1. Click **"Production Bastion Attack Path (BLOCK)"**.
  2. Point out the glowing Red **BLOCK** verdict card: *"BLOCK — Merge & Deployment Prevented"*.
  3. Show the interactive topology map: trace the red pulsing line from **Internet Gateway** $\to$ **Bastion Security Group** (port 22 open to 0.0.0.0/0) $\to$ **Bastion EC2** $\to$ **Administrator IAM Role** (`Action: *`, `Resource: *`) $\to$ **Customer Financial Records S3 Bucket**.
- **Voiceover:**
  > *"Here is our live Executive Dashboard. In Scenario 1, a proposed Terraform change exposes port 22 to the world. AEGIS constructs the graph and traces a multi-hop lateral attack path straight from the internet to our crown-jewel customer database. Because of this critical attack vector, the policy engine deterministically issues a BLOCK verdict."*

### Segment 4: Rule 14 Remediation Planner (1:45 - 2:15 | 30s)
- **Visual:** Scroll down to the **Remediation Planner** drawer.
- **Actions:**
  1. Highlight the proposed minimal Terraform diff replacing `0.0.0.0/0` with corporate CIDR `198.51.100.0/24`.
  2. Click the copy button on the single-line AWS CLI repair command.
  3. Expand the deterministic rollback plan.
  4. Check off two items on the pre/post verification checklist.
- **Voiceover:**
  > *"Under Governance Rule 14, AEGIS never blindly mutates production. Instead, it synthesizes precision remediation packages: a minimal Terraform diff, single-line AWS CLI repair commands, an emergency rollback plan, and interactive verification checklists to confirm resolution without service regression."*

### Segment 5: The Completeness Gate & Ready for Review (2:15 - 2:40 | 25s)
- **Visual:**
  1. Click **"Incomplete Collector Telemetry (INSUFFICIENT_CONTEXT)"**. Point out the amber badge: *"INSUFFICIENT CONTEXT — Evaluation Refused. Telemetry Completeness: 40%"*.
  2. Click **"Hardened Enterprise Subnet (READY_FOR_HUMAN_REVIEW)"**. Point out the emerald badge: *"READY FOR HUMAN REVIEW. Completeness: 100%"*.
- **Voiceover:**
  > *"Now watch our Context Completeness Gate in action. If our IAM collector fails, AEGIS refuses to guess—it issues an INSUFFICIENT_CONTEXT verdict, eliminating silent false-greens. When all evidence is present and hardened, it certifies READY FOR HUMAN REVIEW."*

### Segment 6: Adversarial Suite & Closing (2:40 - 3:00 | 20s)
- **Visual:** Switch to **Adversarial Suite** tab showing 14/14 tests green. Show terminal running `python -m pytest tests/ -v` with 28/28 passed in 2.3 seconds.
- **Voiceover:**
  > *"Finally, AEGIS was red-teamed against 14 adversarial attack vectors—including prompt injections embedded in Terraform comments, tags, and logs—passing 100% of tests. Fast, deterministic, and built on Bedrock Managed Agents. Thank you for watching AEGIS!"*
- **Visual:** Closing slide with GitHub repo link `github.com/mindofyaseen/aegis` and AWS Builder Center logo.
