---
name: Video Engine v5
description: Full rewrite of artifacts/voice-engine/video_routes.py — ultra HD animation engine with human characters, kinetic typography, material cards, and 14 visual styles.
---

## Key architecture

**File**: `artifacts/voice-engine/video_routes.py`
**Resolution**: 1920×1080 output, 3× supersampled internally at 5760×3240, downscaled with LANCZOS
**FPS**: 30 | **CRF**: 16 | **Profile**: libx264 high / level 4.2

## 14 Visual Styles
dark_pro, neon, cinematic, tech_dark, retro_wave, clean_light, luxury_gold, corporate, sunset, particles_dark, product_launch, minimal_pro, blueprint, neon_urban

## 7 Scene Types
- `title` — cinematic animated title with floating orbs, eyebrow pill, glowing text
- `character` — articulated stick figure (Character class) with 5 poses: presenting/celebrating/walking/thinking/standing; speech bubble next to character
- `feature` — staggered checkmark list with draw_animated_checkmark()
- `stats` — animated stat counters using draw_stat_counter() with counting-up effect + progress rings
- `product` — glowing material card reveal with icon, price badge, mini feature list
- `comparison` — before/after split panels with sliding reveal
- `cta` — confetti burst (draw_confetti_burst) + pulsing button with glow

## 12 Animation Modes (intro transitions)
zoom_3d, slide_up, glitch_slide, wave_slide, matrix_drop, particle_burst (iris reveal), material_drop (drop+squish), morph_in (horizontal wipe), character_walk, neon_glow (flicker-on), reveal_left, bounce_in, split_reveal

## AI Script Writer Upgrade
`POST /api/video-generator/write-script` now generates structured JSON scene arrays:
`[{"type":"title","headline":"..."}, {"type":"character","body":"...","pose":"presenting"}, ...]`
The Python engine's parse_scenes() detects JSON arrays and uses them directly.
Falls back to plain paragraphs for legacy/manual scripts.

## Caption Styles (6 now)
none, subtitle, bold, minimal, box, neon (glowing neon text effect)

## Frontend
`artifacts/content-studio/src/pages/video-generator.tsx` updated:
- 14 styles in style picker (7-column grid on desktop)
- Header subtitle updated to reflect HD + character animation
- Footer text updated
- New "Neon" caption style added

**Why**: User requested high-quality animated video creation for product launches — human character animations, material animations, kinetic typography, HD resolution.

**How to apply**: When adding new scene types, add to both `draw_scene_content()` in video_routes.py AND the AI system prompt in video-generator.ts. Always test the Voice Engine is running (port 8099) before attempting video generation.
