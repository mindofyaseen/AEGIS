# AEGIS — Clean Uninstallation & Teardown Guide

This guide details the procedure for completely removing AEGIS from an AWS account, leaving zero orphaned resources or recurring charges.

---

## 1. Clean Teardown Guarantee

Because AEGIS deploys all runtime resources within a single managed AWS CloudFormation stack under the dedicated prefix `aegis-*`, deleting the stack cleanly deletes all 5 AEGIS resources:
- Scoped Inspector IAM Role deleted.
- Lambda execution engine deleted.
- Lambda Function URL deleted.
- CloudFront distribution disabled and deleted.
- S3 console bucket emptied and deleted.

**Zero impact on existing infrastructure:** Deleting AEGIS does **not** touch your existing VPCs, EC2 instances, databases, or application data.

---

## 2. One-Command Uninstallation

### Step 1: Empty the Customer S3 Console Bucket
AWS CloudFormation requires S3 buckets to be empty before deletion:
```bash
# Retrieve bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name aegis-devsecops-engineer \
  --query "Stacks[0].Outputs[?OutputKey=='S3StorageBucket'].OutputValue" \
  --output text)

# Empty bucket
aws s3 rm s3://$BUCKET_NAME --recursive
```

### Step 2: Delete CloudFormation Stack
```bash
aws cloudformation delete-stack --stack-name aegis-devsecops-engineer
```

### Step 3: Verify Complete Removal
```bash
aws cloudformation wait stack-delete-complete --stack-name aegis-devsecops-engineer
echo "AEGIS has been completely uninstalled from your AWS account."
```
