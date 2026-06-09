#!/bin/bash
# Setup environment file on DigitalOcean Droplet
# Creates .env with secrets

set -e

REMOTE_PATH="/root/bsq"
ENV_FILE="$REMOTE_PATH/.env"

echo "🔐 Setting up environment file..."

if [ -f "$ENV_FILE" ]; then
    echo "✅ .env file already exists"
    echo "   (Keeping existing secrets)"
    exit 0
fi

# Create .env with defaults (update with your actual values)
cat > "$ENV_FILE" << 'ENVEOF'
# Database Configuration
DB_URL=jdbc:postgresql://postgres:5432/bsq_exam
DB_USERNAME=bsq
DB_PASSWORD=bsq_secret

# JWT Configuration
JWT_SECRET=YnNxX2V4YW1fcG9ydGFsX3N1cGVyX3NlY3JldF9rZXlfMzJieXRlcw==

# Server Configuration
SERVER_PORT=8080
TZ=Asia/Baku

# MinIO Configuration
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=bsq-exams
MINIO_PUBLIC_URL=http://localhost/storage

# AI Configuration (ChatGPT)
CHATGPT_API_KEY=your_openai_api_key_here
CHATGPT_MODEL=gpt-4o-mini
ENVEOF

chmod 600 "$ENV_FILE"
echo "✅ Created .env file at $ENV_FILE"
echo "⚠️  Update CHATGPT_API_KEY in $ENV_FILE with your actual API key"
echo "⚠️  Then restart services: docker-compose restart"
