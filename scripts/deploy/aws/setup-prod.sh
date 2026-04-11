#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
APP_NAME="${APP_NAME:-malkiat}"
GITHUB_OWNER="${GITHUB_OWNER:-}"
GITHUB_REPO="${GITHUB_REPO:-}"
GITHUB_BRANCH="${GITHUB_BRANCH:-production}"
KEY_NAME="${KEY_NAME:-}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.large}"
AMI_ID="${AMI_ID:-}"
VPC_ID="${VPC_ID:-}"
SUBNET_ID="${SUBNET_ID:-}"
MY_IP_CIDR="${MY_IP_CIDR:-}"

if [[ -z "$GITHUB_OWNER" || -z "$GITHUB_REPO" ]]; then
  echo "Set GITHUB_OWNER and GITHUB_REPO."
  exit 1
fi

if [[ -z "$AMI_ID" ]]; then
  AMI_ID="$(aws ssm get-parameter --region "$AWS_REGION" --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 --query 'Parameter.Value' --output text)"
fi

if [[ -z "$VPC_ID" ]]; then
  VPC_ID="$(aws ec2 describe-vpcs --region "$AWS_REGION" --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)"
fi

if [[ -z "$SUBNET_ID" ]]; then
  SUBNET_ID="$(aws ec2 describe-subnets --region "$AWS_REGION" --filters Name=vpc-id,Values="$VPC_ID" Name=default-for-az,Values=true --query 'Subnets[0].SubnetId' --output text)"
fi

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ECR_REPO_NAME="${APP_NAME}-backend"
EC2_ROLE_NAME="${APP_NAME}-ec2-prod-role"
EC2_PROFILE_NAME="${APP_NAME}-ec2-prod-profile"
GITHUB_ROLE_NAME="${APP_NAME}-github-actions-deploy-role"
SECURITY_GROUP_NAME="${APP_NAME}-prod-sg"
SECRET_NAME="${APP_NAME}/prod/app-env"

echo "Creating ECR repository if missing..."
aws ecr describe-repositories --region "$AWS_REGION" --repository-names "$ECR_REPO_NAME" >/dev/null 2>&1 || \
  aws ecr create-repository --region "$AWS_REGION" --repository-name "$ECR_REPO_NAME" >/dev/null

echo "Creating EC2 IAM role and instance profile..."
cat > /tmp/${EC2_ROLE_NAME}-trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam get-role --role-name "$EC2_ROLE_NAME" >/dev/null 2>&1 || \
  aws iam create-role --role-name "$EC2_ROLE_NAME" --assume-role-policy-document file:///tmp/${EC2_ROLE_NAME}-trust.json >/dev/null

aws iam attach-role-policy --role-name "$EC2_ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore >/dev/null
aws iam attach-role-policy --role-name "$EC2_ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly >/dev/null

cat > /tmp/${EC2_ROLE_NAME}-secrets-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:${AWS_REGION}:${ACCOUNT_ID}:secret:${APP_NAME}/prod/*"
    }
  ]
}
EOF

aws iam put-role-policy --role-name "$EC2_ROLE_NAME" --policy-name ${APP_NAME}-secrets-read --policy-document file:///tmp/${EC2_ROLE_NAME}-secrets-policy.json >/dev/null

aws iam get-instance-profile --instance-profile-name "$EC2_PROFILE_NAME" >/dev/null 2>&1 || \
  aws iam create-instance-profile --instance-profile-name "$EC2_PROFILE_NAME" >/dev/null

aws iam add-role-to-instance-profile --instance-profile-name "$EC2_PROFILE_NAME" --role-name "$EC2_ROLE_NAME" >/dev/null 2>&1 || true

echo "Ensuring GitHub OIDC provider exists..."
OIDC_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$OIDC_ARN" >/dev/null 2>&1; then
  aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 >/dev/null
fi

echo "Creating GitHub deploy role..."
cat > /tmp/${GITHUB_ROLE_NAME}-trust.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Federated": "${OIDC_ARN}" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_OWNER}/${GITHUB_REPO}:ref:refs/heads/${GITHUB_BRANCH}"
        }
      }
    }
  ]
}
EOF

aws iam get-role --role-name "$GITHUB_ROLE_NAME" >/dev/null 2>&1 || \
  aws iam create-role --role-name "$GITHUB_ROLE_NAME" --assume-role-policy-document file:///tmp/${GITHUB_ROLE_NAME}-trust.json >/dev/null

cat > /tmp/${GITHUB_ROLE_NAME}-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:SendCommand",
        "ssm:GetCommandInvocation"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-role-policy --role-name "$GITHUB_ROLE_NAME" --policy-name ${APP_NAME}-github-deploy --policy-document file:///tmp/${GITHUB_ROLE_NAME}-policy.json >/dev/null

echo "Creating security group..."
SG_ID="$(aws ec2 describe-security-groups --region "$AWS_REGION" --filters Name=group-name,Values="$SECURITY_GROUP_NAME" Name=vpc-id,Values="$VPC_ID" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || true)"
if [[ -z "$SG_ID" || "$SG_ID" == "None" ]]; then
  SG_ID="$(aws ec2 create-security-group --region "$AWS_REGION" --group-name "$SECURITY_GROUP_NAME" --description "${APP_NAME} production" --vpc-id "$VPC_ID" --query GroupId --output text)"
fi

aws ec2 authorize-security-group-ingress --region "$AWS_REGION" --group-id "$SG_ID" --ip-permissions '[{"IpProtocol":"tcp","FromPort":80,"ToPort":80,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]}]' >/dev/null 2>&1 || true
if [[ -n "$MY_IP_CIDR" ]]; then
  aws ec2 authorize-security-group-ingress --region "$AWS_REGION" --group-id "$SG_ID" --ip-permissions "[{\"IpProtocol\":\"tcp\",\"FromPort\":22,\"ToPort\":22,\"IpRanges\":[{\"CidrIp\":\"$MY_IP_CIDR\"}]}]" >/dev/null 2>&1 || true
fi

echo "Launching EC2 instance..."
RUN_ARGS=(
  --region "$AWS_REGION"
  --image-id "$AMI_ID"
  --instance-type "$INSTANCE_TYPE"
  --iam-instance-profile Name="$EC2_PROFILE_NAME"
  --security-group-ids "$SG_ID"
  --subnet-id "$SUBNET_ID"
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${APP_NAME}-prod}]"
  --query 'Instances[0].InstanceId'
  --output text
)

if [[ -n "$KEY_NAME" ]]; then
  RUN_ARGS+=(--key-name "$KEY_NAME")
fi

INSTANCE_ID="$(aws ec2 run-instances "${RUN_ARGS[@]}")"

aws ec2 wait instance-running --region "$AWS_REGION" --instance-ids "$INSTANCE_ID"

echo "Ensuring secret exists..."
if ! aws secretsmanager describe-secret --region "$AWS_REGION" --secret-id "$SECRET_NAME" >/dev/null 2>&1; then
  aws secretsmanager create-secret --region "$AWS_REGION" --name "$SECRET_NAME" --secret-string '{}'
fi

PUBLIC_IP="$(aws ec2 describe-instances --region "$AWS_REGION" --instance-ids "$INSTANCE_ID" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)"
GITHUB_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${GITHUB_ROLE_NAME}"

echo
echo "Provisioning complete"
echo "INSTANCE_ID=${INSTANCE_ID}"
echo "PUBLIC_IP=${PUBLIC_IP}"
echo "SECURITY_GROUP_ID=${SG_ID}"
echo "ECR_REPOSITORY=${ECR_REPO_NAME}"
echo "SECRET_NAME=${SECRET_NAME}"
echo "GITHUB_DEPLOY_ROLE_ARN=${GITHUB_ROLE_ARN}"
echo
echo "Next:"
echo "1) Put production secret JSON in Secrets Manager (${SECRET_NAME})"
echo "2) Add GitHub repo secrets: AWS_DEPLOY_ROLE_ARN, AWS_PROD_INSTANCE_ID"
echo "3) Push/merge to production branch"
