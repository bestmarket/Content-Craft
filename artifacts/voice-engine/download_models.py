"""Downloads kokoro-onnx model files if they are not already present."""
import urllib.request
import os
import sys

MODELS = {
    "kokoro-v1.0.onnx": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx",
    "voices-v1.0.bin":  "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin",
}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def download(name: str, url: str):
    dest = os.path.join(SCRIPT_DIR, name)
    if os.path.exists(dest):
        print(f"[voice-engine] {name} already present — skipping.")
        return
    print(f"[voice-engine] Downloading {name} …", flush=True)
    tmp = dest + ".tmp"
    try:
        urllib.request.urlretrieve(url, tmp)
        os.rename(tmp, dest)
        size_mb = os.path.getsize(dest) / 1024 / 1024
        print(f"[voice-engine] {name} downloaded ({size_mb:.1f} MB)", flush=True)
    except Exception as e:
        if os.path.exists(tmp):
            os.remove(tmp)
        print(f"[voice-engine] ERROR downloading {name}: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    for name, url in MODELS.items():
        download(name, url)
    print("[voice-engine] All model files ready.", flush=True)
