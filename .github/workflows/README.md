# GitHub Actions Workflows

## Available Workflows

### 1. **ci-cd.yml** - Full CI/CD with Docker Registry & App Platform
**File**: `.github/workflows/ci-cd.yml`

Builds, tests, containerizes, and deploys to DigitalOcean with full Docker Registry integration.

**Triggers**: Push to main, Pull requests

**Jobs**: test-backend → test-frontend → build-and-push → deploy → notify

**Required Secrets**: `DIGITALOCEAN_ACCESS_TOKEN`

---

### 2. **deploy-droplet.yml** - Simple SSH Deployment to Droplet
**File**: `.github/workflows/deploy-droplet.yml`

Lightweight deployment directly to your DigitalOcean Droplet via SSH and docker-compose.

**Triggers**: Push to main, Manual via Actions tab

**Jobs**: test → deploy → notify

**Required Secrets**: 
- `DEPLOY_HOST` - Droplet IP (e.g., 164.90.234.41)
- `DEPLOY_USER` - SSH user (root)
- `DEPLOY_SSH_KEY` - SSH private key
- Database, JWT, MinIO, ChatGPT secrets

---

## Which Workflow to Use?

**Use deploy-droplet.yml** if you:
- ✅ Already have a DigitalOcean Droplet
- ✅ Use docker-compose
- ✅ Want fast deployments
- ✅ Don't need auto-scaling

**Use ci-cd.yml** if you:
- ✅ Want managed infrastructure
- ✅ Need auto-scaling
- ✅ Prefer DigitalOcean App Platform

---

## Secrets Configuration

### For deploy-droplet.yml

1. Go to GitHub → Settings → Secrets and variables → Actions
2. Add these 10 secrets:

```
DEPLOY_HOST = 164.90.234.41
DEPLOY_USER = root
DEPLOY_SSH_KEY = (SSH private key)
DB_URL = jdbc:postgresql://postgres:5432/bsq_exam
DB_USERNAME = bsq
DB_PASSWORD = bsq_secret
JWT_SECRET = YnNxX2V4YW1fcG9ydGFsX3N1cGVyX3NlY3JldF9rZXlfMzJieXRlcw==
MINIO_ACCESS_KEY = minioadmin
MINIO_SECRET_KEY = minioadmin
CHATGPT_API_KEY = your_openai_api_key
```

---

## Security

⚠️ **Secrets are never committed to git**

- SSH keys stored as GitHub Secrets only
- `.env` file is git-ignored
- Secrets created on remote during deployment from GitHub Secrets
- No API keys in docker-compose.yml
