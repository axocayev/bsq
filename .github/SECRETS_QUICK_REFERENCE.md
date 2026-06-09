# GitHub Secrets - Quick Reference Card

## 🚀 Add Secrets in 3 Steps

### Step 1: Go to Secrets
```
GitHub.com → Your Repo → Settings → Secrets and variables → Actions
```

### Step 2: Click "New repository secret"

### Step 3: Add Each Secret

---

## For ci-cd.yml (Docker Hub Images)

```
Name: DOCKER_USERNAME
Value: axocayev

Name: DOCKER_PAT
Value: (Your Docker Hub Personal Access Token - never in code!)
```

**That's it!** Push to main and Docker Hub images auto-build.

---

## For deploy-droplet.yml (SSH Deployment)

```
Name: DEPLOY_HOST
Value: 164.90.234.41

Name: DEPLOY_USER
Value: root

Name: DEPLOY_SSH_KEY
Value: [contents of your SSH private key]

Name: DB_URL
Value: jdbc:postgresql://postgres:5432/bsq_exam

Name: DB_USERNAME
Value: bsq

Name: DB_PASSWORD
Value: bsq_secret

Name: JWT_SECRET
Value: YnNxX2V4YW1fcG9ydGFsX3N1cGVyX3NlY3JldF9rZXlfMzJieXRlcw==

Name: MINIO_ACCESS_KEY
Value: minioadmin

Name: MINIO_SECRET_KEY
Value: minioadmin

Name: CHATGPT_API_KEY
Value: [your OpenAI API key]
```

---

## ✅ Verify

After adding secrets, you should see them in the Secrets list:
- ✅ DOCKER_PAT
- ✅ DOCKER_USERNAME
- ✅ DEPLOY_HOST
- ✅ (etc.)

Values are **hidden** for security - that's normal.

---

## 🔒 Security Checklist

- [ ] Never put secrets in docker-compose.yml
- [ ] Never put secrets in .env (use .env.example instead)
- [ ] Never commit secrets to git
- [ ] Secrets are masked in workflow logs (shown as ***)
- [ ] Only you can see secret names (values are hidden even to you)

---

## 🚨 If You Expose a Secret

1. **Immediately regenerate** the token/password in the service
2. **Delete** the old secret from GitHub
3. **Add** the new secret with the new value
4. The old token is now useless (revoked)

---

## 📚 More Info

- Full guide: `.github/SECRETS_SETUP.md`
- Workflows: `.github/workflows/README.md`
- CI/CD setup: `CI_CD_SETUP.md`
