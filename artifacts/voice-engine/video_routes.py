"""
Selovox Video Engine v5 — ULTRA HD Animated MP4 Generator

Resolution: 1920×1080 (3× supersampled at 5760×3240)
FPS: 30  |  CRF 16  |  libx264 high profile

Animation Types:
  zoom_3d · slide_up · kinetic · particle_burst · material_drop
  morph_in · character_walk · neon_glow · glitch_slide · wave_slide
  matrix_drop · reveal_left · bounce_in · split_reveal

Scene Types:
  title · body · feature · stats · product · character · cta · comparison

14 Visual Styles:
  dark_pro · neon · cinematic · tech_dark · retro_wave · clean_light
  luxury_gold · corporate · sunset · particles_dark
  product_launch · minimal_pro · blueprint · neon_urban
"""

import asyncio, io, json, logging, math, os, random, re, shutil, subprocess
import urllib.request, uuid, wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/video")

SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "video_output"
OUTPUT_DIR.mkdir(exist_ok=True)

# ── Output resolution: full HD ─────────────────────────────────────────────────
W, H   = 1920, 1080        # final output
SCALE  = 3                 # supersampling factor
SW, SH = W * SCALE, H * SCALE  # 5760 × 3240

FPS      = 30
INTRO_F  = 20   # ~0.67 s
OUTRO_F  = 15   # ~0.50 s

# ── Font setup ─────────────────────────────────────────────────────────────────
FONT_BOLD    = SCRIPT_DIR / "Poppins-Bold.ttf"
FONT_REGULAR = SCRIPT_DIR / "Poppins-Regular.ttf"
FONT_SEMI    = SCRIPT_DIR / "Poppins-SemiBold.ttf"
FONT_LIGHT   = SCRIPT_DIR / "Poppins-Light.ttf"

_FONT_URLS = {
    "Poppins-Bold.ttf":     "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf",
    "Poppins-Regular.ttf":  "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf",
    "Poppins-SemiBold.ttf": "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-SemiBold.ttf",
    "Poppins-Light.ttf":    "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Light.ttf",
}

def ensure_fonts() -> None:
    for fname, url in _FONT_URLS.items():
        dest = SCRIPT_DIR / fname
        if dest.exists():
            continue
        tmp = str(dest) + ".tmp"
        try:
            urllib.request.urlretrieve(url, tmp)
            os.rename(tmp, str(dest))
        except Exception as e:
            logger.warning(f"Font {fname} download failed: {e}")
            if os.path.exists(tmp):
                os.remove(tmp)

def load_font(path: Path, size: int):
    if path.exists():
        try:
            return ImageFont.truetype(str(path), size)
        except Exception:
            pass
    return ImageFont.load_default(size=max(10, size))

# ── 14 Visual Styles ───────────────────────────────────────────────────────────
STYLES: dict = {
    "dark_pro": {
        "bg": (10, 8, 24),      "g1": (109, 40, 217),  "g2": (219, 39, 119),
        "text": (255,255,255),  "sub": (196,181,253),  "accent": (139,92,246),
        "eye": (167,139,250),   "anim": "zoom_3d",     "bg_fx": "gradient",
        "char_color": (139,92,246), "card_bg": (25,20,50),
    },
    "neon": {
        "bg": (2, 5, 14),       "g1": (0, 210, 130),   "g2": (0, 170, 255),
        "text": (240,255,255),  "sub": (134,239,172),  "accent": (0,230,140),
        "eye": (52,211,153),    "anim": "glitch_slide", "bg_fx": "grid",
        "char_color": (0,230,140), "card_bg": (8,20,30),
    },
    "cinematic": {
        "bg": (4, 4, 4),        "g1": (161,124,26),    "g2": (212,175,55),
        "text": (255,255,255),  "sub": (212,175,55),   "accent": (212,175,55),
        "eye": (180,155,60),    "anim": "zoom_3d",     "bg_fx": "gradient",
        "char_color": (212,175,55), "card_bg": (18,15,5),
    },
    "tech_dark": {
        "bg": (3, 10, 3),       "g1": (0, 185, 50),    "g2": (0, 100, 25),
        "text": (180,255,180),  "sub": (100,230,120),  "accent": (0,200,70),
        "eye": (80,200,100),    "anim": "matrix_drop", "bg_fx": "matrix",
        "char_color": (0,200,70), "card_bg": (5,20,5),
    },
    "retro_wave": {
        "bg": (18, 4, 32),      "g1": (255, 45, 170),  "g2": (75, 0, 210),
        "text": (255,240,255),  "sub": (255,150,230),  "accent": (255,45,170),
        "eye": (220,100,255),   "anim": "wave_slide",  "bg_fx": "wave_grid",
        "char_color": (255,45,170), "card_bg": (30,8,50),
    },
    "clean_light": {
        "bg": (248,249,250),    "g1": (79, 70, 229),   "g2": (16,185,129),
        "text": (15, 23, 42),   "sub": (71, 85,105),   "accent": (79,70,229),
        "eye": (99,102,241),    "anim": "slide_up",    "bg_fx": "gradient",
        "char_color": (79,70,229), "card_bg": (235,237,255),
    },
    "luxury_gold": {
        "bg": (8, 6, 18),       "g1": (212,175,55),    "g2": (180,135,15),
        "text": (255,248,220),  "sub": (212,175,55),   "accent": (212,175,55),
        "eye": (180,155,60),    "anim": "zoom_3d",     "bg_fx": "dots",
        "char_color": (212,175,55), "card_bg": (20,16,5),
    },
    "corporate": {
        "bg": (240,245,255),    "g1": (37, 99,235),    "g2": (6, 182,212),
        "text": (15, 23, 42),   "sub": (71, 85,105),   "accent": (37,99,235),
        "eye": (99,102,241),    "anim": "slide_up",    "bg_fx": "gradient",
        "char_color": (37,99,235), "card_bg": (220,230,255),
    },
    "sunset": {
        "bg": (18, 6, 2),       "g1": (251,113,33),    "g2": (239, 68, 68),
        "text": (255,250,245),  "sub": (253,186,116),  "accent": (251,113,33),
        "eye": (253,186,116),   "anim": "zoom_3d",     "bg_fx": "gradient",
        "char_color": (251,113,33), "card_bg": (30,10,5),
    },
    "particles_dark": {
        "bg": (5, 4, 16),       "g1": (124, 58,237),   "g2": (219, 39,119),
        "text": (255,255,255),  "sub": (196,181,253),  "accent": (167,139,250),
        "eye": (196,181,253),   "anim": "particle_burst", "bg_fx": "particles",
        "char_color": (167,139,250), "card_bg": (15,10,35),
    },
    # ── 4 New Styles ──────────────────────────────────────────────────────────
    "product_launch": {
        "bg": (6, 2, 14),       "g1": (255, 60,120),   "g2": (255,160,30),
        "text": (255,255,255),  "sub": (255,200,100),  "accent": (255,80,140),
        "eye": (255,180,80),    "anim": "bounce_in",   "bg_fx": "launch_sparks",
        "char_color": (255,80,140), "card_bg": (25,8,20),
    },
    "minimal_pro": {
        "bg": (255,255,255),    "g1": (30, 30, 40),    "g2": (100,100,120),
        "text": (10,10,20),     "sub": (80,80,100),    "accent": (30,30,40),
        "eye": (60,60,80),      "anim": "material_drop","bg_fx": "minimal_lines",
        "char_color": (30,30,40), "card_bg": (245,245,248),
    },
    "blueprint": {
        "bg": (8, 20, 50),      "g1": (50,150,255),    "g2": (30,200,255),
        "text": (200,230,255),  "sub": (130,180,240),  "accent": (80,180,255),
        "eye": (100,200,255),   "anim": "reveal_left", "bg_fx": "blueprint_grid",
        "char_color": (80,180,255), "card_bg": (15,30,65),
    },
    "neon_urban": {
        "bg": (5, 5, 8),        "g1": (255,220,0),     "g2": (255,100,0),
        "text": (255,255,255),  "sub": (255,230,120),  "accent": (255,220,0),
        "eye": (255,200,50),    "anim": "neon_glow",   "bg_fx": "urban_grid",
        "char_color": (255,220,0), "card_bg": (15,15,20),
    },
}

# ── Caption styles ─────────────────────────────────────────────────────────────
CAPTION_CONFIG: dict = {
    "none":     None,
    "subtitle": {"mode": "bar",    "font_size": 36, "color": (255,255,255), "bar_alpha": 175, "bar_color": (0,0,0)},
    "bold":     {"mode": "outline","font_size": 44, "color": (255,218,0),  "outline": 6},
    "minimal":  {"mode": "plain",  "font_size": 28, "color": (220,220,220)},
    "box":      {"mode": "box",    "font_size": 36, "color": (255,255,255)},
    "neon":     {"mode": "neon",   "font_size": 40, "color": (0,255,200),  "glow": (0,200,150)},
}

# ── In-memory job store ────────────────────────────────────────────────────────
_jobs: dict = {}

# ── Easing functions ───────────────────────────────────────────────────────────
def ease_out_cubic(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3

def ease_in_cubic(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t ** 3

def ease_out_back(t: float) -> float:
    t = max(0.0, min(1.0, t))
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2

def ease_out_elastic(t: float) -> float:
    t = max(0.0, min(1.0, t))
    if t == 0 or t == 1:
        return t
    return (2 ** (-10 * t)) * math.sin((t * 10 - 0.75) * (2 * math.pi) / 3) + 1

def ease_in_out_sine(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return -(math.cos(math.pi * t) - 1) / 2

def bounce_ease(t: float) -> float:
    t = max(0.0, min(1.0, t))
    n1, d1 = 7.5625, 2.75
    if t < 1 / d1:
        return n1 * t * t
    elif t < 2 / d1:
        t -= 1.5 / d1
        return n1 * t * t + 0.75
    elif t < 2.5 / d1:
        t -= 2.25 / d1
        return n1 * t * t + 0.9375
    else:
        t -= 2.625 / d1
        return n1 * t * t + 0.984375

# ── Colour helpers ─────────────────────────────────────────────────────────────
def blend_rgb(c1, c2, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

def with_alpha(color, alpha):
    if len(color) == 3:
        return (*color, int(alpha))
    return (*color[:3], int(alpha))

def lighten(c, amt=40):
    return tuple(min(255, c[i] + amt) for i in range(3))

def darken(c, amt=40):
    return tuple(max(0, c[i] - amt) for i in range(3))

# ── ═══════════════════════════════════════════════════════════════════════════
# ── BACKGROUND GENERATORS
# ── ═══════════════════════════════════════════════════════════════════════════

def _draw_gradient(img: Image.Image, s: dict) -> None:
    bg, g1, g2 = s["bg"], s["g1"], s["g2"]
    iw, ih = img.size
    arr = np.zeros((ih, iw, 3), dtype=np.uint8)
    arr[:] = bg
    # Radial spotlight
    cy_spot = ih // 4
    for y in range(ih):
        dy = abs(y - cy_spot) / ih
        alpha_top = 0.50 * max(0, 1 - dy * 2.0)
        arr[y] = [int(bg[c] + (g1[c] - bg[c]) * alpha_top) for c in range(3)]
    # Bottom glow — vectorized to avoid numpy scalar conversion error
    for y in range(ih // 2, ih):
        tb = (y - ih // 2) / (ih // 2)
        alpha_bot = 0.30 * tb * tb
        g2_arr = np.array(g2, dtype=np.float32)
        arr[y] = np.clip(
            arr[y].astype(np.float32) + (g2_arr - arr[y].astype(np.float32)) * alpha_bot,
            0, 255
        ).astype(np.uint8)
    img.paste(Image.fromarray(arr.astype(np.uint8)), (0, 0))

def _draw_vignette(img: Image.Image, strength: float = 0.70) -> None:
    iw, ih = img.size
    cx, cy = iw / 2, ih / 2
    arr = np.zeros((ih, iw), dtype=np.float32)
    # Vectorized vignette
    ys = np.arange(ih)
    xs = np.arange(iw)
    X, Y = np.meshgrid(xs, ys)
    dx = (X - cx) / cx
    dy = (Y - cy) / cy
    d = np.sqrt(dx * dx + dy * dy * 0.7).clip(0, 1)
    arr = (d * d * strength).clip(0, 1)
    vig = Image.fromarray((arr * 255).astype(np.uint8), "L")
    dark = Image.new("RGB", (iw, ih), (0, 0, 0))
    img.paste(dark, mask=vig)

def _draw_particles(img: Image.Image, s: dict, seed: int = 0, t: float = 0.0) -> None:
    iw, ih = img.size
    draw = ImageDraw.Draw(img, "RGBA")
    rng  = random.Random(seed)
    g1, g2 = s["g1"], s["g2"]
    # Animated large orbs
    for i in range(12):
        x_base = rng.randint(0, iw)
        y_base = rng.randint(0, ih)
        drift_x = int(math.sin(t * math.pi * 2 + i) * (iw // 25))
        drift_y = int(math.cos(t * math.pi * 1.5 + i * 0.7) * (ih // 25))
        x, y = x_base + drift_x, y_base + drift_y
        r = rng.randint(iw // 20, iw // 9)
        tc = rng.random()
        c = blend_rgb(g1, g2, tc)
        a = rng.randint(15, 40)
        draw.ellipse([(x - r, y - r), (x + r, y + r)], fill=(*c, a))
    # Small crisp particles
    for i in range(180):
        x = rng.randint(0, iw)
        y = rng.randint(0, ih)
        y_anim = (y + int(t * ih * 0.08)) % ih
        r = rng.randint(2, 10)
        tc = rng.random()
        c = blend_rgb(g1, g2, tc)
        a = rng.randint(50, 160)
        draw.ellipse([(x - r, y_anim - r), (x + r, y_anim + r)], fill=(*c, a))
    # Light streaks
    for i in range(8):
        x1 = rng.randint(0, iw)
        y1 = rng.randint(0, ih // 2)
        ln = rng.randint(iw // 8, iw // 4)
        angle = rng.uniform(-0.4, 0.4)
        x2 = x1 + int(ln * math.cos(angle))
        y2 = y1 + int(ln * math.sin(angle))
        a = rng.randint(15, 45)
        draw.line([(x1, y1), (x2, y2)], fill=(*g1, a), width=rng.randint(1, 4))

def _draw_matrix(img: Image.Image, s: dict, t: float = 0.0) -> None:
    iw, ih = img.size
    col_w = iw // 80
    draw  = ImageDraw.Draw(img, "RGBA")
    rng   = random.Random(77)
    g1 = s["g1"]
    for col in range(0, iw, col_w):
        start = (rng.randint(0, ih) + int(t * ih * 0.3)) % ih
        length = rng.randint(8, 22)
        for i in range(length):
            y = (start + i * (ih // 56)) % ih
            a = max(15, 130 - i * 7)
            draw.rectangle([(col, y), (col + max(2, col_w // 8), y + ih // 70)], fill=(*g1, a))

def _draw_wave_grid(img: Image.Image, s: dict) -> None:
    iw, ih = img.size
    draw = ImageDraw.Draw(img, "RGBA")
    g1, g2 = s["g1"], s["g2"]
    for i in range(1, 24):
        y = int(ih * (i / 24) ** 1.5)
        a = int(18 + (i / 24) * 80)
        draw.line([(0, y), (iw, y)], fill=(*g2, a), width=max(1, iw // 800))
    cx = iw // 2
    for i in range(-14, 15):
        x_bot = cx + i * (iw // 14)
        x_top = cx + i * (iw // 35)
        a = max(10, 70 - abs(i) * 5)
        draw.line([(x_bot, ih), (x_top, ih // 3)], fill=(*g1, a), width=max(1, iw // 800))
    sun_y = ih // 3
    for r in range(iw // 5, 0, -iw // 50):
        a = max(4, 40 - r // (iw // 100))
        draw.ellipse([(cx - r, sun_y - r // 3), (cx + r, sun_y + r // 3)],
                     outline=(*g1, a), width=max(1, iw // 800))

def _draw_dots(img: Image.Image, s: dict) -> None:
    iw, ih = img.size
    draw  = ImageDraw.Draw(img, "RGBA")
    rng   = random.Random(99)
    g1 = s["g1"]
    dot_space = iw // 45
    for row in range(0, ih, dot_space):
        offset = (dot_space // 2) if (row // dot_space) % 2 else 0
        for col in range(offset, iw, dot_space):
            a = rng.randint(20, 65)
            r = rng.randint(2, 6)
            draw.ellipse([(col - r, row - r), (col + r, row + r)], fill=(*g1, a))

def _draw_grid_lines(img: Image.Image, s: dict) -> None:
    iw, ih = img.size
    draw   = ImageDraw.Draw(img, "RGBA")
    step   = iw // 24
    lw     = max(1, iw // 800)
    g1 = s["g1"]
    for x in range(0, iw, step):
        a = 28 if x % (step * 4) == 0 else 12
        draw.line([(x, 0), (x, ih)], fill=(*g1, a), width=lw)
    for y in range(0, ih, step):
        a = 28 if y % (step * 4) == 0 else 12
        draw.line([(0, y), (iw, y)], fill=(*g1, a), width=lw)

def _draw_launch_sparks(img: Image.Image, s: dict, seed: int = 0) -> None:
    """Energetic launch background with rays and sparks."""
    iw, ih = img.size
    draw = ImageDraw.Draw(img, "RGBA")
    g1, g2 = s["g1"], s["g2"]
    # Sunburst rays from centre
    cx, cy = iw // 2, ih // 2
    for i in range(0, 360, 12):
        angle = math.radians(i)
        length = rng2 = random.Random(seed + i)
        ln = rng2.randint(iw // 6, iw // 2)
        x2 = cx + int(math.cos(angle) * ln)
        y2 = cy + int(math.sin(angle) * ln)
        a = rng2.randint(8, 28)
        c = blend_rgb(g1, g2, i / 360)
        draw.line([(cx, cy), (x2, y2)], fill=(*c, a), width=max(1, iw // 600))
    # Spark particles
    rng = random.Random(seed + 500)
    for _ in range(80):
        x, y = rng.randint(0, iw), rng.randint(0, ih)
        r = rng.randint(2, 8)
        c = blend_rgb(g1, g2, rng.random())
        draw.ellipse([(x-r, y-r), (x+r, y+r)], fill=(*c, rng.randint(60,180)))

def _draw_minimal_lines(img: Image.Image, s: dict) -> None:
    iw, ih = img.size
    draw = ImageDraw.Draw(img, "RGBA")
    g1 = s["g1"]
    # Subtle horizontal rules
    for i in range(1, 8):
        y = ih * i // 8
        draw.line([(0, y), (iw, y)], fill=(*g1, 12), width=max(1, iw // 1200))
    # Corner accent
    corner_size = iw // 12
    draw.rectangle([(0, 0), (corner_size, max(2, iw // 800))], fill=(*g1, 180))
    draw.rectangle([(0, 0), (max(2, iw // 800), corner_size)], fill=(*g1, 180))

def _draw_blueprint_grid(img: Image.Image, s: dict) -> None:
    iw, ih = img.size
    draw = ImageDraw.Draw(img, "RGBA")
    g1, g2 = s["g1"], s["g2"]
    step = iw // 32
    # Minor grid
    for x in range(0, iw, step):
        draw.line([(x, 0), (x, ih)], fill=(*g2, 18), width=1)
    for y in range(0, ih, step):
        draw.line([(0, y), (iw, y)], fill=(*g2, 18), width=1)
    # Major grid
    major = step * 4
    for x in range(0, iw, major):
        draw.line([(x, 0), (x, ih)], fill=(*g1, 45), width=max(1, iw // 1200))
    for y in range(0, ih, major):
        draw.line([(0, y), (iw, y)], fill=(*g1, 45), width=max(1, iw // 1200))
    # Center crosshair
    cx, cy = iw // 2, ih // 2
    cs = iw // 20
    draw.line([(cx - cs, cy), (cx + cs, cy)], fill=(*g1, 60), width=max(2, iw // 800))
    draw.line([(cx, cy - cs), (cx, cy + cs)], fill=(*g1, 60), width=max(2, iw // 800))
    draw.ellipse([(cx - cs//2, cy - cs//2), (cx + cs//2, cy + cs//2)], outline=(*g1, 40), width=max(1, iw//1200))

def _draw_urban_grid(img: Image.Image, s: dict) -> None:
    iw, ih = img.size
    draw = ImageDraw.Draw(img, "RGBA")
    g1, g2 = s["g1"], s["g2"]
    step = iw // 18
    for x in range(0, iw, step):
        draw.line([(x, 0), (x, ih)], fill=(*g1, 15), width=max(1, iw//1200))
    for y in range(0, ih, step):
        draw.line([(0, y), (iw, y)], fill=(*g2, 12), width=max(1, iw//1200))
    # Corner neon accents
    bw = max(6, iw // 200)
    for y in range(ih):
        c = blend_rgb(g1, g2, y / ih)
        draw.rectangle([(0, y), (bw, y)], fill=(*c, 255))
        draw.rectangle([(iw - bw, y), (iw, y)], fill=(*c, 120))

def draw_background(img: Image.Image, s: dict, t: float = 0.0) -> None:
    iw, ih = img.size
    draw = ImageDraw.Draw(img)
    draw.rectangle([(0, 0), (iw, ih)], fill=s["bg"])
    _draw_gradient(img, s)

    fx = s.get("bg_fx", "gradient")
    if fx == "particles":      _draw_particles(img, s, seed=0, t=t)
    elif fx == "matrix":       _draw_matrix(img, s, t=t)
    elif fx == "wave_grid":    _draw_wave_grid(img, s)
    elif fx == "dots":         _draw_dots(img, s)
    elif fx == "grid":         _draw_grid_lines(img, s)
    elif fx == "launch_sparks":_draw_launch_sparks(img, s)
    elif fx == "minimal_lines":_draw_minimal_lines(img, s)
    elif fx == "blueprint_grid":_draw_blueprint_grid(img, s)
    elif fx == "urban_grid":   _draw_urban_grid(img, s)

    if s["bg"][0] < 50 and s["bg"][1] < 50 and s["bg"][2] < 50:
        _draw_vignette(img, 0.60)

    # Gradient accent bar (left edge)
    bar_w = max(8, iw // 180)
    draw2 = ImageDraw.Draw(img, "RGBA")
    for y in range(ih):
        c = blend_rgb(s["g1"], s["g2"], y / ih)
        draw2.rectangle([(0, y), (bar_w, y)], fill=(*c, 255))

# ── ═══════════════════════════════════════════════════════════════════════════
# ── TYPOGRAPHY SYSTEM
# ── ═══════════════════════════════════════════════════════════════════════════

def text_w(text: str, font, draw: ImageDraw.ImageDraw) -> int:
    try:
        return int(draw.textlength(text, font=font))
    except Exception:
        bb = font.getbbox(text)
        return bb[2] - bb[0]

def text_h(font) -> int:
    bb = font.getbbox("Ag")
    return bb[3] - bb[1]

def wrap_lines(text: str, font, max_w: int, draw: ImageDraw.ImageDraw) -> list:
    words = text.split()
    lines, cur = [], []
    for word in words:
        test = " ".join(cur + [word])
        if text_w(test, font, draw) > max_w and cur:
            lines.append(" ".join(cur))
            cur = [word]
        else:
            cur.append(word)
    if cur:
        lines.append(" ".join(cur))
    return lines

def draw_centered_text(draw: ImageDraw.ImageDraw, text: str, font, color,
                       cy: int, iw: int = SW) -> int:
    tw = text_w(text, font, draw)
    bb = font.getbbox(text)
    th = bb[3] - bb[1]
    draw.text(((iw - tw) // 2, cy - th // 2), text, font=font, fill=color)
    return th

def draw_text_with_outline(draw, text, font, color, cx, cy, outline=6,
                           outline_color=(0,0,0,230), iw: int = SW):
    tw = text_w(text, font, draw)
    x  = (iw - tw) // 2 if cx < 0 else cx - tw // 2
    bb = font.getbbox(text)
    y  = cy - (bb[3] - bb[1]) // 2
    for dx in range(-outline, outline + 1):
        for dy in range(-outline, outline + 1):
            if abs(dx) + abs(dy) > 0:
                draw.text((x + dx, y + dy), text, font=font, fill=outline_color)
    draw.text((x, y), text, font=font, fill=color)

def draw_glowing_text(img: Image.Image, draw: ImageDraw.ImageDraw, text: str,
                      font, color, cy: int, glow_color=None, glow_strength: float = 1.0,
                      iw: int = SW) -> None:
    tw = text_w(text, font, draw)
    x  = (iw - tw) // 2
    bb = font.getbbox(text)
    y  = cy - (bb[3] - bb[1]) // 2

    if glow_color:
        glow_img = Image.new("RGBA", img.size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow_img)
        for off in [(-4,0),(4,0),(0,-4),(0,4),(-3,-3),(3,-3),(-3,3),(3,3),(-2,0),(2,0),(0,-2),(0,2)]:
            gd.text((x + off[0]*4, y + off[1]*4), text, font=font,
                    fill=(*glow_color[:3], int(90 * glow_strength)))
        glow_blurred = glow_img.filter(ImageFilter.GaussianBlur(radius=int(20 * glow_strength)))
        img.paste(glow_blurred, (0, 0), glow_blurred)

    draw.text((x, y), text, font=font, fill=color)

def draw_neon_text(img: Image.Image, text: str, font, color, glow_color,
                   cy: int, iw: int = SW, flicker: float = 1.0) -> None:
    """Neon sign effect — layered glow with optional flicker alpha."""
    draw = ImageDraw.Draw(img, "RGBA")
    tw = text_w(text, font, draw)
    x  = (iw - tw) // 2
    bb = font.getbbox(text)
    y  = cy - (bb[3] - bb[1]) // 2

    # Multiple glow layers
    for radius, alpha in [(30, 40), (20, 70), (12, 100), (6, 150)]:
        g = Image.new("RGBA", img.size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(g)
        gd.text((x, y), text, font=font, fill=(*glow_color, int(alpha * flicker)))
        g = g.filter(ImageFilter.GaussianBlur(radius=radius))
        img.paste(g, (0, 0), g)

    # Core text
    draw.text((x, y), text, font=font, fill=(*color, int(255 * min(1.0, flicker))))

# ── ═══════════════════════════════════════════════════════════════════════════
# ── HUMAN CHARACTER ANIMATION SYSTEM
# ── ═══════════════════════════════════════════════════════════════════════════

class Character:
    """
    Articulated stick figure with animated joints.
    All coords are in the supersampled space (SW × SH).
    """

    def __init__(self, cx: int, cy: int, scale: float, color: tuple, t: float, pose: str = "presenting"):
        self.cx = cx
        self.cy = cy
        self.sc = scale       # pixels per unit (1 unit = body segment)
        self.color = color
        self.lw = max(4, int(scale * 0.12))  # line width
        self.t = t
        self.pose = pose
        self._compute_joints()

    def _u(self, units: float) -> int:
        return int(units * self.sc)

    def _compute_joints(self):
        t = self.t
        sc = self.sc
        cx, cy = self.cx, self.cy

        # Floating bob (subtle vertical oscillation)
        bob = math.sin(t * math.pi * 2) * self._u(0.08)

        # Head
        head_r = self._u(0.55)
        self.head = (cx, int(cy - self._u(3.2) + bob), head_r)

        # Neck / torso
        self.neck = (cx, int(cy - self._u(2.5) + bob))
        self.shoulder = (cx, int(cy - self._u(1.8) + bob))
        self.hip = (cx, int(cy + bob))
        self.torso_bottom = self.hip

        # Pose-specific arm/leg positions
        if self.pose == "presenting":
            # Right arm raised, pointing right
            arm_swing = math.sin(t * math.pi * 2) * self._u(0.1)
            self.r_elbow = (cx + self._u(1.5), int(cy - self._u(1.2) + bob + arm_swing))
            self.r_hand  = (cx + self._u(2.8), int(cy - self._u(2.2) + bob + arm_swing))
            # Left arm slightly down
            self.l_elbow = (cx - self._u(1.4), int(cy - self._u(1.0) + bob))
            self.l_hand  = (cx - self._u(1.2), int(cy + self._u(0.2) + bob))
            # Standing legs
            leg_sway = math.sin(t * math.pi * 4) * self._u(0.04)
            self.r_knee = (cx + self._u(0.4) + int(leg_sway), int(cy + self._u(1.4)))
            self.r_foot = (cx + self._u(0.7) + int(leg_sway), int(cy + self._u(2.8)))
            self.l_knee = (cx - self._u(0.4) - int(leg_sway), int(cy + self._u(1.4)))
            self.l_foot = (cx - self._u(0.7) - int(leg_sway), int(cy + self._u(2.8)))

        elif self.pose == "celebrating":
            # Both arms raised in V
            arm_wave = math.sin(t * math.pi * 4) * self._u(0.3)
            self.r_elbow = (cx + self._u(1.6), int(cy - self._u(1.5) + bob))
            self.r_hand  = (cx + self._u(2.4), int(cy - self._u(3.0) + bob + arm_wave))
            self.l_elbow = (cx - self._u(1.6), int(cy - self._u(1.5) + bob))
            self.l_hand  = (cx - self._u(2.4), int(cy - self._u(3.0) + bob - arm_wave))
            # Jumping legs — knees bent
            jump_h = abs(math.sin(t * math.pi * 2)) * self._u(0.3)
            self.r_knee = (cx + self._u(0.7), int(cy + self._u(1.0) - jump_h))
            self.r_foot = (cx + self._u(0.4), int(cy + self._u(2.5) - jump_h))
            self.l_knee = (cx - self._u(0.7), int(cy + self._u(1.0) - jump_h))
            self.l_foot = (cx - self._u(0.4), int(cy + self._u(2.5) - jump_h))

        elif self.pose == "walking":
            # Alternating arm/leg swing
            swing = math.sin(t * math.pi * 4)
            arm_sw = self._u(0.8) * swing
            leg_sw = self._u(0.6) * swing
            self.r_elbow = (cx + self._u(1.3), int(cy - self._u(1.0) + bob + arm_sw * 0.5))
            self.r_hand  = (cx + self._u(1.8), int(cy - self._u(0.2) + bob + arm_sw))
            self.l_elbow = (cx - self._u(1.3), int(cy - self._u(1.0) + bob - arm_sw * 0.5))
            self.l_hand  = (cx - self._u(1.8), int(cy - self._u(0.2) + bob - arm_sw))
            self.r_knee  = (cx + self._u(0.5 + 0.3 * swing), int(cy + self._u(1.4)))
            self.r_foot  = (cx + self._u(0.8 + 0.5 * swing), int(cy + self._u(2.7)))
            self.l_knee  = (cx - self._u(0.5 - 0.3 * swing), int(cy + self._u(1.4)))
            self.l_foot  = (cx - self._u(0.8 - 0.5 * swing), int(cy + self._u(2.7)))

        elif self.pose == "thinking":
            # One hand to chin, looking thoughtful
            think_bob = math.sin(t * math.pi * 1.5) * self._u(0.05)
            self.r_elbow = (cx + self._u(1.2), int(cy - self._u(1.0) + bob))
            self.r_hand  = (cx + self._u(0.4), int(cy - self._u(2.0) + bob + think_bob))
            self.l_elbow = (cx - self._u(1.4), int(cy - self._u(0.9) + bob))
            self.l_hand  = (cx - self._u(1.8), int(cy + self._u(0.2) + bob))
            self.r_knee  = (cx + self._u(0.4), int(cy + self._u(1.4)))
            self.r_foot  = (cx + self._u(0.7), int(cy + self._u(2.8)))
            self.l_knee  = (cx - self._u(0.4), int(cy + self._u(1.4)))
            self.l_foot  = (cx - self._u(0.7), int(cy + self._u(2.8)))

        else:  # standing
            self.r_elbow = (cx + self._u(1.4), int(cy - self._u(1.0) + bob))
            self.r_hand  = (cx + self._u(1.6), int(cy + self._u(0.2) + bob))
            self.l_elbow = (cx - self._u(1.4), int(cy - self._u(1.0) + bob))
            self.l_hand  = (cx - self._u(1.6), int(cy + self._u(0.2) + bob))
            self.r_knee  = (cx + self._u(0.4), int(cy + self._u(1.4)))
            self.r_foot  = (cx + self._u(0.7), int(cy + self._u(2.8)))
            self.l_knee  = (cx - self._u(0.4), int(cy + self._u(1.4)))
            self.l_foot  = (cx - self._u(0.7), int(cy + self._u(2.8)))

    def draw(self, img: Image.Image, alpha_pct: float = 1.0) -> None:
        draw = ImageDraw.Draw(img, "RGBA")
        c = self.color
        a = int(255 * alpha_pct)
        lw = self.lw

        # Shadow (subtle offset below)
        shadow_off = int(self.sc * 0.15)
        shadow_a = int(60 * alpha_pct)
        sx = shadow_off
        sy = shadow_off

        def line(p1, p2, w=None, color=None):
            draw.line([p1, p2], fill=(*( color or c), a), width=w or lw)

        def circle(center, r, fill_c=None, outline_c=None):
            x, y = center
            draw.ellipse([(x-r, y-r), (x+r, y+r)],
                         fill=(*( fill_c or c), a),
                         outline=(*darken(fill_c or c, 40), a),
                         width=max(2, lw // 3))

        # Legs (draw first — behind body)
        line(self.hip, self.r_knee, w=int(lw * 1.1))
        line(self.r_knee, self.r_foot)
        line(self.hip, self.l_knee, w=int(lw * 1.1))
        line(self.l_knee, self.l_foot)

        # Foot squares (shoes)
        foot_r = int(self.sc * 0.14)
        for foot in [self.r_foot, self.l_foot]:
            draw.rectangle([(foot[0] - foot_r, foot[1] - foot_r // 2),
                             (foot[0] + foot_r, foot[1] + foot_r)],
                            fill=(*darken(c, 30), a))

        # Torso
        line(self.shoulder, self.hip, w=int(lw * 1.3))

        # Arms
        line(self.shoulder, self.r_elbow, w=int(lw * 0.95))
        line(self.r_elbow, self.r_hand)
        line(self.shoulder, self.l_elbow, w=int(lw * 0.95))
        line(self.l_elbow, self.l_hand)

        # Hands (small circles)
        hand_r = int(self.sc * 0.12)
        for hand in [self.r_hand, self.l_hand]:
            circle(hand, hand_r, fill_c=lighten(c, 20))

        # Neck
        line(self.neck, (self.neck[0], self.head[1] + self.head[2]))

        # Head
        hx, hy, hr = self.head
        circle((hx, hy), hr)

        # Eyes
        eye_r = max(2, int(hr * 0.18))
        eye_off = int(hr * 0.32)
        eye_y = hy - int(hr * 0.08)
        draw.ellipse([(hx + eye_off - eye_r, eye_y - eye_r),
                      (hx + eye_off + eye_r, eye_y + eye_r)],
                     fill=(255,255,255,a))
        draw.ellipse([(hx - eye_off - eye_r, eye_y - eye_r),
                      (hx - eye_off + eye_r, eye_y + eye_r)],
                     fill=(255,255,255,a))
        # Pupils
        pupil_r = max(1, eye_r // 2)
        draw.ellipse([(hx + eye_off - pupil_r, eye_y - pupil_r),
                      (hx + eye_off + pupil_r, eye_y + pupil_r)],
                     fill=(20,20,30,a))
        draw.ellipse([(hx - eye_off - pupil_r, eye_y - pupil_r),
                      (hx - eye_off + pupil_r, eye_y + pupil_r)],
                     fill=(20,20,30,a))

        # Smile (arc drawn as short line)
        smile_y = hy + int(hr * 0.3)
        mouth_w = int(hr * 0.5)
        if self.pose == "celebrating":
            # Big open smile
            for xi in range(-mouth_w, mouth_w, 2):
                y_arc = smile_y + int((xi / mouth_w) ** 2 * hr * 0.2)
                draw.ellipse([(hx + xi - 1, y_arc - 1), (hx + xi + 1, y_arc + 1)],
                             fill=(255,255,255,a))
        elif self.pose == "thinking":
            # Neutral/contemplative line
            draw.line([(hx - mouth_w, smile_y), (hx + mouth_w, smile_y)],
                      fill=(255,255,255,a), width=max(2, lw // 3))
        else:
            # Regular smile curve
            for xi in range(-mouth_w, mouth_w, 2):
                y_arc = smile_y + int(abs(xi / mouth_w) * hr * 0.18)
                draw.ellipse([(hx + xi - 1, y_arc - 1), (hx + xi + 1, y_arc + 1)],
                             fill=(255,255,255,a))

        # Pointing hand indicator for presenting pose
        if self.pose == "presenting":
            hand = self.r_hand
            pointer_end = (hand[0] + int(self.sc * 0.5), hand[1] - int(self.sc * 0.5))
            draw.line([hand, pointer_end], fill=(*lighten(c, 40), a), width=max(2, lw // 2))


def draw_speech_bubble(img: Image.Image, text: str, font, color: tuple,
                       tip_x: int, tip_y: int, iw: int, accent: tuple) -> None:
    """Draw a speech bubble pointing at (tip_x, tip_y)."""
    draw = ImageDraw.Draw(img, "RGBA")
    max_w = iw // 3
    lines = wrap_lines(text, font, max_w, draw)[:3]
    if not lines:
        return
    bb = font.getbbox(lines[0])
    lh = (bb[3] - bb[1]) + int(SH * 0.018)
    pad = int(SH * 0.025)
    box_w = max(text_w(ln, font, draw) for ln in lines) + pad * 2
    box_h = lh * len(lines) + pad * 2
    # Place bubble above and to the right of the character
    bx = min(iw - box_w - pad, tip_x + int(iw * 0.02))
    by = tip_y - box_h - int(SH * 0.05)

    # Shadow
    shadow = Image.new("RGBA", img.size, (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    off = int(SH * 0.005)
    sd.rounded_rectangle([(bx+off, by+off), (bx+box_w+off, by+box_h+off)],
                          radius=int(SH * 0.018), fill=(0,0,0,80))
    blurred_shadow = shadow.filter(ImageFilter.GaussianBlur(radius=8))
    img.paste(blurred_shadow, (0,0), blurred_shadow)

    # Bubble body
    overlay = Image.new("RGBA", img.size, (0,0,0,0))
    od = ImageDraw.Draw(overlay)
    od.rounded_rectangle([(bx, by), (bx+box_w, by+box_h)],
                          radius=int(SH * 0.018),
                          fill=(*lighten(color[:3] if len(color)>=3 else (30,30,50), 15), 240))
    od.rounded_rectangle([(bx, by), (bx+box_w, by+box_h)],
                          radius=int(SH * 0.018),
                          outline=(*accent, 200), width=max(3, int(SH * 0.004)))
    # Tail triangle
    tail_tip = (tip_x, tip_y)
    tail_base_l = (bx + box_w // 3, by + box_h)
    tail_base_r = (bx + box_w // 3 + int(SH * 0.04), by + box_h)
    od.polygon([tail_base_l, tail_base_r, tail_tip],
               fill=(*lighten(color[:3] if len(color)>=3 else (30,30,50), 15), 240))
    img.paste(overlay, (0,0), overlay)

    # Text
    draw2 = ImageDraw.Draw(img)
    for i, ln in enumerate(lines):
        tw = text_w(ln, font, draw2)
        draw2.text(((bx + (box_w - tw) // 2), by + pad + i * lh), ln, font=font,
                   fill=(*accent, 255))


# ── ═══════════════════════════════════════════════════════════════════════════
# ── VISUAL ELEMENT HELPERS
# ── ═══════════════════════════════════════════════════════════════════════════

def draw_material_card(img: Image.Image, x1: int, y1: int, x2: int, y2: int,
                       fill: tuple, accent: tuple, radius: int = 0, elevation: int = 3) -> None:
    """Material design card with elevation shadow."""
    iw, ih = img.size
    radius = radius or int(min(iw, ih) * 0.02)

    # Shadow layers
    for i in range(elevation, 0, -1):
        shadow = Image.new("RGBA", img.size, (0,0,0,0))
        sd = ImageDraw.Draw(shadow)
        off = i * max(2, iw // 500)
        blur_r = i * max(2, iw // 400)
        sd.rounded_rectangle([(x1+off, y1+off), (x2+off, y2+off)],
                              radius=radius, fill=(0,0,0,int(35/i)))
        blurred = shadow.filter(ImageFilter.GaussianBlur(radius=blur_r))
        img.paste(blurred, (0,0), blurred)

    # Card body
    overlay = Image.new("RGBA", img.size, (0,0,0,0))
    od = ImageDraw.Draw(overlay)
    od.rounded_rectangle([(x1, y1), (x2, y2)], radius=radius,
                          fill=(*fill, 235))
    od.rounded_rectangle([(x1, y1), (x2, y2)], radius=radius,
                          outline=(*accent, 80), width=max(2, iw // 800))
    img.paste(overlay, (0,0), overlay)

def draw_animated_checkmark(draw: ImageDraw.ImageDraw, cx: int, cy: int,
                             r: int, color: tuple, t: float) -> None:
    """Draw an animated checkmark that draws itself over t=0→1."""
    # Circle background
    draw.ellipse([(cx-r, cy-r), (cx+r, cy+r)], fill=(*color, 220))
    if t <= 0:
        return
    # Checkmark: two line segments
    # Segment 1: cx-r*0.5, cy → cx-r*0.1, cy+r*0.4 (t: 0→0.5)
    # Segment 2: cx-r*0.1, cy+r*0.4 → cx+r*0.55, cy-r*0.3 (t: 0.5→1.0)
    lw = max(2, r // 5)
    if t <= 0.5:
        prog = t / 0.5
        x1, y1 = cx - int(r * 0.45), cy
        x2_end, y2_end = cx - int(r * 0.05), cy + int(r * 0.38)
        x2 = int(x1 + (x2_end - x1) * prog)
        y2 = int(y1 + (y2_end - y1) * prog)
        draw.line([(x1, y1), (x2, y2)], fill=(255,255,255,230), width=lw)
    else:
        prog = (t - 0.5) / 0.5
        draw.line([(cx - int(r * 0.45), cy), (cx - int(r * 0.05), cy + int(r * 0.38))],
                  fill=(255,255,255,230), width=lw)
        x1, y1 = cx - int(r * 0.05), cy + int(r * 0.38)
        x2_end, y2_end = cx + int(r * 0.5), cy - int(r * 0.28)
        x2 = int(x1 + (x2_end - x1) * prog)
        y2 = int(y1 + (y2_end - y1) * prog)
        draw.line([(x1, y1), (x2, y2)], fill=(255,255,255,230), width=lw)

def draw_progress_ring(img: Image.Image, cx: int, cy: int, r: int,
                       progress: float, color: tuple, bg_color: tuple,
                       thickness: int = 8) -> None:
    """Animated circular progress indicator."""
    draw = ImageDraw.Draw(img, "RGBA")
    # Track
    draw.arc([(cx-r, cy-r), (cx+r, cy+r)], start=-90, end=270,
             fill=(*bg_color, 80), width=thickness)
    # Progress arc
    if progress > 0:
        end_angle = -90 + 360 * min(1.0, progress)
        draw.arc([(cx-r, cy-r), (cx+r, cy+r)], start=-90, end=end_angle,
                 fill=(*color, 240), width=thickness)
    # Center value text
    font = load_font(FONT_BOLD, r // 2)
    pct_text = f"{int(progress * 100)}%"
    tw = text_w(pct_text, font, draw)
    bb = font.getbbox(pct_text)
    th = bb[3] - bb[1]
    draw.text((cx - tw // 2, cy - th // 2), pct_text, font=font,
              fill=(*color, 240))

def draw_confetti_burst(img: Image.Image, cx: int, cy: int, t: float,
                        colors: list, seed: int = 0) -> None:
    """Exploding confetti particles."""
    draw = ImageDraw.Draw(img, "RGBA")
    rng  = random.Random(seed)
    n    = 60
    gravity = 0.5
    for i in range(n):
        angle   = rng.uniform(0, math.pi * 2)
        speed   = rng.uniform(0.3, 1.0)
        size    = rng.randint(int(SW * 0.003), int(SW * 0.01))
        color   = rng.choice(colors)
        # Physics
        vx = math.cos(angle) * speed * SW * 0.08
        vy = math.sin(angle) * speed * SH * 0.08
        px = cx + int(vx * t)
        py = cy + int((vy + 0.5 * gravity * SH * t) * t)
        # Fade out
        alpha = max(0, int(220 * (1 - t * 0.8)))
        if alpha > 0 and 0 <= px < SW and 0 <= py < SH:
            # Alternating shapes
            if i % 3 == 0:
                draw.rectangle([(px, py), (px + size, py + size//2)],
                               fill=(*color, alpha))
            elif i % 3 == 1:
                draw.ellipse([(px-size//2, py-size//2), (px+size//2, py+size//2)],
                             fill=(*color, alpha))
            else:
                draw.line([(px, py), (px+size, py+size)],
                          fill=(*color, alpha), width=max(2, size//3))

def draw_stat_counter(draw: ImageDraw.ImageDraw, value: str, label: str,
                      font_big, font_small, cx: int, cy: int, color: tuple,
                      t: float) -> None:
    """Animated stat with counting-up effect."""
    # Parse number from value string
    num_match = re.search(r'[\d,]+\.?\d*', value.replace(',', ''))
    animated_str = value
    if num_match and t < 1.0:
        try:
            target = float(num_match.group().replace(',', ''))
            current = target * ease_out_cubic(t)
            if target == int(target):
                current_str = f"{int(current):,}"
            else:
                current_str = f"{current:.1f}"
            animated_str = value[:num_match.start()] + current_str + value[num_match.end():]
        except Exception:
            pass

    tw = text_w(animated_str, font_big, draw)
    bb = font_big.getbbox(animated_str)
    th = bb[3] - bb[1]

    # Glow effect for numbers
    draw.text((cx - tw // 2, cy - th // 2), animated_str, font=font_big, fill=color)

    if label:
        tw2 = text_w(label, font_small, draw)
        bb2 = font_small.getbbox(label)
        th2 = bb2[3] - bb2[1]
        draw.text((cx - tw2 // 2, cy + th // 2 + int(SH * 0.01)), label,
                  font=font_small, fill=(*darken(color, 30), 200))

def draw_icon(draw: ImageDraw.ImageDraw, name: str, cx: int, cy: int,
              size: int, color: tuple, t: float = 1.0) -> None:
    """Draw simple geometric icons."""
    a = int(255 * min(1.0, t * 2))
    lw = max(3, size // 10)
    c = (*color, a)

    if name == "star":
        pts = []
        for i in range(10):
            angle = math.radians(i * 36 - 90)
            r = size if i % 2 == 0 else size // 2
            pts.append((cx + int(r * math.cos(angle)), cy + int(r * math.sin(angle))))
        if a > 10:
            draw.polygon(pts, fill=c, outline=(*darken(color,30), a))

    elif name == "rocket":
        # Simple rocket shape
        draw.polygon([(cx, cy - size), (cx + size//3, cy + size//2),
                      (cx - size//3, cy + size//2)], fill=c)
        draw.ellipse([(cx - size//6, cy + size//3), (cx + size//6, cy + size//2 + size//6)],
                     fill=(*lighten(color,30), a))

    elif name == "lightning":
        pts = [(cx, cy - size), (cx - size//4, cy),
               (cx + size//5, cy), (cx, cy + size), (cx + size//4, cy),
               (cx - size//5, cy)]
        draw.polygon(pts, fill=c)

    elif name == "chart":
        bars = [0.4, 0.7, 0.55, 0.9, 0.75]
        bar_w = size // len(bars) - 2
        base_y = cy + size // 2
        for i, h in enumerate(bars):
            x = cx - size // 2 + i * (bar_w + 2)
            bar_h = int(size * h)
            draw.rectangle([(x, base_y - bar_h), (x + bar_w, base_y)],
                           fill=(*blend_rgb(color, lighten(color,60), i/len(bars)), a))

    elif name == "check":
        lw2 = max(4, size // 6)
        mid_x, mid_y = cx - size // 5, cy + size // 6
        draw.line([(cx - size // 2, cy), (mid_x, mid_y)], fill=c, width=lw2)
        draw.line([(mid_x, mid_y), (cx + size // 2, cy - size // 3)], fill=c, width=lw2)

    elif name == "play":
        pts = [(cx - size//3, cy - size//2), (cx - size//3, cy + size//2),
               (cx + size//2, cy)]
        draw.polygon(pts, fill=c)

    elif name == "gem":
        top = [(cx - size//3, cy), (cx, cy - size//2), (cx + size//3, cy)]
        bottom = [(cx - size//3, cy), (cx + size//3, cy), (cx, cy + size//2)]
        draw.polygon(top, fill=(*lighten(color,40), a))
        draw.polygon(bottom, fill=c)

# ── ═══════════════════════════════════════════════════════════════════════════
# ── SCENE CONTENT RENDERERS (7 scene types)
# ── ═══════════════════════════════════════════════════════════════════════════

def draw_scene_content(img: Image.Image, scene: dict, s: dict, fonts: dict,
                       t: float = 0.5) -> None:
    iw, ih = img.size
    draw = ImageDraw.Draw(img, "RGBA")
    max_w = int(iw * 0.72)
    scene_type = scene.get("type", "body")
    is_dark = s["bg"][0] < 80

    # ── TITLE SCENE ─────────────────────────────────────────────────────────
    if scene_type == "title":
        headline = scene.get("headline") or "Untitled"
        subtitle = scene.get("subtitle") or "— Powered by Selovox AI —"

        # Eyebrow label with animated slide-in
        eyebrow_alpha = min(255, int(255 * ease_out_cubic(t * 2)))
        eyebrow = scene.get("eyebrow") or "▸  Selovox"
        ew = text_w(eyebrow, fonts["eye"], draw)
        pill_pad_x = iw // 48
        pill_pad_y = ih // 96
        pill_x = (iw - ew) // 2 - pill_pad_x
        pill_y = ih // 2 - int(ih * 0.20)
        pill_w = ew + pill_pad_x * 2
        pill_h = fonts["eye"].getbbox(eyebrow)[3] + pill_pad_y * 2
        overlay = Image.new("RGBA", (iw, ih), (0, 0, 0, 0))
        pd = ImageDraw.Draw(overlay)
        pd.rounded_rectangle([(pill_x, pill_y), (pill_x + pill_w, pill_y + pill_h)],
                              radius=pill_h // 2, fill=(*s["accent"], int(70 * t)))
        img.paste(overlay, (0, 0), overlay)
        draw.text((pill_x + pill_pad_x, pill_y + pill_pad_y), eyebrow,
                  font=fonts["eye"], fill=(*s["eye"], eyebrow_alpha))

        # Gradient divider line
        lw = int(iw * 0.20)
        line_y = ih // 2 - int(ih * 0.115)
        draw2 = ImageDraw.Draw(img, "RGBA")
        line_anim_w = int(lw * 2 * min(1.0, t * 1.5))
        for x in range(iw // 2 - line_anim_w, iw // 2 + line_anim_w):
            if 0 <= x < iw:
                tc = abs(x - iw // 2) / max(1, line_anim_w)
                a  = int(220 * (1 - tc * tc) * min(1.0, t * 2))
                draw2.point((x, line_y), fill=(*s["accent"], a))

        # Main title (large, animated)
        title_ease = ease_out_back(max(0, (t - 0.1) * 1.3))
        font = fonts["title"]
        if text_w(headline, font, draw) > max_w:
            font = fonts["title_sm"]
        words = headline.split()
        if text_w(headline, font, draw) > max_w:
            mid  = len(words) // 2
            lines = [" ".join(words[:mid]), " ".join(words[mid:])]
        else:
            lines = [headline]

        lh = int(ih * 0.145)
        sy = ih // 2 - (len(lines) * lh) // 2 + int(ih * 0.025)

        for i, line in enumerate(lines):
            alpha_line = int(255 * min(1.0, title_ease))
            if is_dark:
                draw_glowing_text(img, draw, line, font, (*s["text"], alpha_line),
                                  sy + i * lh, glow_color=s["accent"],
                                  glow_strength=min(1.0, t * 1.5), iw=iw)
            else:
                draw_text_with_outline(draw, line, font, (*s["text"], alpha_line),
                                       -1, sy + i * lh, outline=5, iw=iw)

        # Subtitle with fade
        sub_alpha = int(180 * ease_out_cubic(max(0, t - 0.4) * 2))
        draw_centered_text(draw, subtitle, fonts["eye"],
                           (*s["sub"], sub_alpha), ih // 2 + int(ih * 0.195), iw=iw)

        # Animated floating orbs (decoration)
        for i in range(4):
            angle = t * math.pi * 2 * (0.3 + i * 0.1) + i * math.pi / 2
            orb_x = iw // 2 + int(math.cos(angle) * iw * (0.28 + i * 0.04))
            orb_y = ih // 2 + int(math.sin(angle * 0.7) * ih * 0.15)
            orb_r = int(iw * (0.015 - i * 0.002))
            orb_a = int(40 - i * 8)
            if orb_r > 0 and orb_a > 0:
                draw2 = ImageDraw.Draw(img, "RGBA")
                c = blend_rgb(s["g1"], s["g2"], i / 4)
                draw2.ellipse([(orb_x - orb_r, orb_y - orb_r),
                               (orb_x + orb_r, orb_y + orb_r)], fill=(*c, orb_a))

    # ── CHARACTER SCENE ──────────────────────────────────────────────────────
    elif scene_type == "character":
        body_text = scene.get("body") or ""
        pose = scene.get("pose") or "presenting"

        # Character positioned on the left third
        char_ease = ease_out_back(min(1.0, t * 1.3))
        char_x = int(iw * 0.25)
        char_y = int(ih * 0.55)
        char_scale = int(min(iw, ih) * 0.09)
        char_alpha = min(1.0, t * 1.5)

        char = Character(char_x, char_y, char_scale, s.get("char_color", s["accent"]),
                         t * 2, pose=pose)
        # Draw with entrance animation (slide from left)
        slide_off = int((1 - char_ease) * iw * 0.3)
        # Create temporary char offset image
        char_img = Image.new("RGBA", img.size, (0,0,0,0))
        char_obj = Character(char_x - slide_off, char_y, char_scale,
                             s.get("char_color", s["accent"]), t * 2, pose=pose)
        char_obj.draw(char_img, alpha_pct=char_alpha)
        img.paste(char_img, (0,0), char_img)

        # Speech bubble next to character
        if body_text and t > 0.3:
            bubble_t = ease_out_cubic((t - 0.3) / 0.7)
            bubble_alpha = min(1.0, bubble_t * 1.5)
            hand_pos = char_obj.r_hand if pose == "presenting" else (char_x - slide_off + int(char_scale * 2.5), char_y - int(char_scale * 1.5))
            speech_font = fonts["body_sm"]
            if bubble_t > 0.1:
                draw_speech_bubble(img, body_text, speech_font,
                                   s.get("card_bg", (30,30,50)),
                                   hand_pos[0] + int(char_scale * 0.5),
                                   hand_pos[1] - int(char_scale * 0.5),
                                   iw, s["accent"])

        # Kinetic text on the right side
        text_x = iw * 3 // 5
        lines = wrap_lines(body_text, fonts["body"], iw // 3, draw)[:4]
        lh = int(ih * 0.09)
        sy_text = ih // 2 - (len(lines) * lh) // 2
        for i, ln in enumerate(lines):
            word_t = ease_out_cubic(max(0, t - i * 0.12) * 1.5)
            a = int(255 * word_t)
            off_x = int((1 - word_t) * iw * 0.05)
            draw.text((text_x + off_x, sy_text + i * lh), ln,
                      font=fonts["body_sm"], fill=(*s["text"], a))

    # ── FEATURE / CHECKLIST SCENE ────────────────────────────────────────────
    elif scene_type == "feature":
        headline = scene.get("headline") or ""
        items = scene.get("items") or []
        if not items:
            body = scene.get("body") or ""
            # Auto-parse items from body
            items = [ln.strip("•-– ").strip() for ln in body.split("\n") if ln.strip()][:5]
            if not items:
                items = [body] if body else ["Feature 1", "Feature 2", "Feature 3"]

        # Title
        if headline:
            ease_h = ease_out_cubic(min(1.0, t * 2))
            title_alpha = int(255 * ease_h)
            draw_centered_text(draw, headline, fonts["title_sm"],
                               (*s["text"], title_alpha), int(ih * 0.20), iw=iw)

        # Feature items with staggered check animations
        check_r = max(12, int(min(iw, ih) * 0.025))
        left_x = int(iw * 0.20)
        item_spacing = int(ih * 0.14)
        total_h = len(items) * item_spacing
        start_y = ih // 2 - total_h // 2 + (int(ih * 0.08) if headline else 0)

        for i, item in enumerate(items):
            delay = i * 0.15
            item_t = ease_out_back(max(0, min(1.0, (t - delay) / 0.4)))
            alpha = int(255 * min(1.0, max(0, (t - delay) * 2.5)))
            item_y = start_y + i * item_spacing

            if item_t > 0:
                # Slide-in from left
                slide_x = int((1 - item_t) * iw * 0.08)
                # Checkmark circle
                ck_t = max(0, min(1.0, (t - delay - 0.1) / 0.35))
                check_anim_draw = ImageDraw.Draw(img, "RGBA")
                draw_animated_checkmark(check_anim_draw, left_x + slide_x, item_y, check_r,
                                        s["accent"], ck_t)
                # Item text
                draw.text((left_x + check_r * 2 + int(iw * 0.02) + slide_x, item_y - check_r),
                          item, font=fonts["body"], fill=(*s["text"], alpha))

    # ── STATS SCENE ──────────────────────────────────────────────────────────
    elif scene_type == "stats":
        stats = scene.get("stats") or []
        headline = scene.get("headline") or ""
        if not stats:
            body = scene.get("body") or ""
            # Try to extract stats from text
            nums = re.findall(r'[\d,]+\+?%?(?:\s+\w+)?', body)
            stats = [{"value": n.strip(), "label": ""} for n in nums[:4]]
            if not stats:
                stats = [{"value": "100+", "label": "Users"}, {"value": "98%", "label": "Satisfaction"}]

        if headline:
            ease_h = ease_out_cubic(min(1.0, t * 2))
            draw_centered_text(draw, headline, fonts["title_sm"],
                               (*s["text"], int(255 * ease_h)), int(ih * 0.18), iw=iw)

        # Arrange stats in a grid
        n = len(stats)
        cols = min(n, 3)
        rows = math.ceil(n / cols)
        cell_w = int(iw * 0.65) // cols
        cell_h = int(ih * 0.45) // rows
        start_x = iw // 2 - (cols * cell_w) // 2
        start_y = ih // 2 - (rows * cell_h) // 2 + (int(ih * 0.06) if headline else 0)

        for i, stat in enumerate(stats):
            col = i % cols
            row = i // cols
            cx_s = start_x + col * cell_w + cell_w // 2
            cy_s = start_y + row * cell_h + cell_h // 2

            delay = i * 0.12
            stat_t = ease_out_cubic(max(0, min(1.0, (t - delay) * 1.5)))

            if stat_t > 0.01:
                # Card background
                card_pad = int(min(cell_w, cell_h) * 0.08)
                draw_material_card(img,
                    cx_s - cell_w // 2 + card_pad, cy_s - cell_h // 2 + card_pad,
                    cx_s + cell_w // 2 - card_pad, cy_s + cell_h // 2 - card_pad,
                    s.get("card_bg", (20,20,40)), s["accent"],
                    radius=int(min(cell_w, cell_h) * 0.08), elevation=2)

                # Progress ring (decorative)
                ring_r = int(min(cell_w, cell_h) * 0.30)
                pct_val = 0.75 + (i * 0.07)  # decorative value
                draw_progress_ring(img, cx_s, cy_s, ring_r, stat_t * pct_val,
                                   s["accent"], s["bg"], thickness=max(4, ring_r // 6))

                # Stat value (counts up)
                draw_stat_counter(draw, stat.get("value","—"), stat.get("label",""),
                                  fonts["num"], fonts["eye"],
                                  cx_s, cy_s, s["accent"], stat_t)

    # ── PRODUCT SHOWCASE SCENE ───────────────────────────────────────────────
    elif scene_type == "product":
        headline = scene.get("headline") or scene.get("body") or ""
        price    = scene.get("price") or ""
        features = scene.get("features") or []

        # Glowing product card reveal
        card_ease = ease_out_back(min(1.0, t * 1.2))
        card_w = int(iw * 0.55)
        card_h = int(ih * 0.65)
        card_x = (iw - card_w) // 2
        card_y = (ih - card_h) // 2 + int(ih * 0.04)
        # Scale up animation
        scale_f = 0.6 + 0.4 * card_ease
        card_w_anim = int(card_w * scale_f)
        card_h_anim = int(card_h * scale_f)
        card_x_anim = (iw - card_w_anim) // 2
        card_y_anim = (ih - card_h_anim) // 2 + int(ih * 0.04)

        if card_ease > 0.01:
            draw_material_card(img, card_x_anim, card_y_anim,
                               card_x_anim + card_w_anim, card_y_anim + card_h_anim,
                               s.get("card_bg", (15,10,30)), s["accent"],
                               radius=int(min(card_w, card_h) * 0.05), elevation=4)

            # Glowing border pulse
            pulse = 0.6 + 0.4 * math.sin(t * math.pi * 3)
            border_overlay = Image.new("RGBA", img.size, (0,0,0,0))
            bd = ImageDraw.Draw(border_overlay)
            bd.rounded_rectangle([card_x_anim, card_y_anim,
                                   card_x_anim + card_w_anim, card_y_anim + card_h_anim],
                                  radius=int(min(card_w, card_h) * 0.05),
                                  outline=(*s["accent"], int(100 * pulse)),
                                  width=max(3, iw // 400))
            glow_border = border_overlay.filter(ImageFilter.GaussianBlur(radius=12))
            img.paste(glow_border, (0,0), glow_border)
            img.paste(border_overlay, (0,0), border_overlay)

            # Icon at top of card
            icon_y = card_y_anim + card_h_anim // 6
            icon_x = card_x_anim + card_w_anim // 2
            icon_size = int(min(card_w_anim, card_h_anim) * 0.10)
            draw_icon(draw, "gem", icon_x, icon_y, icon_size, s["accent"], min(1.0, t * 2))

            # Product name
            text_area = card_x_anim + int(card_w_anim * 0.1)
            text_w_area = int(card_w_anim * 0.8)
            if headline:
                hlines = wrap_lines(headline, fonts["title_sm"], text_w_area, draw)[:2]
                lh = int(ih * 0.10)
                hy = card_y_anim + card_h_anim // 3 - len(hlines) * lh // 2
                title_a = int(255 * ease_out_cubic(min(1.0, t * 1.5)))
                for i, hl in enumerate(hlines):
                    tw_hl = text_w(hl, fonts["title_sm"], draw)
                    draw.text((card_x_anim + (card_w_anim - tw_hl) // 2, hy + i * lh), hl,
                              font=fonts["title_sm"], fill=(*s["text"], title_a))

            # Price badge
            if price:
                price_a = int(255 * ease_out_cubic(max(0, t - 0.3) * 2))
                price_font = fonts["num"]
                pw = text_w(price, price_font, draw)
                price_x = card_x_anim + (card_w_anim - pw) // 2
                price_y = card_y_anim + int(card_h_anim * 0.58)
                draw.text((price_x, price_y), price, font=price_font,
                          fill=(*s["accent"], price_a))

            # Mini features
            if features:
                feat_draw = ImageDraw.Draw(img, "RGBA")
                feat_y = card_y_anim + int(card_h_anim * 0.72)
                feat_spacing = int(ih * 0.055)
                for i, feat in enumerate(features[:3]):
                    delay = 0.4 + i * 0.1
                    feat_t = ease_out_cubic(max(0, (t - delay) * 2))
                    feat_a = int(220 * feat_t)
                    check_r = max(6, int(min(card_w, card_h) * 0.015))
                    feat_cx = card_x_anim + int(card_w_anim * 0.15)
                    draw_animated_checkmark(feat_draw, feat_cx, feat_y + i * feat_spacing,
                                           check_r, s["accent"], min(1.0, feat_t * 1.5))
                    draw.text((feat_cx + check_r * 2 + int(iw * 0.01), feat_y + i * feat_spacing - check_r),
                              feat, font=fonts["eye"], fill=(*s["text"], feat_a))

    # ── COMPARISON SCENE ─────────────────────────────────────────────────────
    elif scene_type == "comparison":
        left_label  = scene.get("before") or scene.get("left")  or "Before"
        right_label = scene.get("after")  or scene.get("right") or "After"
        left_items  = scene.get("left_items")  or []
        right_items = scene.get("right_items") or []
        headline    = scene.get("headline") or ""

        reveal_ease = ease_out_cubic(min(1.0, t * 1.4))

        # Left panel (before — dark/red)
        left_w = int(iw * 0.44 * reveal_ease)
        left_bg = (60, 20, 20) if is_dark else (255, 235, 235)
        if left_w > 10:
            left_overlay = Image.new("RGBA", img.size, (0,0,0,0))
            ld = ImageDraw.Draw(left_overlay)
            ld.rectangle([(0, 0), (left_w, ih)], fill=(*left_bg, 160))
            img.paste(left_overlay, (0,0), left_overlay)

        # Right panel (after — green)
        right_w = int(iw * 0.44 * reveal_ease)
        right_bg = (20, 50, 25) if is_dark else (230, 255, 235)
        if right_w > 10:
            right_overlay = Image.new("RGBA", img.size, (0,0,0,0))
            rd = ImageDraw.Draw(right_overlay)
            rd.rectangle([(iw - right_w, 0), (iw, ih)], fill=(*right_bg, 160))
            img.paste(right_overlay, (0,0), right_overlay)

        # Divider
        if reveal_ease > 0.1:
            div_x = iw // 2
            draw2 = ImageDraw.Draw(img, "RGBA")
            for y_d in range(0, ih):
                c = blend_rgb(s["g1"], s["g2"], y_d / ih)
                draw2.line([(div_x - 2, y_d), (div_x + 2, y_d)], fill=(*c, 200))

        # Labels
        label_a = int(255 * reveal_ease)
        if label_a > 0:
            draw.text((int(iw * 0.12), int(ih * 0.12)), left_label,
                      font=fonts["body"], fill=(*blend_rgb((200,80,80),(255,120,120),0.5), label_a))
            draw.text((int(iw * 0.60), int(ih * 0.12)), right_label,
                      font=fonts["body"], fill=(*blend_rgb((80,180,80),(120,220,120),0.5), label_a))

        # Headline
        if headline:
            h_a = int(255 * ease_out_cubic(min(1.0, t * 1.8)))
            draw_centered_text(draw, headline, fonts["title_sm"],
                               (*s["text"], h_a), int(ih * 0.12), iw=iw)

    # ── CTA SCENE ─────────────────────────────────────────────────────────────
    elif scene_type == "cta":
        body = scene.get("body") or ""
        headline = scene.get("headline") or "Take Action Now"

        # Confetti burst on CTA
        if t > 0.5:
            confetti_colors = [s["g1"], s["g2"], s["accent"],
                               lighten(s["g1"], 50), lighten(s["g2"], 50)]
            draw_confetti_burst(img, iw // 2, ih // 3,
                                (t - 0.5) * 0.8, confetti_colors, seed=42)

        # Badge (animated scale-in)
        badge_ease = ease_out_elastic(min(1.0, t * 1.5))
        badge = "✦  TAKE ACTION NOW  ✦"
        badge_font = fonts["eye"]
        bw = text_w(badge, badge_font, draw)
        bpad = iw // 48
        bx = (iw - bw) // 2 - bpad
        by = ih // 2 - int(ih * 0.22)
        if badge_ease > 0.01:
            overlay = Image.new("RGBA", img.size, (0,0,0,0))
            od = ImageDraw.Draw(overlay)
            od.rounded_rectangle(
                [(bx, by), (bx + bw + bpad * 2, by + badge_font.getbbox(badge)[3] + bpad * 2)],
                radius=int(bpad * 1.5),
                fill=(*blend_rgb(s["g1"], s["g2"], 0.5), int(200 * badge_ease))
            )
            img.paste(overlay, (0,0), overlay)
            draw.text((bx + bpad, by + bpad), badge, font=badge_font,
                      fill=(255,255,255,int(255 * badge_ease)))

        # Headline
        h_ease = ease_out_back(min(1.0, max(0, (t - 0.1) * 1.3)))
        if h_ease > 0.01:
            h_a = int(255 * h_ease)
            draw_glowing_text(img, draw, headline, fonts["title_sm"],
                              (*s["text"], h_a), ih // 2 - int(ih * 0.02),
                              glow_color=s["accent"], glow_strength=h_ease, iw=iw)

        # Body text
        if body:
            lines = wrap_lines(body, fonts["body"], max_w, draw)[:3]
            lh = int(ih * 0.09)
            sy = ih // 2 + int(ih * 0.10)
            for i, ln in enumerate(lines):
                a = int(255 * ease_out_cubic(max(0, t - 0.2 - i * 0.1) * 2))
                draw_centered_text(draw, ln, fonts["body"], (*s["text"], a),
                                   sy + i * lh, iw=iw)

        # Pulsing CTA button
        pulse = ease_in_out_sine(t * 3 % 1.0)
        btn_a = int(255 * ease_out_cubic(max(0, t - 0.3) * 2))
        arrow_y = ih // 2 + int(ih * 0.30)
        if btn_a > 10:
            btn_text = "Get Started Now  →"
            btn_font = fonts["cta"]
            btn_w = text_w(btn_text, btn_font, draw)
            btn_pad = int(iw * 0.025)
            btn_x = (iw - btn_w) // 2 - btn_pad
            btn_h = int(ih * 0.075)
            btn_y = arrow_y - btn_h // 2

            # Pulsing glow
            glow_size = int(btn_pad * (1 + pulse * 0.3))
            glow_overlay = Image.new("RGBA", img.size, (0,0,0,0))
            gd = ImageDraw.Draw(glow_overlay)
            gd.rounded_rectangle([btn_x - glow_size, btn_y - glow_size,
                                   btn_x + btn_w + btn_pad * 2 + glow_size, btn_y + btn_h + glow_size],
                                  radius=btn_h // 2,
                                  fill=(*s["accent"], int(50 * pulse * btn_a / 255)))
            glow_bl = glow_overlay.filter(ImageFilter.GaussianBlur(radius=20))
            img.paste(glow_bl, (0,0), glow_bl)

            btn_overlay = Image.new("RGBA", img.size, (0,0,0,0))
            bd2 = ImageDraw.Draw(btn_overlay)
            bd2.rounded_rectangle([btn_x, btn_y, btn_x + btn_w + btn_pad * 2, btn_y + btn_h],
                                   radius=btn_h // 2,
                                   fill=(*s["accent"], btn_a))
            img.paste(btn_overlay, (0,0), btn_overlay)
            tw_b = text_w(btn_text, btn_font, draw)
            draw.text((btn_x + btn_pad, btn_y + (btn_h - text_h(btn_font)) // 2),
                      btn_text, font=btn_font, fill=(255,255,255,btn_a))

    # ── BODY SCENE (default) — kinetic typography ─────────────────────────────
    else:
        body = scene.get("body") or ""

        # Scene number accent
        idx_str = str(scene.get("_idx", 0) + 1).zfill(2)
        num_x = int(iw * 0.035)
        num_y = ih // 2 - fonts["num"].getbbox(idx_str)[3] // 2
        num_a = int(130 * ease_out_cubic(min(1.0, t * 2)))
        draw.text((num_x, num_y), idx_str, font=fonts["num"],
                  fill=(*s["accent"], num_a))

        # Vertical gradient bar
        bar_x = num_x + fonts["num"].getbbox("00")[2] + iw // 64
        bar_th = int(ih * 0.08)
        draw2 = ImageDraw.Draw(img, "RGBA")
        for y in range(ih // 2 - bar_th, ih // 2 + bar_th):
            tc = abs(y - ih // 2) / bar_th
            a  = int(220 * (1 - tc) * ease_out_cubic(t))
            c  = blend_rgb(s["g1"], s["g2"], (y - (ih // 2 - bar_th)) / (bar_th * 2))
            draw2.line([(bar_x, y), (bar_x + max(3, iw // 280), y)], fill=(*c, a))

        # Kinetic word-by-word animation
        lines = wrap_lines(body, fonts["body"], max_w, draw)
        if len(lines) > 3:
            lines = wrap_lines(body, fonts["body_sm"], max_w, draw)[:5]
            use_font = fonts["body_sm"]
            lh = int(ih * 0.085)
        else:
            use_font = fonts["body"]
            lh = int(ih * 0.10)

        sy = ih // 2 - (len(lines) * lh) // 2

        # Check if style uses neon glow
        if s.get("anim") == "neon_glow" and is_dark:
            for i, ln in enumerate(lines):
                line_t = ease_out_cubic(max(0, t - i * 0.1) * 1.4)
                flicker = 0.85 + 0.15 * math.sin(t * math.pi * 8 + i * 2.1)
                if line_t > 0.05:
                    draw_neon_text(img, ln, use_font, s["text"], s["accent"],
                                   sy + i * lh, iw=iw, flicker=line_t * flicker)
        else:
            for i, ln in enumerate(lines):
                line_t = ease_out_back(max(0, (t - i * 0.12) * 1.5))
                a = int(255 * min(1.0, max(0, line_t)))
                y_off = int((1 - line_t) * ih * 0.04)
                if a > 0:
                    if is_dark and i == 0 and len(lines) <= 2:
                        draw_glowing_text(img, draw, ln, use_font,
                                          (*s["text"], a), sy + i * lh - y_off,
                                          glow_color=s["accent"],
                                          glow_strength=min(1.0, t * 1.5), iw=iw)
                    else:
                        tw_l = text_w(ln, use_font, draw)
                        draw.text(((iw - tw_l) // 2, sy + i * lh - y_off),
                                  ln, font=use_font, fill=(*s["text"], a))

# ── HUD (progress bar + watermark) ────────────────────────────────────────────
def draw_hud(img: Image.Image, s: dict, scene_idx: int, total_scenes: int,
             fonts: dict, t: float = 0.5) -> None:
    iw, ih = img.size
    draw   = ImageDraw.Draw(img, "RGBA")

    # Gradient progress bar (bottom)
    bar_h = max(8, ih // 120)
    bar_y = ih - bar_h
    prog  = (scene_idx + min(1.0, t)) / max(total_scenes, 1)
    filled = int(iw * prog)
    draw.rectangle([(0, bar_y), (iw, ih)], fill=(*s["bg"], 220))
    for x in range(filled):
        c = blend_rgb(s["g1"], s["g2"], x / max(iw, 1))
        draw.line([(x, bar_y), (x, ih)], fill=(*c, 255))

    # Glowing progress tip
    if 0 < filled < iw:
        tip_overlay = Image.new("RGBA", (iw, ih), (0, 0, 0, 0))
        td = ImageDraw.Draw(tip_overlay)
        tip_r = bar_h * 4
        tc = blend_rgb(s["g1"], s["g2"], filled / iw)
        td.ellipse([(filled - tip_r, bar_y - tip_r), (filled + tip_r, ih + tip_r)],
                   fill=(*tc, 140))
        blurred_tip = tip_overlay.filter(ImageFilter.GaussianBlur(radius=max(1, tip_r // 2)))
        img.paste(blurred_tip, (0, 0), blurred_tip)

    # Brand watermark (top-right, subtle)
    brand = "Selovox"
    bw    = text_w(brand, fonts["brand"], draw)
    draw.text((iw - bw - iw // 60, ih // 55), brand,
              font=fonts["brand"], fill=(*s["sub"], 80))

# ── Caption renderer ───────────────────────────────────────────────────────────
def draw_caption(img: Image.Image, text: str, cap_cfg: dict, s: dict,
                 fonts: dict) -> None:
    if not text or not cap_cfg:
        return
    text  = text[:140]
    iw, ih = img.size
    draw  = ImageDraw.Draw(img, "RGBA")
    fsize = int(cap_cfg["font_size"] * (iw / 1280))
    font  = load_font(FONT_SEMI, fsize)
    max_w = int(iw * 0.84)
    lines = wrap_lines(text, font, max_w, draw)[:2]
    if not lines:
        return

    bb  = font.getbbox(lines[0])
    lh  = (bb[3] - bb[1]) + int(ih * 0.012)
    total_h = lh * len(lines) + int(ih * 0.02)
    mode = cap_cfg.get("mode", "bar")

    if mode == "bar":
        bar_y = ih - total_h - int(ih * 0.055)
        bar_img = Image.new("RGBA", (iw, total_h + int(ih * 0.025)),
                            (*cap_cfg["bar_color"], cap_cfg["bar_alpha"]))
        img.paste(bar_img, (0, bar_y - int(ih * 0.012)), bar_img)
        draw2 = ImageDraw.Draw(img)
        for i, line in enumerate(lines):
            tw = text_w(line, font, draw2)
            draw2.text(((iw - tw) // 2, bar_y + i * lh), line, font=font, fill=cap_cfg["color"])

    elif mode == "outline":
        bar_y = ih - total_h - int(ih * 0.055)
        for i, line in enumerate(lines):
            draw_text_with_outline(draw, line, font, cap_cfg["color"],
                                   -1, bar_y + i * lh, cap_cfg.get("outline", 5) * 2, iw=iw)

    elif mode == "plain":
        bar_y = ih - total_h - int(ih * 0.04)
        for i, line in enumerate(lines):
            tw = text_w(line, font, draw)
            draw.text(((iw - tw) // 2, bar_y + i * lh), line, font=font, fill=cap_cfg["color"])

    elif mode == "box":
        bar_y = ih - total_h - int(ih * 0.04)
        pad   = int(ih * 0.012)
        box   = Image.new("RGBA", (iw, total_h + pad * 2), (*s["accent"], 215))
        img.paste(box, (0, bar_y - pad), box)
        for i, line in enumerate(lines):
            tw = text_w(line, font, draw)
            draw.text(((iw - tw) // 2, bar_y + i * lh), line, font=font, fill=(255,255,255))

    elif mode == "neon":
        bar_y = ih - total_h - int(ih * 0.055)
        for i, line in enumerate(lines):
            draw_neon_text(img, line, font, cap_cfg["color"],
                           cap_cfg.get("glow", s["accent"]), bar_y + i * lh, iw=iw)

# ── Frame compositor (supersampled → downscale) ────────────────────────────────
def render_hold_frame(scene: dict, style_name: str, caption_id: str,
                      scene_idx: int, total_scenes: int, t: float = 0.5) -> Image.Image:
    ensure_fonts()
    s = STYLES.get(style_name, STYLES["dark_pro"])

    # Fonts at 3× size for supersampled canvas
    fonts = {
        "title":    load_font(FONT_BOLD,    int(220 * SCALE / 3)),
        "title_sm": load_font(FONT_BOLD,    int(156 * SCALE / 3)),
        "body":     load_font(FONT_SEMI,    int(108 * SCALE / 3)),
        "body_sm":  load_font(FONT_SEMI,    int(80  * SCALE / 3)),
        "eye":      load_font(FONT_REGULAR, int(60  * SCALE / 3)),
        "num":      load_font(FONT_BOLD,    int(120 * SCALE / 3)),
        "brand":    load_font(FONT_REGULAR, int(40  * SCALE / 3)),
        "cta":      load_font(FONT_BOLD,    int(84  * SCALE / 3)),
        "light":    load_font(FONT_LIGHT,   int(70  * SCALE / 3)),
    }

    scene["_idx"] = scene_idx
    hi_img = Image.new("RGBA", (SW, SH), (*s["bg"], 255))
    draw_background(hi_img, s, t=t)
    draw_scene_content(hi_img, scene, s, fonts, t=t)

    cap_cfg = CAPTION_CONFIG.get(caption_id)
    if cap_cfg:
        cap_text = (scene.get("headline") or scene.get("body") or "")
        draw_caption(hi_img, cap_text, cap_cfg, s, fonts)

    draw_hud(hi_img, s, scene_idx, total_scenes, fonts, t=t)

    # Downscale with LANCZOS — this is the anti-aliasing step
    out = hi_img.convert("RGB").resize((W, H), Image.LANCZOS)
    return out

# ── ═══════════════════════════════════════════════════════════════════════════
# ── ANIMATION TRANSFORMS (14 animation modes)
# ── ═══════════════════════════════════════════════════════════════════════════

def _zoom_3d_in(frame: Image.Image, ease: float, bg: tuple) -> Image.Image:
    scale  = 0.28 + 0.72 * ease
    sq     = 0.88 + 0.12 * ease
    blur_r = max(0, int((1 - ease) * 5))
    new_w  = max(4, int(W * scale))
    new_h  = max(4, int(H * scale * sq))
    y_off  = int((1 - ease) * H * 0.05)
    src = frame.filter(ImageFilter.GaussianBlur(blur_r)) if blur_r > 0 else frame
    src = src.resize((new_w, new_h), Image.LANCZOS)
    out = Image.new("RGB", (W, H), bg)
    out.paste(src, ((W - new_w) // 2, (H - new_h) // 2 - y_off))
    return out

def _slide_up_in(frame: Image.Image, ease: float, bg: tuple) -> Image.Image:
    y_off = int((1 - ease) * 90)
    out   = Image.new("RGB", (W, H), bg)
    tmp   = frame.copy()
    if ease < 0.95:
        fade = Image.new("RGB", (W, H), bg)
        tmp  = Image.blend(fade, tmp, min(1.0, ease * 1.25))
    out.paste(tmp, (0, -y_off))
    return out

def _glitch_slide_in(frame: Image.Image, ease: float, t_raw: float, bg: tuple) -> Image.Image:
    x_off = int((1 - ease) * 80)
    out   = Image.new("RGB", (W, H), bg)
    if t_raw < 0.16:
        r, g, b = frame.split()
        glitch = int((0.16 - t_raw) / 0.16 * 16)
        combined = Image.merge("RGB", (
            r.transform((W, H), Image.AFFINE, (1, 0, glitch, 0, 1, 0)),
            g,
            b.transform((W, H), Image.AFFINE, (1, 0, -glitch, 0, 1, 0)),
        ))
        out.paste(combined, (-x_off, 0))
    else:
        out.paste(frame, (-x_off, 0))
    return out

def _wave_slide_in(frame: Image.Image, ease: float, bg: tuple) -> Image.Image:
    bounce = ease + 0.12 * math.sin(ease * math.pi)
    bounce = min(1.0, bounce)
    x_off  = int((1 - bounce) * int(-W * 0.35))
    out    = Image.new("RGB", (W, H), bg)
    out.paste(frame, (x_off, 0))
    return out

def _matrix_drop_in(frame: Image.Image, ease: float, bg: tuple) -> Image.Image:
    ease_q = ease * ease
    y_off  = int((1 - ease_q) * (-H * 0.30))
    alpha_t = min(1.0, ease / 0.5)
    out = Image.new("RGB", (W, H), bg)
    if alpha_t < 1.0:
        fade = Image.new("RGB", (W, H), bg)
        blnd = Image.blend(fade, frame, alpha_t)
        out.paste(blnd, (0, y_off))
    else:
        out.paste(frame, (0, y_off))
    return out

def _particle_burst_in(frame: Image.Image, ease: float, bg: tuple, t_raw: float) -> Image.Image:
    # Dissolve from particles: radial iris reveal
    if ease < 0.95:
        radius = int(math.sqrt(W * W + H * H) * ease * 0.55)
        mask = Image.new("L", (W, H), 0)
        mask_draw = ImageDraw.Draw(mask)
        cx, cy = W // 2, H // 2
        mask_draw.ellipse([(cx - radius, cy - radius), (cx + radius, cy + radius)], fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(radius=max(1, int(W * 0.03))))
        out = Image.new("RGB", (W, H), bg)
        out.paste(frame, mask=mask)
        return out
    return frame

def _material_drop_in(frame: Image.Image, ease: float, bg: tuple) -> Image.Image:
    # Drops from top with slight squish at landing
    if ease < 0.85:
        y_off = int((1 - ease) * (-H * 0.6))
        out = Image.new("RGB", (W, H), bg)
        out.paste(frame, (0, y_off))
        return out
    # Squish on landing
    squish = 1.0 - 0.08 * math.sin((ease - 0.85) / 0.15 * math.pi)
    new_h = max(4, int(H * squish))
    new_w = max(4, int(W * (2 - squish)))
    resized = frame.resize((new_w, new_h), Image.LANCZOS)
    out = Image.new("RGB", (W, H), bg)
    out.paste(resized, ((W - new_w) // 2, H - new_h))
    return out

def _morph_in(frame: Image.Image, ease: float, bg: tuple) -> Image.Image:
    # Wipe from centre — horizontal reveal
    if ease >= 1.0:
        return frame
    reveal_w = int(W * ease)
    cx = W // 2
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    md.rectangle([(cx - reveal_w, 0), (cx + reveal_w, H)], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=max(1, int(W * 0.015))))
    out = Image.new("RGB", (W, H), bg)
    out.paste(frame, mask=mask)
    return out

def _character_walk_in(frame: Image.Image, ease: float, bg: tuple) -> Image.Image:
    # Slide from left with fade
    x_off = int((1 - ease) * (-W * 0.25))
    alpha = min(1.0, ease * 1.4)
    out   = Image.new("RGB", (W, H), bg)
    if alpha < 1.0:
        fade = Image.new("RGB", (W, H), bg)
        blnd = Image.blend(fade, frame, alpha)
        out.paste(blnd, (x_off, 0))
    else:
        out.paste(frame, (x_off, 0))
    return out

def _neon_glow_in(frame: Image.Image, ease: float, bg: tuple) -> Image.Image:
    # Flicker-on effect
    if ease < 0.6:
        # Random flicker
        flicker = 1.0 if random.random() < ease * 1.5 else max(0, ease - 0.1)
        if flicker < 0.05:
            return Image.new("RGB", (W, H), bg)
        fade = Image.new("RGB", (W, H), bg)
        return Image.blend(fade, frame, min(1.0, flicker))
    return Image.blend(Image.new("RGB", (W, H), bg), frame, min(1.0, ease))

def _reveal_left(frame: Image.Image, ease: float, bg: tuple) -> Image.Image:
    # Horizontal wipe from left
    reveal_w = int(W * ease)
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    md.rectangle([(0, 0), (reveal_w, H)], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=max(1, int(W * 0.01))))
    out = Image.new("RGB", (W, H), bg)
    out.paste(frame, mask=mask)
    return out

def _bounce_in(frame: Image.Image, ease: float, bg: tuple) -> Image.Image:
    # Bounce from top
    b_ease = bounce_ease(ease)
    y_off  = int((1 - b_ease) * (-H * 0.4))
    out    = Image.new("RGB", (W, H), bg)
    alpha  = min(1.0, ease * 2.5)
    if alpha < 1.0:
        fade = Image.new("RGB", (W, H), bg)
        blnd = Image.blend(fade, frame, alpha)
        out.paste(blnd, (0, y_off))
    else:
        out.paste(frame, (0, y_off))
    return out

def _split_reveal(frame: Image.Image, ease: float, bg: tuple) -> Image.Image:
    # Two halves slide together from top and bottom
    split_h = int((1 - ease) * H * 0.5)
    top    = frame.crop((0, 0, W, H // 2))
    bottom = frame.crop((0, H // 2, W, H))
    out = Image.new("RGB", (W, H), bg)
    out.paste(top,    (0, -split_h))
    out.paste(bottom, (0, H // 2 + split_h))
    return out

def render_intro_frame(hold: Image.Image, t: float, anim: str, s: dict) -> Image.Image:
    ease = ease_out_cubic(t)
    bg   = s["bg"]
    if anim == "slide_up":         return _slide_up_in(hold, ease, bg)
    if anim == "glitch_slide":     return _glitch_slide_in(hold, ease, t, bg)
    if anim == "wave_slide":       return _wave_slide_in(hold, ease, bg)
    if anim == "matrix_drop":      return _matrix_drop_in(hold, ease, bg)
    if anim == "particle_burst":   return _particle_burst_in(hold, ease, bg, t)
    if anim == "material_drop":    return _material_drop_in(hold, ease_out_back(t), bg)
    if anim == "morph_in":         return _morph_in(hold, ease, bg)
    if anim == "character_walk":   return _character_walk_in(hold, ease_out_cubic(t * 1.2), bg)
    if anim == "neon_glow":        return _neon_glow_in(hold, t, bg)
    if anim == "reveal_left":      return _reveal_left(hold, ease, bg)
    if anim == "bounce_in":        return _bounce_in(hold, t, bg)
    if anim == "split_reveal":     return _split_reveal(hold, ease, bg)
    return _zoom_3d_in(hold, ease, bg)

def render_outro_frame(hold: Image.Image, t: float, s: dict) -> Image.Image:
    ease   = ease_in_cubic(t)
    scale  = 1.0 + 0.06 * ease
    new_w  = max(4, int(W * scale))
    new_h  = max(4, int(H * scale))
    resized = hold.resize((new_w, new_h), Image.LANCZOS)
    out    = Image.new("RGB", (W, H), s["bg"])
    out.paste(resized, ((W - new_w) // 2, (H - new_h) // 2))
    if ease > 0.05:
        fade = Image.new("RGB", (W, H), s["bg"])
        out  = Image.blend(out, fade, min(1.0, ease * 1.1))
    return out

# ── Ken Burns (slow zoom/pan on hold frames) ──────────────────────────────────
def _ken_burns_frame(hold: Image.Image, t: float, direction: int = 0) -> Image.Image:
    max_zoom = 0.030
    zoom     = 1.0 + max_zoom * ease_in_out_sine(t)
    new_w    = max(W, int(W * zoom))
    new_h    = max(H, int(H * zoom))
    zoomed   = hold.resize((new_w, new_h), Image.BILINEAR)
    if direction == 1:
        ox = int((new_w - W) * t)
        oy = (new_h - H) // 2
    elif direction == 2:
        ox = int((new_w - W) * (1 - t))
        oy = (new_h - H) // 2
    else:
        ox = (new_w - W) // 2
        oy = (new_h - H) // 2
    return zoomed.crop((ox, oy, ox + W, oy + H))

# ── Scene frame generation ─────────────────────────────────────────────────────
def generate_scene_frames(scene: dict, style_name: str, caption_id: str,
                          scene_idx: int, total_scenes: int,
                          total_dur: float, tmp_dir: str) -> list:
    s    = STYLES.get(style_name, STYLES["dark_pro"])
    anim = s["anim"]

    intro_dur = INTRO_F / FPS
    outro_dur = OUTRO_F / FPS

    if total_dur <= intro_dur + outro_dur:
        ratio   = max(0.4, total_dur / (intro_dur + outro_dur))
        n_intro = max(4, int(INTRO_F * ratio))
        n_outro = max(3, int(OUTRO_F * ratio))
        hold_dur = 0.0
    else:
        n_intro, n_outro = INTRO_F, OUTRO_F
        hold_dur = max(0.04, total_dur - intro_dur - outro_dur)

    kb_dir = scene_idx % 3
    frames: list = []

    # Intro frames — scene content animates WITH the intro
    for i in range(n_intro):
        t_raw = i / max(n_intro - 1, 1)
        # Scene content uses t_raw for kinetic animation
        hold = render_hold_frame(scene, style_name, caption_id, scene_idx, total_scenes, t=t_raw)
        frame = render_intro_frame(hold, t_raw, anim, s)
        path = os.path.join(tmp_dir, f"i_{i:04d}.png")
        frame.save(path, "PNG", optimize=False)
        frames.append((path, 1.0 / FPS))

    # Hold frames — Ken Burns + content slightly animated
    if hold_dur > 0.04:
        n_hold = max(2, int(hold_dur * FPS))
        for i in range(n_hold):
            t_h = i / max(n_hold - 1, 1)
            # Hold: t=1.0 (fully revealed) with subtle content bob
            hold = render_hold_frame(scene, style_name, caption_id, scene_idx, total_scenes,
                                     t=0.7 + 0.3 * math.sin(t_h * math.pi * 0.5))
            frame = _ken_burns_frame(hold, t_h, kb_dir)
            path = os.path.join(tmp_dir, f"h_{i:04d}.png")
            frame.save(path, "PNG", optimize=False)
            frames.append((path, 1.0 / FPS))

    # Outro frames
    outro_hold = render_hold_frame(scene, style_name, caption_id, scene_idx, total_scenes, t=1.0)
    for i in range(n_outro):
        t_o = i / max(n_outro - 1, 1)
        frame = render_outro_frame(outro_hold, t_o, s)
        path = os.path.join(tmp_dir, f"o_{i:04d}.png")
        frame.save(path, "PNG", optimize=False)
        frames.append((path, 1.0 / FPS))

    return frames

# ── FFmpeg helpers ─────────────────────────────────────────────────────────────
def run_ffmpeg(args: list) -> None:
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error"] + args,
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg error: {result.stderr[-1500:]}")

def write_concat_list(frames: list, path: str) -> None:
    with open(path, "w") as f:
        f.write("ffconcat version 1.0\n")
        for (fpath, dur) in frames:
            f.write(f"file '{fpath}'\n")
            f.write(f"duration {dur:.6f}\n")
        if frames:
            f.write(f"file '{frames[-1][0]}'\n")

def build_scene_video(frames: list, audio_wav: str, out_mp4: str, total_dur: float) -> None:
    concat_file = out_mp4 + ".concat.txt"
    write_concat_list(frames, concat_file)
    try:
        run_ffmpeg([
            "-y",
            "-f", "concat", "-safe", "0", "-i", concat_file,
            "-i", audio_wav,
            "-c:v", "libx264", "-preset", "slow", "-crf", "16",
            "-profile:v", "high", "-level", "4.2",
            "-pix_fmt", "yuv420p",
            "-vf", "unsharp=7:7:0.8:7:7:0.0",
            "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart",
            "-t", f"{total_dur:.4f}",
            out_mp4,
        ])
    finally:
        if os.path.exists(concat_file):
            os.remove(concat_file)

def pad_wav_to(audio_wav: str, out_wav: str, target_dur: float) -> None:
    run_ffmpeg([
        "-y", "-i", audio_wav,
        "-af", f"apad=pad_dur={target_dur}", "-t", f"{target_dur:.4f}",
        out_wav,
    ])

def concat_videos(scene_mp4s: list, output_mp4: str) -> None:
    if len(scene_mp4s) == 1:
        shutil.copy(scene_mp4s[0], output_mp4)
        return
    txt = output_mp4 + "_list.txt"
    with open(txt, "w") as f:
        for p in scene_mp4s:
            f.write(f"file '{p}'\n")
    try:
        run_ffmpeg([
            "-y", "-f", "concat", "-safe", "0", "-i", txt,
            "-c:v", "libx264", "-preset", "slow", "-crf", "16",
            "-profile:v", "high", "-level", "4.2",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart",
            output_mp4,
        ])
    finally:
        if os.path.exists(txt):
            os.remove(txt)

def get_wav_duration(wav_bytes: bytes) -> float:
    with wave.open(io.BytesIO(wav_bytes)) as wf:
        return wf.getnframes() / float(wf.getframerate())

def get_video_duration(mp4: str) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "json", mp4],
        capture_output=True, text=True,
    )
    if r.returncode == 0:
        try:
            return float(json.loads(r.stdout)["format"]["duration"])
        except Exception:
            pass
    return 0.0

# ── Scene parser (enhanced — supports new scene types) ─────────────────────────
def parse_scenes(title: str, script: str) -> list:
    """
    Supports two formats:
    1. JSON array of scene objects: [{"type":"character","body":"...","pose":"presenting"}, ...]
    2. Plain paragraphs (auto-typed)
    """
    # Try JSON scene list
    try:
        data = json.loads(script)
        if isinstance(data, list) and all(isinstance(s, dict) for s in data):
            scenes = [{"type": "title", "headline": title}]
            for i, sc in enumerate(data):
                if "type" not in sc:
                    sc["type"] = "cta" if i == len(data) - 1 else "body"
                scenes.append(sc)
            return scenes
    except Exception:
        pass

    # Plain paragraph auto-typing
    paras = [p.strip() for p in re.split(r"\n{2,}", script) if p.strip()]
    if not paras:
        sentences = re.split(r"(?<=[.!?])\s+", script.strip())
        chunks, cur, wc = [], [], 0
        for s in sentences:
            w = len(s.split())
            if wc + w > 28 and cur:
                chunks.append(" ".join(cur))
                cur, wc = [s], w
            else:
                cur.append(s)
                wc += w
        if cur:
            chunks.append(" ".join(cur))
        paras = chunks or [script.strip()]

    scenes = [{"type": "title", "headline": title}]
    for i, para in enumerate(paras):
        # Detect scene type from content hints
        scene_type = "cta" if i == len(paras) - 1 else "body"
        # Stats detection
        if re.search(r'\d+[\w%+,]+\s+\w+', para) and i > 0 and i < len(paras) - 1:
            if len(re.findall(r'\d', para)) >= 3:
                scene_type = "stats"
        # Feature list detection
        if "•" in para or para.count("✓") >= 2 or para.count("\n") >= 2:
            scene_type = "feature"
        scenes.append({
            "type": scene_type,
            "headline": None,
            "body": para,
        })
    return scenes

# ── TTS helper ─────────────────────────────────────────────────────────────────
async def fetch_tts(text: str, voice_id: str) -> bytes:
    import httpx
    async with httpx.AsyncClient(timeout=180) as client:
        r = await client.post(
            "http://localhost:8099/speak",
            json={"text": text[:900], "voice": voice_id, "speed": 1.0},
        )
        r.raise_for_status()
        return r.content

def _make_silence(seconds: float) -> bytes:
    sr = 24000
    n  = int(sr * seconds)
    arr = np.zeros(n, dtype=np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(arr.tobytes())
    return buf.getvalue()

# ── Main pipeline ──────────────────────────────────────────────────────────────
async def process_video_job(job_id: str, req: dict) -> None:
    title        = req["title"]
    script       = req["script"]
    voice_id     = req.get("voice_id", "af_sky")
    style        = req.get("style", "dark_pro")
    caption_id   = req.get("caption_style", "subtitle")
    aspect_ratio = req.get("aspect_ratio", "landscape")

    def upd(status: str, progress: int, message: str) -> None:
        _jobs[job_id].update({"status": status, "progress": progress, "message": message})

    job_tmp = OUTPUT_DIR / f"tmp_{job_id}"
    job_tmp.mkdir(exist_ok=True)

    try:
        upd("processing", 4, "Parsing script…")
        scenes = parse_scenes(title, script)
        total  = len(scenes)
        scene_mp4s: list = []

        for idx, scene in enumerate(scenes):
            pct       = 6 + int(82 * idx / total)
            scene_num = idx + 1
            upd("processing", pct, f"Animating scene {scene_num}/{total} [{scene.get('type','body')}]…")

            tts_text = (scene.get("headline") or scene.get("body") or title)[:900]

            try:
                wav_bytes = await fetch_tts(tts_text, voice_id)
            except Exception as e:
                logger.warning(f"TTS fallback for scene {idx}: {e}")
                pad_secs  = 3.5 if scene["type"] == "title" else 2.8
                wav_bytes = _make_silence(pad_secs)

            audio_dur   = get_wav_duration(wav_bytes)
            tail_pad    = 0.80 if scene["type"] == "title" else 0.45
            total_dur   = audio_dur + tail_pad

            raw_wav   = str(job_tmp / f"s{idx:03d}_raw.wav")
            pad_wav   = str(job_tmp / f"s{idx:03d}_pad.wav")
            scene_mp4 = str(job_tmp / f"s{idx:03d}.mp4")
            scene_tmp = str(job_tmp / f"f{idx:03d}")
            os.makedirs(scene_tmp, exist_ok=True)

            with open(raw_wav, "wb") as f:
                f.write(wav_bytes)
            pad_wav_to(raw_wav, pad_wav, total_dur)

            upd("processing", pct + 2, f"Rendering HD frames for scene {scene_num}…")
            frames = generate_scene_frames(
                scene, style, caption_id, idx, total, total_dur, scene_tmp,
            )
            build_scene_video(frames, pad_wav, scene_mp4, total_dur)
            scene_mp4s.append(scene_mp4)

        upd("processing", 90, "Assembling final 1080p video…")
        landscape_mp4 = str(OUTPUT_DIR / f"{job_id}_land.mp4")
        final_mp4     = str(OUTPUT_DIR / f"{job_id}.mp4")
        concat_videos(scene_mp4s, landscape_mp4)

        if aspect_ratio != "landscape":
            upd("processing", 95, f"Converting to {ASPECT_RATIOS.get(aspect_ratio, {}).get('label', aspect_ratio)}…")
        apply_aspect_ratio(landscape_mp4, final_mp4, aspect_ratio)
        if os.path.exists(landscape_mp4) and landscape_mp4 != final_mp4:
            os.remove(landscape_mp4)

        duration = get_video_duration(final_mp4)
        _jobs[job_id].update({
            "status":      "done",
            "progress":    100,
            "message":     "Video ready!",
            "output_path": final_mp4,
            "duration":    duration,
        })
        logger.info(f"Video job {job_id} done — {duration:.1f}s")

    except Exception as exc:
        logger.error(f"Video job {job_id} failed: {exc}", exc_info=True)
        _jobs[job_id].update({
            "status":   "failed",
            "progress": 0,
            "message":  f"Render failed: {str(exc)[:400]}",
        })
    finally:
        shutil.rmtree(str(job_tmp), ignore_errors=True)

# ── Aspect ratio post-processing ──────────────────────────────────────────────
ASPECT_RATIOS: dict = {
    "landscape": {"w": 1920, "h": 1080, "label": "16:9",  "vf": None},
    "portrait":  {"w": 1080, "h": 1920, "label": "9:16",
                  "vf": "[0:v]scale=1080:1920,boxblur=25[bg];[0:v]scale=1080:607[fg];[bg][fg]overlay=0:656"},
    "square":    {"w": 1080, "h": 1080, "label": "1:1",
                  "vf": "[0:v]scale=1080:1080,boxblur=25[bg];[0:v]scale=1080:607[fg];[bg][fg]overlay=0:236"},
    "facebook":  {"w": 1440, "h": 1080, "label": "4:3",   "vf": "crop=1440:1080:240:0"},
}

def apply_aspect_ratio(input_mp4: str, output_mp4: str, ratio: str) -> None:
    cfg = ASPECT_RATIOS.get(ratio, ASPECT_RATIOS["landscape"])
    vf  = cfg["vf"]
    if vf is None:
        shutil.copy(input_mp4, output_mp4)
        return
    run_ffmpeg([
        "-y", "-i", input_mp4,
        "-vf", vf,
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        output_mp4,
    ])

# ── API endpoints ──────────────────────────────────────────────────────────────
class VideoRequest(BaseModel):
    job_id:        str
    title:         str
    script:        str
    voice_id:      str = "af_sky"
    style:         str = "dark_pro"
    caption_style: str = "subtitle"
    aspect_ratio:  str = "landscape"

@router.post("/generate")
async def generate_video(req: VideoRequest, background_tasks: BackgroundTasks):
    job_id = req.job_id or str(uuid.uuid4())
    if job_id in _jobs and _jobs[job_id]["status"] in ("processing", "pending"):
        return {"job_id": job_id, "status": "already_running"}
    _jobs[job_id] = {"status": "pending", "progress": 0, "message": "Queued…",
                     "output_path": None, "duration": None,
                     "aspect_ratio": req.aspect_ratio}
    background_tasks.add_task(process_video_job, job_id, req.model_dump())
    return {"job_id": job_id, "status": "pending"}

@router.get("/status/{job_id}")
async def video_status(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(404, "Job not found")
    job = dict(_jobs[job_id])
    job.pop("output_path", None)
    return job

@router.get("/file/{job_id}")
async def video_file(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(404, "Job not found")
    job  = _jobs[job_id]
    if job["status"] != "done":
        raise HTTPException(400, f"Not ready (status={job['status']})")
    path = job.get("output_path")
    if not path or not os.path.exists(path):
        raise HTTPException(404, "File missing")
    return FileResponse(path, media_type="video/mp4",
                        filename=f"selovox-{job_id[:8]}.mp4")

@router.delete("/job/{job_id}")
async def delete_video_job(job_id: str):
    job = _jobs.pop(job_id, None)
    if job:
        path = job.get("output_path")
        if path and os.path.exists(path):
            os.remove(path)
    return {"deleted": True}

# ── Style preview (synchronous, ~3 s) ─────────────────────────────────────────
from concurrent.futures import ThreadPoolExecutor
from starlette.background import BackgroundTask

_preview_executor = ThreadPoolExecutor(max_workers=2)

_STYLE_DISPLAY: dict = {
    "dark_pro":       "Dark Pro",
    "neon":           "Neon City",
    "cinematic":      "Cinematic",
    "tech_dark":      "Tech Dark",
    "retro_wave":     "Retro Wave",
    "clean_light":    "Clean Light",
    "luxury_gold":    "Luxury Gold",
    "corporate":      "Corporate",
    "sunset":         "Sunset Fire",
    "particles_dark": "Particle Storm",
    "product_launch": "Product Launch",
    "minimal_pro":    "Minimal Pro",
    "blueprint":      "Blueprint",
    "neon_urban":     "Neon Urban",
}

def _sync_generate_preview(style_name: str, caption_id: str, aspect_ratio: str = "landscape") -> tuple:
    tmp_dir = str(OUTPUT_DIR / f"prev_{uuid.uuid4().hex[:10]}")
    os.makedirs(tmp_dir, exist_ok=True)
    out_mp4 = os.path.join(tmp_dir, "preview.mp4")

    display = _STYLE_DISPLAY.get(style_name, style_name.replace("_", " ").title())
    scene = {
        "type":     "title",
        "headline": display,
        "subtitle": "Ultra HD Animation Engine",
        "body":     None,
        "_idx":     0,
    }

    total_dur = INTRO_F / FPS + 0.6 + OUTRO_F / FPS

    frames = generate_scene_frames(scene, style_name, caption_id, 0, 1, total_dur, tmp_dir)

    silence_wav = os.path.join(tmp_dir, "silence.wav")
    with open(silence_wav, "wb") as f:
        f.write(_make_silence(total_dur))

    land_mp4 = os.path.join(tmp_dir, "preview_land.mp4")
    build_scene_video(frames, silence_wav, land_mp4, total_dur)
    if aspect_ratio != "landscape":
        apply_aspect_ratio(land_mp4, out_mp4, aspect_ratio)
        os.remove(land_mp4)
    else:
        os.rename(land_mp4, out_mp4)
    return out_mp4, tmp_dir


@router.get("/thumbnail/{style_name}")
async def style_thumbnail(style_name: str, caption_style: str = "subtitle",
                          title: str = "", subtitle: str = ""):
    """Fast single-frame JPEG thumbnail (~0.3s) — used by the style picker."""
    if style_name not in STYLES:
        raise HTTPException(400, f"Unknown style '{style_name}'")

    def _make_thumb() -> bytes:
        display = title.strip() or _STYLE_DISPLAY.get(style_name, style_name.replace("_", " ").title())
        sub = subtitle.strip() or "Ultra HD Animation Engine"
        scene = {
            "type":     "title",
            "headline": display,
            "subtitle": sub,
            "body":     None,
            "_idx":     0,
        }
        hold = render_hold_frame(scene, style_name, caption_style, 0, 1, t=0.5)
        # Downscale to 960×540 for fast transfer
        thumb = hold.resize((960, 540), Image.LANCZOS)
        buf = io.BytesIO()
        thumb.save(buf, "JPEG", quality=82, optimize=True)
        return buf.getvalue()

    loop = asyncio.get_event_loop()
    try:
        jpeg = await loop.run_in_executor(_preview_executor, _make_thumb)
    except Exception as exc:
        logger.error(f"Thumbnail failed for {style_name}: {exc}", exc_info=True)
        raise HTTPException(500, str(exc))
    from starlette.responses import Response as StarResponse
    return StarResponse(
        jpeg,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.get("/preview/{style_name}")
async def style_preview(style_name: str, caption_style: str = "subtitle",
                        aspect_ratio: str = "landscape"):
    if style_name not in STYLES:
        raise HTTPException(400, f"Unknown style '{style_name}'")
    loop = asyncio.get_event_loop()
    try:
        out_mp4, tmp_dir = await loop.run_in_executor(
            _preview_executor, _sync_generate_preview, style_name, caption_style, aspect_ratio,
        )
    except Exception as exc:
        logger.error(f"Preview failed for {style_name}: {exc}", exc_info=True)
        raise HTTPException(500, str(exc))
    return FileResponse(
        out_mp4,
        media_type="video/mp4",
        headers={"Cache-Control": "public, max-age=1800"},
        filename=f"preview-{style_name}.mp4",
        background=BackgroundTask(shutil.rmtree, tmp_dir, True),
    )
