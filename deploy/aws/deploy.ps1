# AEGIS Production Deployment Script (AWS S3 + CloudFront Serverless)
# Preserves AWS spend within free tier eligibility.

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   AEGIS AUTONOMOUS CLOUD PLATFORM — AWS DEPLOYMENT" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check AWS Credentials
Write-Host "[1/5] Verifying AWS CLI Caller Identity..." -ForegroundColor Yellow
$caller = aws sts get-caller-identity | ConvertFrom-Json
$accountId = $caller.Account
$region = if ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { "us-east-1" }
Write-Host "Connected to AWS Account: $accountId | Region: $region" -ForegroundColor Green

# 2. Build Frontend Distribution
Write-Host "[2/5] Compiling production frontend bundle..." -ForegroundColor Yellow
Push-Location "apps/web"
npm.cmd run build
Pop-Location
Write-Host "Frontend compiled successfully into apps/web/dist" -ForegroundColor Green

# 3. Deploy CloudFormation Stack
Write-Host "[3/5] Deploying CloudFormation Stack (aegis-production-stack)..." -ForegroundColor Yellow
aws cloudformation deploy `
  --template-file "deploy/aws/aegis_production_stack.yml`
  --stack-name "aegis-production-stack" `
  --capabilities CAPABILITY_NAMED_IAM `
  --parameter-overrides EnvironmentName=prod

# 4. Retrieve Outputs
Write-Host "[4/5] Retrieving CloudFront Domain & S3 Bucket..." -ForegroundColor Yellow
$stack = aws cloudformation describe-stacks --stack-name "aegis-production-stack" | ConvertFrom-Json
$outputs = $stack.Stacks[0].Outputs
$bucketName = ($outputs | Where-Object { $_.OutputKey -eq "S3BucketName" }).OutputValue
$cfUrl = ($outputs | Where-Object { $_.OutputKey -eq "CloudFrontURL" }).OutputValue

# 5. Sync Assets & Invalidate Cache
Write-Host "[5/5] Syncing assets to S3 and invalidating CDN cache..." -ForegroundColor Yellow
aws s3 sync "apps/web/dist" "s3://$bucketName" --delete
$distId = aws cloudfront list-distributions | ConvertFrom-Json | Select-Object -ExpandProperty DistributionList | Select-Object -ExpandProperty Items | Where-Object { $_.DomainName -eq $cfUrl.Replace("https://", "") } | Select-Object -ExpandProperty Id
if ($distId) {
  aws cloudfront create-invalidation --distribution-id $distId --paths "/*" | Out-Null
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   AEGIS DEPLOYED SUCCESSFULLY TO AWS PRODUCTION!" -ForegroundColor Green
Write-Host "   Live URL: $cfUrl" -ForegroundColor Cyan
Write-Host "   S3 Bucket: s3://$bucketName" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
