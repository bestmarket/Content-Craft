#!/usr/bin/env bash
set -e

echo "==> Starting Voice Engine on port 8099..."
cd artifacts/voice-engine
python3 -m uvicorn main:app --host 0.0.0.0 --port 8099 &
VOICE_PID=$!
cd ../..

echo "==> Starting API Server on port $PORT..."
node --enable-source-maps artifacts/api-server/dist/index.mjs &
API_PID=$!

echo "==> Both services started (voice=$VOICE_PID, api=$API_PID)"

wait $API_PID
