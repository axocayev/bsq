# CI/CD Pipeline Stages

## Overview

The GitHub Actions pipelines are structured into clear, sequential stages for testing, building, and deploying.

---

## deploy-droplet.yml (Recommended)

Deploys directly to DigitalOcean Droplet via SSH.

### Stage 1: Backend Testing & Compilation
**Job**: `test-backend`
- ✅ Checkout code
- ✅ Set up JDK 17
- ✅ Compile Java code
- ✅ Run JUnit tests
- ✅ Build JAR artifact
- ✅ Upload JAR to artifacts storage

**Time**: ~2-3 minutes
**Failure Impact**: Pipeline stops, deployment blocked

### Stage 2: Frontend Testing & Build
**Job**: `test-frontend`
- ✅ Checkout code
- ✅ Set up Node 18
- ✅ Install npm dependencies
- ✅ Run ESLint checks
- ✅ Run Vitest tests
- ✅ Build production bundle
- ✅ Upload dist/ to artifacts storage

**Time**: ~2-3 minutes
**Failure Impact**: Pipeline stops, deployment blocked

### Stage 3: Docker Image Building
**Job**: `build-docker` (requires stages 1 & 2 ✅)
- ✅ Build backend Docker image
- ✅ Tag with commit SHA and latest
- ✅ Build frontend Docker image
- ✅ Tag with commit SHA and latest
- ✅ Display built images

**Time**: ~3-5 minutes
**Failure Impact**: Docker images not created, deployment fails

### Stage 4: Deployment to Droplet
**Job**: `deploy` (requires stage 3 ✅)
- ✅ Set up SSH key
- ✅ Copy backend code via SCP
- ✅ Copy frontend code via SCP
- ✅ Copy docker-compose.yml
- ✅ Create .env file with secrets
- ✅ Stop old containers
- ✅ Build new Docker images
- ✅ Start containers with docker-compose

**Time**: ~3-5 minutes
**Failure Impact**: Application not updated

### Stage 5: Health Verification
**Job**: `deploy` (part of deployment step)
- ✅ Wait for backend to be healthy
- ✅ Check /api/actuator/health endpoint
- ✅ Retry up to 30 times (60 seconds total)

**Time**: ~30-60 seconds
**Failure Impact**: Deployment marked as failed

### Stage 6: Pipeline Report
**Job**: `report` (runs always)
- ✅ Summarize all stage results
- ✅ Show application URLs
- ✅ Link to workflow logs
- ✅ Display status (passed/failed)

**Time**: ~10 seconds
**Output**: Console summary + GitHub Actions UI

---

## ci-cd.yml (Alternative)

Builds and pushes Docker images to Docker Hub.

### Stage 1: Backend Testing
**Job**: `test-backend` 
- Same as deploy-droplet.yml
- **Time**: ~2-3 minutes

### Stage 2: Frontend Testing
**Job**: `test-frontend`
- Same as deploy-droplet.yml
- **Time**: ~2-3 minutes

### Stage 3: Docker Build & Push to Hub
**Job**: `build-and-push` (requires stages 1 & 2 ✅)
- ✅ Login to Docker Hub
- ✅ Build backend image
- ✅ Push backend to Docker Hub
- ✅ Build frontend image
- ✅ Push frontend to Docker Hub
- ✅ Tag with latest + commit SHA

**Time**: ~5-10 minutes
**Failure Impact**: Images not available on Docker Hub

### Stage 4: Pipeline Report
**Job**: `report`
- ✅ Show test results
- ✅ Show Docker Hub links
- ✅ Link to workflow logs

---

## Stage Dependencies

### deploy-droplet.yml
```
test-backend ───┐
                ├─→ build-docker ─→ deploy ─→ report
test-frontend ──┤
                │
                └────────────────────────────┘
```

### ci-cd.yml
```
test-backend ───┐
                ├─→ build-and-push ─→ report
test-frontend ──┘
```

---

## Monitoring Pipeline Execution

### Real-time Monitoring
1. Go to: **GitHub → Actions** tab
2. Click the workflow run
3. Watch stages execute in order
4. Green ✅ = success, Red ❌ = failed

### Stage Details
Click any stage to see:
- Step-by-step execution
- Console output
- Error messages (if failed)
- Time taken

### Logs & Artifacts
- **Logs**: Click "Logs" in each step
- **Artifacts**: Click "Artifacts" after workflow completes
  - Backend JAR
  - Frontend dist/ folder

---

## Common Issues & Solutions

### "test-backend" Failed
**Issue**: JUnit tests failed
**Solution**: 
1. Check logs for test failure
2. Run locally: `cd backend && ./gradlew test`
3. Fix code and push again

### "test-frontend" Failed
**Issue**: Vitest or ESLint failed
**Solution**:
1. Check logs for failing test
2. Run locally: `cd frontend && npm run test -- --run`
3. Fix code and push again

### "build-docker" Failed
**Issue**: Docker build error
**Solution**:
1. Verify Dockerfile exists in backend/ and frontend/
2. Check for missing dependencies
3. Try local build: `docker build -f backend/Dockerfile .`

### "deploy" Failed (SSH Connection)
**Issue**: Can't connect to Droplet
**Solution**:
1. Verify SSH key in GitHub Secrets
2. Verify Droplet IP in DEPLOY_HOST secret
3. Check Droplet is running

### "deploy" Failed (Health Check)
**Issue**: Backend not responding to health check
**Solution**:
1. SSH to Droplet: `ssh root@164.90.234.41`
2. Check logs: `docker-compose logs backend`
3. Look for Flyway migration errors
4. Restart manually: `docker-compose restart`

---

## Performance Optimization

### Caching
- **Gradle**: Caches .gradle/
- **npm**: Caches node_modules/
- **Docker**: Uses layer caching

### Parallel Execution
- Backend and Frontend tests run **in parallel**
- Saves ~2 minutes per workflow

### Artifact Retention
- JAR and dist/ kept for **1 day**
- Saves storage space
- Sufficient for debugging

---

## Viewing Artifacts

After workflow completes:
1. Go to workflow run page
2. Scroll to bottom
3. Click **"Artifacts"** section
4. Download JAR or dist/

Use for:
- Manual testing
- Backup builds
- Emergency deployments

---

## Next Steps

1. **Monitor first workflow** - Check Actions tab
2. **Review logs** - Understand each stage
3. **Test failures locally** - Before pushing
4. **Iterate** - Each push triggers full pipeline
