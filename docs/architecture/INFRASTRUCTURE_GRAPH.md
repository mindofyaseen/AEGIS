# AEGIS — Infrastructure Knowledge Graph Specification

## 1. Overview
The AEGIS Infrastructure Knowledge Graph is a multi-directed, attributed graph ($G = (V, E, \mu, \nu)$) representing all discovered AWS cloud resources as vertices ($V$) and their architectural and access relationships as directed edges ($E$).

Every node and edge carries verifiable evidence attributes:
- $\mu(v)$: Node configuration payload, AWS ARN, account ID, region, and discovery collector provenance.
- $\nu(e)$: Relationship type, trust level, and empirical verification data.

---

## 2. Vertex Taxonomy ($V$)

```
+-----------------------------------------------------------------+
|                       AWS Resource Nodes                        |
+-----------------------------------------------------------------+
| AWS::EC2::VPC                 | Virtual Private Cloud boundary  |
| AWS::EC2::Subnet              | Public or Private subnet CIDR   |
| AWS::EC2::RouteTable          | Ingress / Egress route target   |
| AWS::EC2::InternetGateway     | Public internet border gateway  |
| AWS::EC2::NatGateway          | Outbound egress translation     |
| AWS::EC2::SecurityGroup       | Stateful packet filter firewall |
| AWS::EC2::Instance            | Compute workload / EC2 instance |
| AWS::IAM::Role                | IAM principal assumed by compute|
| AWS::IAM::Policy              | Permission grants & statements  |
| AWS::S3::Bucket               | Cloud object storage container  |
| AWS::RDS::DBInstance          | Relational database instance    |
+-----------------------------------------------------------------+
```

---

## 3. Directed Edge Taxonomy ($E$)

| Edge Type | Source Node | Target Node | Semantics |
| :--- | :--- | :--- | :--- |
| `CONTAINS` | VPC | Subnet | Structural containment |
| `CONTAINS` | Subnet | EC2 Instance | Workload subnet placement |
| `ROUTES_TO` | Route Table | Internet Gateway | Route table public routing target |
| `ROUTES_TO` | Internet Gateway | Subnet | Ingress routing to public DMZ |
| `ASSOCIATED_WITH` | EC2 Instance | Security Group | Firewall attachment |
| `ASSUMES` | EC2 Instance | IAM Role | Workload identity via Instance Profile |
| `GRANTS` | IAM Role | S3 Bucket | Policy access grants to storage container |
| `DEPENDS_ON` | Resource A | Resource B | Inter-resource architectural dependency |

---

## 4. Graph Construction Algorithm
1. **Node Insertion:** Discovery collectors harvest AWS API payloads. Each item is validated against Pydantic schema `Resource` and added to the graph with its cryptographic hash and evidence block.
2. **Deterministic Edge Resolution:**
   - VPC-to-Subnet: Inferred from Subnet `VpcId`.
   - Subnet-to-Instance: Inferred from Instance `SubnetId`.
   - Instance-to-SG: Inferred from `SecurityGroupIds` list.
   - Instance-to-Role: Inferred from `IamInstanceProfile.Arn`.
   - Role-to-Target: Extracted from IAM policy statement `Resource` ARNs matching known bucket or database ARNs.
3. **Ingress Identification:** Graph engine identifies public ingress nodes ($V_{\text{ingress}}$) by checking Internet Gateways and Security Groups permitting `0.0.0.0/0` ingress.
4. **Crown Jewel Identification:** Assets tagged with confidential tags or storing sensitive customer databases are indexed as target assets ($V_{\text{target}}$).

---

## 5. Cytoscape Serialization
The graph engine exports Cytoscape.js compatible JSON structures via `to_cytoscape_elements()`:
```json
{
  "elements": [
    {
      "data": {
        "id": "i-0a1b2c3d4e5f67890",
        "label": "Bastion Host",
        "type": "AWS::EC2::Instance",
        "is_crown_jewel": false
      }
    },
    {
      "data": {
        "source": "i-0a1b2c3d4e5f67890",
        "target": "AegisBastionEC2Role",
        "label": "ASSUMES"
      }
    }
  ]
}
```
This enables both WebGL/SVG visualization and programmatic path tracing in sub-millisecond execution times.
