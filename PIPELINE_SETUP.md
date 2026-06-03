# CI/CD Pipeline Setup Guide - BSQ Exam Portal

**Date:** June 3, 2026  
**Status:** Ready to implement

---

## 📋 Pipeline Overview

### Architecture

```
Feature Branch → Code Commit
    ↓
Push to GitLab
    ↓
┌─────────────────────────────────────┐
│ GitLab CI Pipeline Starts           │
├─────────────────────────────────────┤
│ Stage 1: Code Quality               │
│ - Lint (PMD, Checkstyle)           │
│ - SonarQube Analysis               │
│ - Code Coverage Check              │
├─────────────────────────────────────┤
│ Stage 2: Build & Test              │
│ - Backend: Compile + Unit Tests    │
│ - Frontend: Build + Unit Tests     │
│ - Contract Tests                   │
├─────────────────────────────────────┤
│ Stage 3: Docker Build              │
│ - Build Backend Image              │
│ - Build Frontend Image             │
│ - Push to Registry                 │
├─────────────────────────────────────┤
│ Stage 4: Deploy Dev                │
│ - Deploy to Dev Environment        │
│ - Run Smoke Tests                  │
└─────────────────────────────────────┘
    ↓
Create Merge Request (review required)
    ↓
Approve & Merge to main/master
    ↓
┌─────────────────────────────────────┐
│ Deploy to Test & Prod              │
├─────────────────────────────────────┤
│ - Tag image for test deployment    │
│ - Deploy to Test Environment       │
│ - Deploy to Production (manual)    │
└─────────────────────────────────────┘
```

---

## 🛠️ Option 1: GitLab CI (Recommended - Based on CLAUDE.md)

### Create `.gitlab-ci.yml`

Create file: `.gitlab-ci.yml`

```yaml
stages:
  - quality
  - build
  - docker
  - deploy_dev
  - deploy_test
  - deploy_prod

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  REGISTRY: "registry.example.com"  # ← Update with your registry
  BACKEND_IMAGE: "${REGISTRY}/bsq/backend"
  FRONTEND_IMAGE: "${REGISTRY}/bsq/frontend"

# ============================================
# STAGE 1: CODE QUALITY
# ============================================

lint_backend:
  stage: quality
  image: gradle:8.11-jdk17
  script:
    - cd backend
    - export JAVA_HOME=/usr/local/openjdk-17
    - ./gradlew checkstyleMain --no-build-cache
  only:
    - merge_requests
    - branches
  allow_failure: false

sonarqube_analysis:
  stage: quality
  image: gradle:8.11-jdk17
  script:
    - cd backend
    - export JAVA_HOME=/usr/local/openjdk-17
    - ./gradlew sonarqube
      -Dsonar.projectKey=bsq
      -Dsonar.host.url=https://sonarqube.example.com
      -Dsonar.login=${SONAR_TOKEN}
  only:
    - merge_requests
    - main
    - master
  allow_failure: true

frontend_lint:
  stage: quality
  image: node:20-alpine
  script:
    - cd frontend
    - npm ci
    - npm run lint
  only:
    - merge_requests
    - branches
  allow_failure: false

# ============================================
# STAGE 2: BUILD & TEST
# ============================================

build_backend:
  stage: build
  image: gradle:8.11-jdk17
  script:
    - cd backend
    - export JAVA_HOME=/usr/local/openjdk-17
    - ./gradlew build -x bootJar --no-build-cache
  artifacts:
    paths:
      - backend/build/libs/
      - backend/build/reports/
    expire_in: 1 day
  only:
    - merge_requests
    - branches
  allow_failure: false

test_backend:
  stage: build
  image: gradle:8.11-jdk17
  script:
    - cd backend
    - export JAVA_HOME=/usr/local/openjdk-17
    - ./gradlew test --no-build-cache
  artifacts:
    reports:
      junit:
        - backend/build/test-results/test/TEST-*.xml
    paths:
      - backend/build/reports/tests/
    expire_in: 30 days
  only:
    - merge_requests
    - branches
  allow_failure: false

build_frontend:
  stage: build
  image: node:20-alpine
  script:
    - cd frontend
    - npm ci
    - npm run build
  artifacts:
    paths:
      - frontend/dist/
    expire_in: 1 day
  only:
    - merge_requests
    - branches
  allow_failure: false

test_frontend:
  stage: build
  image: node:20-alpine
  script:
    - cd frontend
    - npm ci
    - npm run test:coverage
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: frontend/coverage/cobertura-coverage.xml
    paths:
      - frontend/coverage/
    expire_in: 30 days
  only:
    - merge_requests
    - branches
  allow_failure: false

contract_tests:
  stage: build
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  script:
    - cd backend
    - docker run --rm
      -v "$(pwd)":/workspace
      -w /workspace
      gradle:8.11-jdk17
      bash -c "export JAVA_HOME=/usr/local/openjdk-17 && ./gradlew contractTest"
  only:
    - merge_requests
    - branches
  allow_failure: true

# ============================================
# STAGE 3: DOCKER BUILD
# ============================================

build_docker_backend:
  stage: docker
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  before_script:
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $REGISTRY
  script:
    - cd backend
    - docker build -t ${BACKEND_IMAGE}:${CI_COMMIT_SHA} -t ${BACKEND_IMAGE}:latest .
    - docker push ${BACKEND_IMAGE}:${CI_COMMIT_SHA}
    - if [ "$CI_COMMIT_BRANCH" = "main" ] || [ "$CI_COMMIT_BRANCH" = "master" ]; then docker push ${BACKEND_IMAGE}:latest; fi
  only:
    - branches
  except:
    - merge_requests
  allow_failure: false

build_docker_frontend:
  stage: docker
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  before_script:
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $REGISTRY
  script:
    - cd frontend
    - docker build -t ${FRONTEND_IMAGE}:${CI_COMMIT_SHA} -t ${FRONTEND_IMAGE}:latest .
    - docker push ${FRONTEND_IMAGE}:${CI_COMMIT_SHA}
    - if [ "$CI_COMMIT_BRANCH" = "main" ] || [ "$CI_COMMIT_BRANCH" = "master" ]; then docker push ${FRONTEND_IMAGE}:latest; fi
  only:
    - branches
  except:
    - merge_requests
  allow_failure: false

# ============================================
# STAGE 4: DEPLOY DEV
# ============================================

deploy_dev:
  stage: deploy_dev
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - |
      curl -X POST \
        -H "Authorization: Bearer ${DEPLOY_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"image_backend": "'${BACKEND_IMAGE}:${CI_COMMIT_SHA}'", "image_frontend": "'${FRONTEND_IMAGE}:${CI_COMMIT_SHA}'"}' \
        https://dev-deployment.example.com/api/deploy
  environment:
    name: dev
    url: https://dev.bsq.example.com
    auto_stop_in: 2 weeks
  only:
    - branches
  except:
    - merge_requests
  allow_failure: false

smoke_tests_dev:
  stage: deploy_dev
  image: node:20-alpine
  script:
    - apk add --no-cache curl
    - |
      for i in {1..30}; do
        if curl -f https://dev.bsq.example.com/health; then
          echo "✅ Health check passed"
          exit 0
        fi
        echo "⏳ Waiting for deployment... ($i/30)"
        sleep 10
      done
      echo "❌ Deployment health check failed"
      exit 1
  dependencies:
    - deploy_dev
  environment:
    name: dev
  only:
    - branches
  except:
    - merge_requests
  allow_failure: true

# ============================================
# STAGE 5: DEPLOY TEST (on master merge)
# ============================================

deploy_test:
  stage: deploy_test
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - |
      curl -X POST \
        -H "Authorization: Bearer ${DEPLOY_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"image_backend": "'${BACKEND_IMAGE}:${CI_COMMIT_SHA}'", "image_frontend": "'${FRONTEND_IMAGE}:${CI_COMMIT_SHA}'"}' \
        https://test-deployment.example.com/api/deploy
  environment:
    name: test
    url: https://test.bsq.example.com
  only:
    - main
    - master
  allow_failure: false

# ============================================
# STAGE 6: DEPLOY PROD (manual, on tag)
# ============================================

deploy_prod:
  stage: deploy_prod
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - |
      curl -X POST \
        -H "Authorization: Bearer ${DEPLOY_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"image_backend": "'${BACKEND_IMAGE}:${CI_COMMIT_TAG}'", "image_frontend": "'${FRONTEND_IMAGE}:${CI_COMMIT_TAG}'"}' \
        https://prod-deployment.example.com/api/deploy
  environment:
    name: production
    url: https://bsq.example.com
  when: manual
  only:
    - tags
  allow_failure: false
```

---

## 🚀 Option 2: GitHub Actions (If using GitHub)

Create file: `.github/workflows/ci-cd.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, master, develop]
    tags: ['prod-*']
  pull_request:
    branches: [main, master, develop]

env:
  REGISTRY: ghcr.io
  BACKEND_IMAGE: ghcr.io/${{ github.repository }}/backend
  FRONTEND_IMAGE: ghcr.io/${{ github.repository }}/frontend

jobs:
  # CODE QUALITY
  lint-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: 17
          distribution: 'temurin'
      - name: Run Checkstyle
        run: |
          cd backend
          ./gradlew checkstyleMain

  # BUILD & TEST
  build-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: 17
          distribution: 'temurin'
      - name: Build backend
        run: |
          cd backend
          ./gradlew build

  test-backend:
    runs-on: ubuntu-latest
    needs: build-backend
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: 17
          distribution: 'temurin'
      - name: Run tests
        run: |
          cd backend
          ./gradlew test

  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - name: Build frontend
        run: |
          cd frontend
          npm ci && npm run build

  # DOCKER BUILD
  docker-build:
    runs-on: ubuntu-latest
    needs: [build-backend, build-frontend]
    permissions:
      contents: read
      packages: write
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master' || startsWith(github.ref, 'refs/tags/'))
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: |
            ${{ env.BACKEND_IMAGE }}:latest
            ${{ env.BACKEND_IMAGE }}:${{ github.sha }}
      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: |
            ${{ env.FRONTEND_IMAGE }}:latest
            ${{ env.FRONTEND_IMAGE }}:${{ github.sha }}

  # DEPLOY
  deploy-dev:
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to dev
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \
            https://dev-deployment.example.com/api/deploy
        env:
          IMAGE_BACKEND: ${{ env.BACKEND_IMAGE }}:${{ github.sha }}
          IMAGE_FRONTEND: ${{ env.FRONTEND_IMAGE }}:${{ github.sha }}

  deploy-test:
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master')
    steps:
      - name: Deploy to test
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \
            https://test-deployment.example.com/api/deploy
        env:
          IMAGE_BACKEND: ${{ env.BACKEND_IMAGE }}:${{ github.sha }}
          IMAGE_FRONTEND: ${{ env.FRONTEND_IMAGE }}:${{ github.sha }}

  deploy-prod:
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/prod-')
    environment:
      name: production
      url: https://bsq.example.com
    steps:
      - name: Deploy to production
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" \
            https://prod-deployment.example.com/api/deploy
        env:
          IMAGE_BACKEND: ${{ env.BACKEND_IMAGE }}:${{ github.sha }}
          IMAGE_FRONTEND: ${{ env.FRONTEND_IMAGE }}:${{ github.sha }}
```

---

## 📋 Pipeline Stages Explained

### Stage 1: Code Quality
```
✓ Backend Lint (Checkstyle, PMD)
✓ Frontend Lint (ESLint)
✓ SonarQube Analysis
✓ Code Coverage Check
```

**What it does:** Ensures code follows standards, no obvious issues

### Stage 2: Build & Test
```
✓ Backend Compilation
✓ Backend Unit Tests
✓ Frontend Build
✓ Frontend Unit Tests
✓ Contract Tests
```

**What it does:** Verifies code compiles and passes tests

### Stage 3: Docker Build
```
✓ Build backend Docker image
✓ Build frontend Docker image
✓ Push to registry
```

**What it does:** Creates deployable container images

### Stage 4: Deploy Dev
```
✓ Deploy to dev environment
✓ Run smoke tests
```

**What it does:** Auto-deploys to dev after each commit

### Stage 5: Deploy Test
```
✓ Deploy to test environment (on main merge)
```

**What it does:** Deploys to test when code merged to main

### Stage 6: Deploy Prod
```
✓ Manual deployment (on prod-* tag)
```

**What it does:** Manual production deployment with tag

---

## 🔑 Required Environment Variables

### GitLab CI Variables

Set in **GitLab → Project → Settings → CI/CD → Variables:**

```
CI_REGISTRY_USER          = Your registry username
CI_REGISTRY_PASSWORD      = Your registry password
SONAR_TOKEN              = SonarQube authentication token
DEPLOY_TOKEN             = Deployment API token
```

### GitHub Actions Secrets

Set in **GitHub → Settings → Secrets and variables:**

```
DEPLOY_TOKEN             = Deployment API token
```

---

## 📊 Pipeline Rules

| Trigger | Stages | Deploy |
|---------|--------|--------|
| Feature Branch PR | Quality → Build → Test | None |
| Push to develop | All + Docker | Dev |
| Merge to main/master | All + Docker | Test |
| Tag: prod-* | All + Docker | Prod (manual) |

---

## 🚀 Quick Setup Steps

### 1. Choose Your Platform
- **GitLab CI:** Use `.gitlab-ci.yml` template above
- **GitHub Actions:** Use `.github/workflows/ci-cd.yml` template above

### 2. Create Pipeline File
```bash
# For GitLab
cat > .gitlab-ci.yml << 'EOF'
[paste content above]
EOF

# For GitHub
mkdir -p .github/workflows
cat > .github/workflows/ci-cd.yml << 'EOF'
[paste content above]
EOF
```

### 3. Update Configuration
```yaml
# Update these values:
REGISTRY: "your-registry.com"
SONAR_HOST: "your-sonarqube.com"
DEPLOY_API: "your-deployment-api.com"
```

### 4. Set Environment Variables
- GitLab: Go to Project → Settings → CI/CD → Variables
- GitHub: Go to Settings → Secrets and variables

### 5. Commit & Push
```bash
git add .gitlab-ci.yml  # or .github/workflows/ci-cd.yml
git commit -m "chore: add CI/CD pipeline"
git push origin main
```

### 6. Verify Pipeline
- **GitLab:** Go to CI/CD → Pipelines
- **GitHub:** Go to Actions tab

---

## 📝 Dockerfile Examples

### Backend Dockerfile

Create: `backend/Dockerfile`

```dockerfile
# Build stage
FROM gradle:8.11-jdk17 AS builder
WORKDIR /app
COPY . .
RUN export JAVA_HOME=/usr/local/openjdk-17 && ./gradlew bootJar --no-build-cache

# Runtime stage
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=builder /app/build/libs/bsq-*.jar app.jar
EXPOSE 8080
ENV JAVA_OPTS="-Xmx512m -Xms256m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### Frontend Dockerfile

Create: `frontend/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🔍 Monitoring Pipeline

### GitLab
```
Project → CI/CD → Pipelines
  ├─ View pipeline runs
  ├─ See stage details
  ├─ View job logs
  ├─ Monitor deployment status
  └─ Review artifacts
```

### GitHub
```
Actions tab
  ├─ View workflow runs
  ├─ See step details
  ├─ View job logs
  ├─ Monitor deployment
  └─ Review artifacts
```

---

## ✅ Success Criteria

✅ Pipeline runs on every commit  
✅ Code quality checks pass  
✅ Tests pass  
✅ Docker images build successfully  
✅ Dev deploys after each commit  
✅ Test deploys after main merge  
✅ Production deployment is manual & tagged  

---

## 📚 Next Steps

1. **Choose platform** (GitLab or GitHub)
2. **Create pipeline file** (use template above)
3. **Set environment variables**
4. **Create Dockerfiles** for backend & frontend
5. **Push to repository**
6. **Monitor first pipeline run**
7. **Fix any failures**
8. **Celebrate! 🎉**

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Pipeline not starting | Commit pipeline file to repo |
| Docker build fails | Check Dockerfile syntax, Java version |
| Tests fail | Run locally first: `./gradlew test` |
| Deploy fails | Check deploy token, API endpoint |
| SonarQube issues | Generate SONAR_TOKEN in SonarQube UI |

---

**Pipeline setup ready to implement! Choose your platform and follow the steps above.** 🚀
