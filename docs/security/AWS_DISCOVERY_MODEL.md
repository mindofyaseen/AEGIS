# AEGIS — AWS Discovery Model & Telemetry Pipeline

## 1. Overview
The AEGIS Discovery Engine implements a modular, fault-tolerant telemetry collection pipeline. It queries AWS control plane APIs via Boto3 to construct the raw inventory required for graph synthesis.

---

## 2. Collector Architecture
Every collector inherits from `BaseAWSCollector` in `services/aws_discovery/base.py`:

```python
class BaseAWSCollector(ABC):
    def __init__(self, session: Optional[boto3.Session] = None, region_name: str = "us-east-1"):
        self.session = session or boto3.Session()
        self.region_name = region_name
        self.collector_name = self.__class__.__name__

    @abstractmethod
    def collect(self) -> CollectorRunReport:
        pass
```

### Fault Isolation & Graceful Degradation
If a collector encounters an `AccessDeniedException` (e.g. insufficient IAM privileges) or an API rate limit (`ThrottlingException`), the collector catches the exception, records the specific failure reason in a `CollectorRunReport`, and returns a `PARTIAL` or `FAILED` status. It does not terminate the overall discovery pipeline.

The `ContextCompletenessEngine` subsequently detects this collector failure and deterministically down-ranks the investigation verdict to `INSUFFICIENT_CONTEXT`.

---

## 3. Discovered Services & Collector Implementations

### 3.1 `EC2Collector`
- **Scope:** VPCs, Subnets, Route Tables, Internet Gateways, NAT Gateways, Security Groups, EC2 Instances.
- **Key Relationships Extracted:**
  - `VPC CONTAINS Subnet`
  - `Subnet CONTAINS Instance`
  - `RouteTable ROUTES_TO InternetGateway`
  - `Instance ASSOCIATED_WITH SecurityGroup`
- **Evidence Attached:** `ec2:Describe*` call names, confidence = 1.0.

### 3.2 `IAMCollector`
- **Scope:** Roles, Inline Policies, Managed Policies, Instance Profiles, Assume Role Trust Documents.
- **Key Relationships Extracted:**
  - `Instance ASSUMES Role`
  - `Role HAS_POLICY Policy`
  - `Role GRANTS TargetResource`
- **Evidence Attached:** `iam:GetAccountAuthorizationDetails` call name, confidence = 1.0.

### 3.3 `S3Collector`
- **Scope:** Bucket inventory, Public Access Block configurations, Bucket Encryption, Bucket Policies.
- **Key Relationships Extracted:**
  - Target resource indexing for crown-jewel data stores.
- **Evidence Attached:** `s3:GetPublicAccessBlock`, `s3:GetBucketPolicy`, confidence = 1.0.

### 3.4 `Orchestrator` (`DiscoveryOrchestrator`)
- Coordinates concurrent execution of all collectors.
- Merges discovered resources and relationships into a unified JSON topology payload.
- Provides automatic fallback to synthetic baseline fixtures when AWS credentials are in sandbox simulation mode.
