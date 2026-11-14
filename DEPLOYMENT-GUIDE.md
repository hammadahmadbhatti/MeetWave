# MeetWave - AWS Deployment Guide & Cost Evaluation

## Cost Evaluation

### Option A: Minimal Launch (0-1,000 users) - ~$65-85/month

This is for MVP / early launch. Enough to validate the product.

| Service | Spec | Monthly Cost |
|---------|------|-------------|
| ECS Fargate (Backend) | 1x 0.25 vCPU, 0.5GB ARM (Spot) | ~$3.50 |
| ECS Fargate (Frontend) | 1x 0.25 vCPU, 0.5GB ARM (Spot) | ~$3.50 |
| RDS PostgreSQL | db.t4g.micro (2 vCPU, 1GB), Single-AZ | ~$13 |
| ElastiCache Redis | cache.t4g.micro (0.5GB), Single node | ~$9 |
| ALB | 1 ALB + minimal LCUs | ~$18 |
| ECR | ~2GB images | ~$0.20 |
| CloudWatch Logs | 5GB ingestion, 7-day retention | ~$2.50 |
| Route 53 | 1 hosted zone | ~$0.50 |
| ACM Certificate | SSL/TLS | **Free** |
| Data Transfer | ~50GB/month out | ~$4.50 |
| **TURN Server** | **Coturn on t4g.small EC2 Spot** | **~$5** |
| **Total** | | **~$60-65/mo** |

### Option B: Growth Phase (1,000-10,000 users) - ~$150-250/month

| Service | Spec | Monthly Cost |
|---------|------|-------------|
| ECS Fargate (Backend) | 2x 0.5 vCPU, 1GB ARM (75% Spot) | ~$18 |
| ECS Fargate (Frontend) | 1x 0.25 vCPU, 0.5GB ARM (Spot) | ~$3.50 |
| RDS PostgreSQL | db.t4g.small (2 vCPU, 2GB), Single-AZ | ~$26 |
| ElastiCache Redis | cache.t4g.small (1.37GB) | ~$17 |
| ALB | 1 ALB + moderate LCUs | ~$25 |
| CloudWatch Logs | 20GB ingestion | ~$10 |
| Data Transfer | ~200GB/month | ~$18 |
| TURN Server | t4g.medium EC2 Spot | ~$12 |
| ECR + Route53 + misc | | ~$5 |
| **Total** | | **~$135-150/mo** |

### Option C: Scale Phase (10,000-100,000 users) - ~$500-1,200/month

| Service | Spec | Monthly Cost |
|---------|------|-------------|
| ECS Fargate (Backend) | 3-8x auto-scaled, 0.5 vCPU, 1GB ARM | ~$80-200 |
| ECS Fargate (Frontend) | 2x 0.25 vCPU, 0.5GB ARM | ~$7 |
| RDS PostgreSQL | db.t4g.medium (2 vCPU, 4GB), Multi-AZ | ~$104 |
| ElastiCache Redis | cache.t4g.small, 2 nodes | ~$34 |
| ALB | Higher LCU usage | ~$50 |
| CloudWatch | 50GB + alarms | ~$30 |
| Data Transfer | ~1TB/month | ~$90 |
| TURN Server | 2x c6g.large EC2 | ~$100 |
| CloudFront CDN | Static assets | ~$20 |
| **Total** | | **~$515-650/mo** |

### Cost Optimization Techniques Applied

| Optimization | Savings |
|-------------|---------|
| **Fargate Spot** (75% of tasks) | ~70% on compute |
| **ARM64/Graviton** processors | ~20% cheaper than x86 |
| **t4g.micro** DB/Redis (ARM) | ~40% vs t3.medium |
| **Single-AZ** DB (startup phase) | ~50% on RDS |
| **7-day log retention** | ~75% on CloudWatch |
| **ECR lifecycle policies** | Prevent image bloat |
| **No NAT Gateway** (public subnets) | Saves ~$32/month |
| **Autoscaling from 1** (not 2) | 50% base compute cost |
| **Free SSL** via ACM | $0 vs paid certs |
| **WebRTC P2P** (most traffic) | Minimal server bandwidth |

> **Key insight**: WebRTC is peer-to-peer, so video traffic does NOT go through your servers. The TURN server is only used when direct P2P fails (~15-20% of connections). This makes the architecture inherently cost-effective for video chat.

---

## Step-by-Step AWS Deployment

### Prerequisites

```bash
# 1. Install AWS CLI v2
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# 2. Configure credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output (json)

# 3. Install Docker
# Download Docker Desktop from https://docker.com

# 4. Verify
aws sts get-caller-identity
docker --version
```

### Step 1: Set Your Variables

```bash
# Set these for all subsequent commands
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export DOMAIN=meetwave.yourdomain.com
```

### Step 2: Store Secrets in Parameter Store

```bash
# Database credentials
aws ssm put-parameter \
  --name "/meetwave/db/username" \
  --value "meetwave_admin" \
  --type "String" \
  --region $AWS_REGION

aws ssm put-parameter \
  --name "/meetwave/db/password" \
  --value "$(openssl rand -base64 24)" \
  --type "SecureString" \
  --region $AWS_REGION

# JWT Secret
aws ssm put-parameter \
  --name "/meetwave/jwt-secret" \
  --value "$(openssl rand -base64 48)" \
  --type "SecureString" \
  --region $AWS_REGION

# TURN server credentials
aws ssm put-parameter \
  --name "/meetwave/turn-server-url" \
  --value "turn:turn.$DOMAIN:3478" \
  --type "String" \
  --region $AWS_REGION

aws ssm put-parameter \
  --name "/meetwave/turn-credential" \
  --value "$(openssl rand -base64 32)" \
  --type "SecureString" \
  --region $AWS_REGION

# Retrieve the DB password for connection string (you'll need this)
DB_PASSWORD=$(aws ssm get-parameter --name "/meetwave/db/password" --with-decryption --query Parameter.Value --output text)
```

### Step 3: Request SSL Certificate (Free)

```bash
# Request certificate
aws acm request-certificate \
  --domain-name $DOMAIN \
  --validation-method DNS \
  --region $AWS_REGION

# Note the CertificateArn from the output
export CERT_ARN="arn:aws:acm:us-east-1:XXXX:certificate/XXXX"

# Add the CNAME record to your DNS provider for validation
# Check validation status:
aws acm describe-certificate --certificate-arn $CERT_ARN --query Certificate.Status
```

### Step 4: Deploy Infrastructure (CloudFormation)

```bash
cd /path/to/ometv-clone

aws cloudformation deploy \
  --template-file infrastructure/aws/cloudformation.yml \
  --stack-name meetwave-production \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Environment=production \
    DomainName=$DOMAIN \
    DBInstanceClass=db.t4g.micro \
    RedisNodeType=cache.t4g.micro \
    CertificateArn=$CERT_ARN \
    EnableMultiAZ=false

# Wait for completion (~10-15 minutes)
aws cloudformation wait stack-create-complete --stack-name meetwave-production

# Get outputs
aws cloudformation describe-stacks \
  --stack-name meetwave-production \
  --query "Stacks[0].Outputs" \
  --output table
```

Save the outputs - you'll need `DatabaseEndpoint`, `RedisEndpoint`, `LoadBalancerDNS`, `BackendECRUri`, `FrontendECRUri`.

### Step 5: Store Database URL

```bash
# Get the RDS endpoint from CloudFormation output
DB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name meetwave-production \
  --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" --output text)

REDIS_ENDPOINT=$(aws cloudformation describe-stacks --stack-name meetwave-production \
  --query "Stacks[0].Outputs[?OutputKey=='RedisEndpoint'].OutputValue" --output text)

aws ssm put-parameter \
  --name "/meetwave/database-url" \
  --value "postgresql://meetwave_admin:${DB_PASSWORD}@${DB_ENDPOINT}:5432/meetwave" \
  --type "SecureString" \
  --region $AWS_REGION

aws ssm put-parameter \
  --name "/meetwave/redis-url" \
  --value "redis://${REDIS_ENDPOINT}:6379" \
  --type "String" \
  --region $AWS_REGION
```

### Step 6: Build & Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build for ARM64 (Graviton - 20% cheaper)
# Backend
docker buildx build \
  --platform linux/arm64 \
  -f infrastructure/docker/Dockerfile.backend \
  -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/meetwave-backend:latest \
  --push .

# Frontend
ALB_DNS=$(aws cloudformation describe-stacks --stack-name meetwave-production \
  --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" --output text)

docker buildx build \
  --platform linux/arm64 \
  -f infrastructure/docker/Dockerfile.frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://${DOMAIN}/api \
  --build-arg NEXT_PUBLIC_WS_URL=wss://${DOMAIN} \
  -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/meetwave-frontend:latest \
  --push .
```

### Step 7: Update Task Definitions

```bash
# Replace placeholders in task definitions
sed -i.bak \
  -e "s/ACCOUNT_ID/${AWS_ACCOUNT_ID}/g" \
  -e "s/REGION/${AWS_REGION}/g" \
  infrastructure/aws/task-definition-backend.json \
  infrastructure/aws/task-definition-frontend.json

# Register task definitions
aws ecs register-task-definition \
  --cli-input-json file://infrastructure/aws/task-definition-backend.json

aws ecs register-task-definition \
  --cli-input-json file://infrastructure/aws/task-definition-frontend.json
```

### Step 8: Create ECS Services

```bash
CLUSTER_NAME="meetwave-production"

# Get subnets and security group
PUBLIC_SUBNET_1=$(aws cloudformation describe-stacks --stack-name meetwave-production \
  --query "Stacks[0].Outputs[?OutputKey=='PublicSubnet1'].OutputValue" --output text 2>/dev/null)
# If outputs aren't exposed, use:
PUBLIC_SUBNETS=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=*meetwave*public*" \
  --query "Subnets[].SubnetId" --output text | tr '\t' ',')

ECS_SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=*ECS*meetwave*" \
  --query "SecurityGroups[0].GroupGroupId" --output text)

BACKEND_TG=$(aws elbv2 describe-target-groups --names meetwave-backend-tg \
  --query "TargetGroups[0].TargetGroupArn" --output text 2>/dev/null)
# Or get from CloudFormation resources

# Backend service
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name meetwave-backend \
  --task-definition meetwave-backend \
  --desired-count 1 \
  --capacity-provider-strategy \
    capacityProvider=FARGATE_SPOT,weight=4 \
    capacityProvider=FARGATE,weight=1 \
  --network-configuration "awsvpcConfiguration={subnets=[${PUBLIC_SUBNETS}],securityGroups=[${ECS_SG}],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=${BACKEND_TG},containerName=backend,containerPort=3001"

# Frontend service
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name meetwave-frontend \
  --task-definition meetwave-frontend \
  --desired-count 1 \
  --capacity-provider-strategy \
    capacityProvider=FARGATE_SPOT,weight=4 \
    capacityProvider=FARGATE,weight=1 \
  --network-configuration "awsvpcConfiguration={subnets=[${PUBLIC_SUBNETS}],securityGroups=[${ECS_SG}],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=${FRONTEND_TG},containerName=frontend,containerPort=3000"
```

### Step 9: Run Database Migration

```bash
# Run a one-time task to migrate the database
aws ecs run-task \
  --cluster $CLUSTER_NAME \
  --task-definition meetwave-backend \
  --capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  --network-configuration "awsvpcConfiguration={subnets=[${PUBLIC_SUBNETS}],securityGroups=[${ECS_SG}],assignPublicIp=ENABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "backend",
      "command": ["sh", "-c", "npx prisma migrate deploy"]
    }]
  }'
```

### Step 10: Set Up TURN Server (EC2 Spot - Cheapest)

```bash
# Launch a t4g.small Spot instance for TURN
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type t4g.small \
  --instance-market-options 'MarketType=spot,SpotOptions={SpotInstanceType=persistent}' \
  --key-name your-key-pair \
  --security-group-ids $TURN_SG \
  --subnet-id $PUBLIC_SUBNET_1 \
  --associate-public-ip-address \
  --user-data '#!/bin/bash
apt-get update && apt-get install -y coturn
cat > /etc/turnserver.conf << EOF
listening-port=3478
realm=meetwave.example.com
use-auth-secret
static-auth-secret=YOUR_TURN_SECRET
total-quota=100
stale-nonce=600
fingerprint
lt-cred-mech
no-multicast-peers
no-loopback-peers
EOF
systemctl enable coturn
systemctl start coturn'
```

### Step 11: Point Your Domain

```bash
# Get the ALB DNS name
ALB_DNS=$(aws cloudformation describe-stacks --stack-name meetwave-production \
  --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" --output text)

echo "Add this DNS record:"
echo "  Type: CNAME"
echo "  Name: $DOMAIN"
echo "  Value: $ALB_DNS"

# If using Route 53:
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='yourdomain.com.'].Id" --output text)

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "'$DOMAIN'",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$ALB_DNS'"}]
      }
    }]
  }'
```

### Step 12: Verify Deployment

```bash
# Check ECS services are running
aws ecs describe-services \
  --cluster meetwave-production \
  --services meetwave-backend meetwave-frontend \
  --query "services[].{name:serviceName,status:status,running:runningCount,desired:desiredCount}" \
  --output table

# Check health
curl -s https://$DOMAIN/api/health

# Check logs if something is wrong
aws logs tail /ecs/meetwave-production-backend --follow
```

---

## Updating the Application

```bash
# 1. Build new images
docker buildx build --platform linux/arm64 \
  -f infrastructure/docker/Dockerfile.backend \
  -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/meetwave-backend:latest \
  --push .

# 2. Force new deployment (rolling update, zero downtime)
aws ecs update-service \
  --cluster meetwave-production \
  --service meetwave-backend \
  --force-new-deployment
```

---

## Cost Monitoring

```bash
# Set up a billing alarm ($100 threshold)
aws cloudwatch put-metric-alarm \
  --alarm-name "meetwave-billing-alarm" \
  --alarm-description "Alert when costs exceed $100" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=Currency,Value=USD \
  --alarm-actions "arn:aws:sns:us-east-1:${AWS_ACCOUNT_ID}:billing-alerts"

# Enable Cost Explorer
aws ce get-cost-and-usage \
  --time-period Start=2026-04-01,End=2026-04-30 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## Even Cheaper Alternative: Single EC2 Instance (~$20/month)

For absolute minimum cost during early development/testing:

```bash
# One t4g.small Spot instance running everything via Docker Compose
# t4g.small = 2 vCPU, 2GB RAM, ~$5/month with Spot

aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type t4g.small \
  --instance-market-options 'MarketType=spot' \
  --key-name your-key-pair \
  --security-groups meetwave-all-in-one \
  --user-data file://infrastructure/aws/ec2-userdata.sh

# Then SSH in and run:
# git clone your-repo
# cp .env.example .env && edit .env
# docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Total: ~$5 (EC2 Spot) + $0.50 (EBS) + $3 (data transfer) = ~$8.50/month
# Add a $15/year domain = ~$10/month total
```

This single-instance approach works for up to ~500 concurrent users.

---

## Cost Comparison Summary

| Approach | Monthly Cost | Max Concurrent Users | Uptime SLA |
|----------|-------------|---------------------|------------|
| Single EC2 Spot | ~$10-15 | ~500 | ~99% |
| **Minimal AWS (Recommended Start)** | **~$60-65** | **~1,000** | **~99.5%** |
| Growth AWS | ~$150 | ~10,000 | ~99.9% |
| Scale AWS | ~$500-1,200 | ~100,000 | ~99.99% |

**Recommendation**: Start with the Minimal AWS setup (~$65/mo). The auto-scaling will handle traffic spikes, and you can upgrade DB/Redis sizes as needed without downtime.
