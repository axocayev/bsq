# GitHub Actions CI/CD Setup

## Overview

Two workflows available:

1. **deploy-droplet.yml** (Recommended) - Direct deployment to Droplet with SSH
2. **ci-cd.yml** - Build, test, and push Docker images to Docker Hub

## Quick Start (Recommended: deploy-droplet.yml)

### Step 1: Generate SSH Key
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/bsq_deploy -N ""
```

### Step 2: Add GitHub Secrets
Go to: **GitHub → Settings → Secrets and variables → Actions**

Create these 10 secrets:

| Secret | Value |
|--------|-------|
| `DEPLOY_HOST` | 164.90.234.41 |
| `DEPLOY_USER` | root |
| `DEPLOY_SSH_KEY` | Copy full contents of `~/.ssh/bsq_deploy` |
| `DB_URL` | jdbc:postgresql://postgres:5432/bsq_exam |
| `DB_USERNAME` | bsq |
| `DB_PASSWORD` | bsq_secret |
| `JWT_SECRET` | YnNxX2V4YW1fcG9ydGFsX3N1cGVyX3NlY3JldF9rZXlfMzJieXRlcw== |
| `MINIO_ACCESS_KEY` | minioadmin |
| `MINIO_SECRET_KEY` | minioadmin |
| `CHATGPT_API_KEY` | Your OpenAI API key |

### Step 3: Push to GitHub
```bash
git push origin main
```

### Step 4: Monitor
Go to: **GitHub → Actions tab** and watch the workflow

## How It Works

Each push to main:
1. ✅ Runs backend tests (JUnit)
2. ✅ Runs frontend tests (Vitest)
3. ✅ Copies code to Droplet via SSH
4. ✅ Builds Docker images
5. ✅ Creates `.env` file with secrets from GitHub Secrets
6. ✅ Restarts services
7. ✅ Health check verification

**Time**: ~5-10 minutes

## File Structure

```
.github/
├── workflows/
│   ├── ci-cd.yml                 # App Platform deployment
│   ├── deploy-droplet.yml        # Droplet deployment (recommended)
│   └── README.md                 # Workflow documentation
└── DEPLOYMENT_GUIDE.md           # Detailed setup

.env.example                       # Environment variables template
docker-compose.yml               # Updated with env var support
```

## Security

✅ **No secrets in git**
- All API keys in `.env` (git-ignored)
- Secrets stored in GitHub Secrets
- `.env` created on Droplet during deployment
- SSH keys protected as GitHub Secrets

## Troubleshooting

### SSH key not working
```bash
# Test locally
ssh -i ~/.ssh/bsq_deploy root@164.90.234.41
```

### View workflow logs
GitHub → Actions → Select workflow → Click run

### View Droplet logs
```bash
ssh root@164.90.234.41 'cd /root/bsq && docker-compose logs -f backend'
```

### Health check timeout
Backend takes 60+ seconds to start (migrations)
Check: `docker-compose ps`

## Docker Hub Setup (Optional: ci-cd.yml)

To automatically build and push Docker images to Docker Hub:

### Step 1: Add Docker Hub Secrets
Go to: **GitHub → Settings → Secrets and variables → Actions**

Create these 2 secrets:

| Secret | Value |
|--------|-------|
| `DOCKER_USERNAME` | axocayev |
| `DOCKER_PAT` | Your Docker Hub Personal Access Token |

⚠️ **SECURITY**: Store the token in GitHub Secrets only, never in code!

### Step 2: Activate ci-cd.yml
The workflow will automatically build and push images on each push to main:
- `axocayev/bsq-backend:latest`
- `axocayev/bsq-frontend:latest`

View pushed images at: https://hub.docker.com/u/axocayev

See `.github/workflows/README.md` for details.

## Next Steps

1. ✅ Generate SSH key: `ssh-keygen -t rsa -b 4096`
2. ✅ Add 10 secrets to GitHub
3. ✅ Push to main: `git push origin main`
4. ✅ Watch Actions tab
5. ✅ Verify at http://164.90.234.41
