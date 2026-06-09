# GitHub Secrets Setup Guide

## Overview

Secrets are sensitive credentials (passwords, API keys, tokens) that GitHub Actions needs but should never be stored in code.

**Security Rule**: Never commit secrets to git. Always use GitHub Secrets.

---

## Setup: Docker Hub Secrets (For ci-cd.yml workflow)

### Step 1: Get Docker Hub Credentials

**Your credentials:**
```
Username: axocayev
PAT Token: (provided separately - never in code)
```

### Step 2: Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click **Settings** (top navigation)
3. Click **Secrets and variables** (left sidebar)
4. Click **Actions** (under Secrets and variables)
5. Click **New repository secret** (green button)

### Step 3: Add DOCKER_USERNAME

- **Name**: `DOCKER_USERNAME`
- **Value**: `axocayev`
- Click **Add secret**

### Step 4: Add DOCKER_PAT

- **Name**: `DOCKER_PAT`
- **Value**: (your Docker Hub Personal Access Token)
- Click **Add secret**

✅ You should now see:
- DOCKER_PAT
- DOCKER_USERNAME

---

## Setup: Droplet Deployment Secrets (For deploy-droplet.yml workflow)

### Step 1-2: Same as above

Navigate to: **Settings → Secrets and variables → Actions**

### Step 3-12: Add These 10 Secrets

| Name | Value |
|------|-------|
| `DEPLOY_HOST` | 164.90.234.41 |
| `DEPLOY_USER` | root |
| `DEPLOY_SSH_KEY` | Your SSH private key |
| `DB_URL` | jdbc:postgresql://postgres:5432/bsq_exam |
| `DB_USERNAME` | bsq |
| `DB_PASSWORD` | bsq_secret |
| `JWT_SECRET` | YnNxX2V4YW1fcG9ydGFsX3N1cGVyX3NlY3JldF9rZXlfMzJieXRlcw== |
| `MINIO_ACCESS_KEY` | minioadmin |
| `MINIO_SECRET_KEY` | minioadmin |
| `CHATGPT_API_KEY` | Your OpenAI API key |

---

## How Secrets Work in Workflows

In the workflow files, secrets are referenced like this:

```yaml
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PAT }}
```

GitHub automatically:
1. ✅ Substitutes the actual value at runtime
2. ✅ Masks the value in logs (shows `***`)
3. ✅ Never stores it in git
4. ✅ Encrypts it in storage

---

## Security Best Practices

✅ **DO:**
- Store secrets in GitHub Secrets only
- Use unique, strong tokens/passwords
- Rotate secrets periodically
- Log in to Docker Hub: `docker login -u axocayev`

❌ **DON'T:**
- Put secrets in docker-compose.yml
- Put secrets in .env files committed to git
- Share secrets in messages or documents
- Use the same password for multiple services

---

## Verify Secrets Are Set

1. Go to **Settings → Secrets and variables → Actions**
2. You should see a list of secrets (values are hidden)
3. Click on a secret to update it
4. Secrets are write-only (values can't be read back)

---

## Troubleshooting

### "Authentication failed" in workflow
- ✅ Check secret name is correct (case-sensitive)
- ✅ Check secret value is correct
- ✅ For Docker: Make sure PAT has read/write permissions

### Secret not updating
- ✅ Workflow uses cached value; wait a few minutes
- ✅ Manually re-run workflow in Actions tab

### Can't see secret value
- ✅ That's intentional (security feature)
- ✅ Delete and recreate if you need to change it

---

## Next Steps

1. ✅ Add DOCKER_USERNAME and DOCKER_PAT secrets
2. ✅ (Optional) Add Droplet deployment secrets if using deploy-droplet.yml
3. ✅ Push code to main branch
4. ✅ Watch GitHub Actions tab for workflow execution

---

## Reference

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Hub Personal Access Tokens](https://docs.docker.com/docker-hub/access-tokens/)
- [SSH Keys for Droplet](https://docs.digitalocean.com/products/droplets/how-to/add-ssh-keys/)
