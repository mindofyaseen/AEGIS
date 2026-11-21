# AEGIS — Stack Upgrade Guide
## Safe In-Place Updates Without Workload Interruption

---

## 1. Upgrade Philosophy

Upgrading AEGIS updates the AEGIS support runtime (Lambda code, Bedrock model selection, or web console bundle) **without altering existing customer infrastructure**.

Because AEGIS operates with zero mutation permissions, updating the CloudFormation stack carries zero risk of modifying customer EC2, VPC, S3, or RDS workloads.

---

## 2. In-Place CloudFormation Stack Update

To upgrade your deployment:

1. Obtain the updated `aegis_customer_deployable_stack.yml` template.
2. Execute the CloudFormation update command:

```bash
aws cloudformation deploy \
  --template-file deploy/aws/aegis_customer_deployable_stack.yml \
  --stack-name aegis-devsecops-engineer \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
      EnvironmentName=prod \
      BedrockModelId=anthropic.claude-haiku-4-5-20251001-v1:0
```

3. Update the static web console bundle in S3:
```bash
aws s3 sync apps/web/dist s3://<AegisCustomerWebBucket-Name> --delete
aws cloudfront create-invalidation --distribution-id <AegisConsoleCDN-Id> --paths "/*"
```
