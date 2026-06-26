from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
import numpy as np
import io
import re
import json
import base64
import wave
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ViralCraft Voice Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model file paths ──────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH  = os.path.join(SCRIPT_DIR, "kokoro-v1.0.onnx")
VOICES_PATH = os.path.join(SCRIPT_DIR, "voices-v1.0.bin")

MODEL_URLS = {
    "kokoro-v1.0.onnx": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx",
    "voices-v1.0.bin":  "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin",
}

def ensure_models():
    import urllib.request
    for name, url in MODEL_URLS.items():
        dest = os.path.join(SCRIPT_DIR, name)
        if os.path.exists(dest):
            continue
        logger.info(f"Downloading {name} — this may take a minute...")
        tmp = dest + ".tmp"
        try:
            urllib.request.urlretrieve(url, tmp)
            os.rename(tmp, dest)
            logger.info(f"{name} downloaded ({os.path.getsize(dest)/1024/1024:.1f} MB)")
        except Exception as e:
            if os.path.exists(tmp):
                os.remove(tmp)
            raise RuntimeError(f"Failed to download {name}: {e}") from e

try:
    ensure_models()
except Exception as exc:
    logger.error(f"Model download failed: {exc}")

# ── Lazy model loading ────────────────────────────────────────────────────────
_kokoro = None

def get_kokoro():
    global _kokoro
    if _kokoro is None:
        ensure_models()
        logger.info("Loading Kokoro TTS model...")
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
        logger.info("Kokoro TTS model loaded.")
    return _kokoro

# ── Available voices ──────────────────────────────────────────────────────────
VOICES = [
    {"id": "af_sky",     "name": "Sky",     "gender": "Female", "accent": "American", "description": "Warm and expressive"},
    {"id": "af_bella",   "name": "Bella",   "gender": "Female", "accent": "American", "description": "Smooth and professional"},
    {"id": "af_sarah",   "name": "Sarah",   "gender": "Female", "accent": "American", "description": "Clear and energetic"},
    {"id": "af_nicole",  "name": "Nicole",  "gender": "Female", "accent": "American", "description": "Soft and friendly"},
    {"id": "am_adam",    "name": "Adam",    "gender": "Male",   "accent": "American", "description": "Deep and authoritative"},
    {"id": "am_michael", "name": "Michael", "gender": "Male",   "accent": "American", "description": "Confident and natural"},
    {"id": "bf_emma",    "name": "Emma",    "gender": "Female", "accent": "British",  "description": "Elegant and clear"},
    {"id": "bf_isabella","name": "Isabella","gender": "Female", "accent": "British",  "description": "Refined and expressive"},
    {"id": "bm_george",  "name": "George",  "gender": "Male",   "accent": "British",  "description": "Distinguished and warm"},
    {"id": "bm_lewis",   "name": "Lewis",   "gender": "Male",   "accent": "British",  "description": "Calm and engaging"},
]

VOICE_IDS = {v["id"] for v in VOICES}

# ── Preview cache ─────────────────────────────────────────────────────────────
_preview_cache: dict[str, bytes] = {}
PREVIEW_TEXT = "Hello! I'm your AI voice assistant. I can turn any text into natural-sounding speech."

# ── Sentence splitter ─────────────────────────────────────────────────────────
def split_sentences(text: str) -> list[str]:
    text = text.strip()
    sentences = re.split(r'(?<=[.!?])\s+', text)
    result = []
    for s in sentences:
        s = s.strip()
        if s:
            result.append(s)
    return result or [text]

# ── Audio helpers ─────────────────────────────────────────────────────────────
def samples_to_wav_bytes(samples: np.ndarray, sample_rate: int) -> bytes:
    samples_int16 = np.clip(samples * 32767, -32768, 32767).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(samples_int16.tobytes())
    return buf.getvalue()

def concat_wav_bytes(wav_list: list[bytes]) -> bytes:
    if not wav_list:
        return b""
    if len(wav_list) == 1:
        return wav_list[0]
    all_frames = []
    sample_rate = 24000
    for wav_bytes in wav_list:
        buf = io.BytesIO(wav_bytes)
        with wave.open(buf, 'rb') as wf:
            sample_rate = wf.getframerate()
            all_frames.append(wf.readframes(wf.getnframes()))
    combined = b"".join(all_frames)
    out_buf = io.BytesIO()
    with wave.open(out_buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(combined)
    return out_buf.getvalue()

def analyze_pitch_factor(audio_bytes: bytes) -> tuple[float, float]:
    try:
        buf = io.BytesIO(audio_bytes)
        import soundfile as sf
        data, sr = sf.read(buf)
        if data.ndim > 1:
            data = data.mean(axis=1)
        zcr = np.mean(np.abs(np.diff(np.sign(data)))) / 2
        baseline_zcr = 0.08
        pitch_factor = float(np.clip(baseline_zcr / max(zcr, 0.01), 0.7, 1.4))
        return pitch_factor, 1.0
    except Exception as e:
        logger.warning(f"Pitch analysis failed: {e}, using defaults")
        return 1.0, 1.0

def find_best_voice(pitch_factor: float) -> str:
    if pitch_factor < 0.9:
        return "am_adam"
    elif pitch_factor > 1.1:
        return "af_sky"
    return "af_sky"

def apply_pitch_shift(samples: np.ndarray, sample_rate: int, pitch_factor: float) -> np.ndarray:
    if abs(pitch_factor - 1.0) < 0.02:
        return samples
    new_length = int(len(samples) / pitch_factor)
    indices = np.linspace(0, len(samples) - 1, new_length)
    return np.interp(indices, np.arange(len(samples)), samples).astype(np.float32)

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _kokoro is not None}

@app.get("/voices")
def list_voices():
    return {"voices": VOICES}

@app.post("/preview")
async def preview_voice(payload: dict):
    """Generate a short sample clip for a voice (cached)."""
    voice_id = payload.get("voiceId") or "af_sky"
    if voice_id not in VOICE_IDS:
        voice_id = "af_sky"

    cache_key = voice_id
    if cache_key in _preview_cache:
        return Response(content=_preview_cache[cache_key], media_type="audio/wav")

    try:
        kokoro = get_kokoro()
        samples, sr = kokoro.create(PREVIEW_TEXT, voice=voice_id, speed=1.0, lang="en-us")
        wav = samples_to_wav_bytes(np.array(samples), sr)
        _preview_cache[cache_key] = wav
        return Response(content=wav, media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/speak")
async def speak(payload: dict):
    text = (payload.get("text") or "").strip()
    voice_id = payload.get("voiceId") or "af_sky"
    speed = float(payload.get("speed") or 1.0)
    pitch_factor = float(payload.get("pitchFactor") or 1.0)

    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if voice_id not in VOICE_IDS:
        voice_id = "af_sky"
    speed = max(0.5, min(2.0, speed))

    try:
        kokoro = get_kokoro()
        sentences = split_sentences(text[:3000])
        wav_chunks = []
        for sentence in sentences:
            if not sentence.strip():
                continue
            samples, sr = kokoro.create(sentence, voice=voice_id, speed=speed, lang="en-us")
            samples = np.array(samples)
            if abs(pitch_factor - 1.0) > 0.02:
                samples = apply_pitch_shift(samples, sr, pitch_factor)
            wav_chunks.append(samples_to_wav_bytes(samples, sr))

        combined = concat_wav_bytes(wav_chunks)
        return Response(content=combined, media_type="audio/wav")
    except Exception as e:
        logger.error(f"Speak error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/speak/stream")
async def speak_stream(payload: dict):
    """Stream audio sentence by sentence as NDJSON with base64 WAV chunks."""
    text = (payload.get("text") or "").strip()
    voice_id = payload.get("voiceId") or "af_sky"
    speed = float(payload.get("speed") or 1.0)
    pitch_factor = float(payload.get("pitchFactor") or 1.0)

    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if voice_id not in VOICE_IDS:
        voice_id = "af_sky"
    speed = max(0.5, min(2.0, speed))

    sentences = [s for s in split_sentences(text[:3000]) if s.strip()]

    async def generate():
        try:
            kokoro = get_kokoro()
            total = len(sentences)
            for i, sentence in enumerate(sentences):
                samples, sr = kokoro.create(sentence, voice=voice_id, speed=speed, lang="en-us")
                samples = np.array(samples)
                if abs(pitch_factor - 1.0) > 0.02:
                    samples = apply_pitch_shift(samples, sr, pitch_factor)
                wav = samples_to_wav_bytes(samples, sr)
                chunk = {
                    "chunk": base64.b64encode(wav).decode(),
                    "index": i,
                    "total": total,
                    "done": i == total - 1,
                }
                yield json.dumps(chunk) + "\n"
        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield json.dumps({"error": str(e), "done": True}) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")

from video_routes import router as video_router
app.include_router(video_router)

@app.post("/clone/analyze")
async def clone_analyze(payload: dict):
    audio_b64 = payload.get("audioBase64")
    if not audio_b64:
        raise HTTPException(status_code=400, detail="audioBase64 required")
    try:
        audio_bytes = base64.b64decode(audio_b64)
        pitch_factor, speed_factor = analyze_pitch_factor(audio_bytes)
        best_voice = find_best_voice(pitch_factor)
        return {"pitchFactor": pitch_factor, "speedFactor": speed_factor, "baseVoiceId": best_voice}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
