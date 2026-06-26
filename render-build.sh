#!/usr/bin/env bash
set -e

echo "==> Installing pnpm..."
npm install -g pnpm@10.26.1

echo "==> Installing Node dependencies..."
pnpm install --frozen-lockfile

echo "==> Installing Python dependencies..."
pip install uvicorn fastapi numpy pillow soundfile kokoro-onnx

echo "==> Downloading voice model files..."
python3 artifacts/voice-engine/download_models.py

echo "==> Building frontend..."
pnpm --filter @workspace/content-studio run build

echo "==> Building API server..."
pnpm --filter @workspace/api-server run build

echo "==> Build complete."
