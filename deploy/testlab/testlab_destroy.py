"""
AEGIS Disposable Test Lab Automated Destruction Script.
Executes complete Boto3 teardown of all resources tagged 'AEGIS-Scope=TestLab'.
Runs on EventBridge cron to guarantee strict budgetary caps ($10 budget limit).
"""

import sys
import boto3
from typing import Dict, Any


def teardown_test_lab(region: str = "us-east-1") -> Dict[str, Any]:
    print(f"[*] Commencing automated teardown of AEGIS Test Lab in {region}...")
    s3 = boto3.client("s3", region_name=region)
    ec2 = boto3.client("ec2", region_name=region)
    iam = boto3.client("iam")

    cleaned_resources = []

    # 1. Clean S3 Test Buckets
    try:
        buckets = s3.list_buckets().get("Buckets", [])
        for b in buckets:
            name = b["Name"]
            if name.startswith("aegis-testlab-"):
                # Empty objects
                objs = s3.list_objects_v2(Bucket=name).get("Contents", [])
                for o in objs:
                    s3.delete_object(Bucket=name, Key=o["Key"])
                s3.delete_bucket(Bucket=name)
                cleaned_resources.append(f"s3:{name}")
                print(f"[+] Deleted test S3 bucket: {name}")
    except Exception as e:
        print(f"[!] S3 cleanup notice: {e}")

    # 2. Terminate EC2 instances tagged TestLab
    try:
        insts = ec2.describe_instances(
            Filters=[{"Name": "tag:AEGIS-Scope", "Values": ["TestLab"]}]
        )
        for res in insts.get("Reservations", []):
            for inst in res.get("Instances", []):
                i_id = inst["InstanceId"]
                ec2.terminate_instances(InstanceIds=[i_id])
                cleaned_resources.append(f"ec2:{i_id}")
                print(f"[+] Terminated test EC2 instance: {i_id}")
    except Exception as e:
        print(f"[!] EC2 cleanup notice: {e}")

    # 3. Clean IAM Role
    try:
        role_name = "aegis-testlab-overprivileged-role"
        iam.detach_role_policy(RoleName=role_name, PolicyArn="arn:aws:iam::aws:policy/AdministratorAccess")
        iam.delete_role(RoleName=role_name)
        cleaned_resources.append(f"iam:{role_name}")
        print(f"[+] Deleted test IAM role: {role_name}")
    except Exception as e:
        print(f"[!] IAM cleanup notice: {e}")

    print(f"[*] Teardown complete. Total resources purged: {len(cleaned_resources)}")
    return {"status": "SUCCESS", "purged_count": len(cleaned_resources), "resources": cleaned_resources}


if __name__ == "__main__":
    teardown_test_lab()
