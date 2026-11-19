# AEGIS — Multi-Hop Attack Path Analysis Methodology

## 1. Overview
In modern cloud architectures, compromise rarely occurs via a single isolated resource. Attackers exploit chains of configurations: an exposed management port on an edge bastion host enables initial access, after which the attacker leverages the instance's attached IAM role to laterally traverse to internal object stores or relational databases.

AEGIS implements a deterministic graph traversal algorithm via `AttackPathTracer` in `services/attack_path/tracer.py` to identify and document these multi-hop lateral movement vectors.

---

## 2. Traversal Algorithm

```
Algorithm: Multi-Hop Attack Path Tracing (BFS Traversal)
Input: MultiDiGraph G = (V, E), Public Ingress Nodes V_ingress, Target Assets V_target
Output: List of Evidenced Attack Paths

1. For each entry_node in V_ingress:
2.    Queue Q = [(entry_node, [entry_node])]
3.    Visited = {entry_node}
4.    While Q is not empty:
5.        current_node, current_path = Q.pop(0)
6.        If current_node in V_target and len(current_path) > 1:
7.            Construct AttackPath object with hops, evidence, and narrative.
8.            Add to AttackPaths list.
9.            Continue
10.       For each neighbor in G.successors(current_node):
11.           If neighbor not in current_path:
12.               Check edge relationship validity (ROUTES_TO, ASSOCIATED_WITH, ASSUMES, GRANTS)
13.               Q.append((neighbor, current_path + [neighbor]))
14. Return AttackPaths
```

---

## 3. Real-World Benchmark Case Study: The Bastion Pivot

```
[INTERNET (0.0.0.0/0)]
        |
        v  (Ingress Port 22 SSH)
[Internet Gateway: igw-01234567]
        |
        v  (ROUTES_TO)
[Subnet DMZ: subnet-pub-1]
        |
        v  (CONTAINS)
[EC2 Bastion Host: i-0a1b2c3d4e5f67890]
        |
        v  (ASSOCIATED_WITH: sg-bastion-public)
        |
        v  (ASSUMES via Instance Profile)
[IAM Role: AegisBastionEC2Role (Action: *, Resource: *)]
        |
        v  (GRANTS Wildcard Access)
[S3 Bucket: corporate-customer-financial-records]  <--- CROWN JEWEL DATA EXFILTRATION
```

### Generated Attack Narrative
> *"An external attacker on the public internet initiates an unauthorized connection through Internet Gateway (igw-01234567) to EC2 Instance (i-0a1b2c3d4e5f67890) on port 22 (SSH), permitted by overly permissive Security Group (sg-bastion-public) with 0.0.0.0/0 ingress. Once initial access is achieved, the attacker assumes attached IAM Role (AegisBastionEC2Role) via instance metadata service (IMDS). Because this role grants administrative wildcard permissions ('Action: *', 'Resource: *'), the attacker can directly enumerate and exfiltrate confidential customer records from target S3 Bucket (corporate-customer-financial-records)."*

---

## 4. Blast Radius Calculation
For any compromised intermediate node, AEGIS calculates the reachable subgraph:
$$\text{BlastRadius}(v) = |\{u \in V \mid \text{PathExists}(v, u)\}|$$
This provides security teams with an immediate metric of lateral exposure.
