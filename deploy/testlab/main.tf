# AEGIS Disposable AWS Test Lab Fixture (Terraform)
# Deploys minimal isolated test resources ($0.022/hr, 4-hour max TTL)

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  default_tags {
    tags = {
      AEGIS-Scope       = "TestLab"
      AEGIS-Environment = "IsolatedSandbox"
      AEGIS-TTL-Hours   = "4"
    }
  }
}

# 1. Isolated Test VPC
resource "aws_vpc" "test_vpc" {
  cidr_block           = "10.99.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "aegis-testlab-vpc"
  }
}

# 2. Public Subnet
resource "aws_subnet" "test_public_subnet" {
  vpc_id                  = aws_vpc.test_vpc.id
  cidr_block              = "10.99.1.0/24"
  map_public_ip_on_launch = true
  tags = {
    Name = "aegis-testlab-public-subnet"
  }
}

# 3. Insecure Security Group (Open Port 22 and 80 to 0.0.0.0/0)
resource "aws_security_group" "test_insecure_sg" {
  name        = "aegis-testlab-insecure-sg"
  description = "Deliberately open test security group"
  vpc_id      = aws_vpc.test_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 4. Unencrypted S3 Bucket with Public Read ACL Fixture
resource "aws_s3_bucket" "test_public_bucket" {
  bucket        = "aegis-testlab-public-vault-237657481511"
  force_destroy = true
}

# 5. Overprivileged IAM Role Fixture
resource "aws_iam_role" "test_overprivileged_role" {
  name = "aegis-testlab-overprivileged-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "admin_attach" {
  role       = aws_iam_role.test_overprivileged_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
