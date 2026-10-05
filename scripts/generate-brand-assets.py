"""Deterministic logo/icon exports from the supplied WebP. Requires Pillow."""

import json
import math
import re
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets/piggpath-logo.webp"
theme = (ROOT / "src/theme/colors.ts").read_text(encoding="utf-8")
BACKGROUND = re.search(r"iconBackground:\s*'([^']+)'", theme).group(1)


def save(image, relative_path):
    destination = ROOT / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    encoded = BytesIO()
    image.save(encoded, format="PNG", optimize=True)
    content = encoded.getvalue()
    # No-op regeneration should not touch files or trigger Metro refreshes.
    if destination.exists() and destination.read_bytes() == content:
        return
    destination.write_bytes(content)


with Image.open(SOURCE) as original:
    rgba = original.convert("RGBA")
    bounds = rgba.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError("The supplied logo contains no visible artwork.")
    artwork = rgba.crop(bounds)

# Use the actual silhouette rather than an overly small rectangular envelope.
alpha = artwork.getchannel("A")
center_x, center_y = (artwork.width - 1) / 2, (artwork.height - 1) / 2
artwork_radius = max(
    math.hypot(x - center_x, y - center_y)
    for y in range(artwork.height)
    for x in range(artwork.width)
    if alpha.getpixel((x, y)) > 0
)
adaptive_side_dp = 32 * max(artwork.size) / artwork_radius


def render(size, fraction=0.88, opaque=False, circle=False):
    canvas = Image.new("RGBA", (size, size), BACKGROUND if opaque else (0, 0, 0, 0))
    side = max(1, round(size * fraction))
    logo = ImageOps.contain(artwork, (side, side), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo, ((size - logo.width) // 2, (size - logo.height) // 2))
    if circle:
        mask = Image.new("L", (size * 4, size * 4), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
        canvas.putalpha(mask.resize((size, size), Image.Resampling.LANCZOS))
    return canvas.convert("RGB") if opaque and not circle else canvas


save(render(1024, fraction=0.92), "assets/branding/piggypath-master.png")
save(render(576, fraction=0.92), "assets/branding/piggypath-logo.png")
save(render(1024, opaque=True), "assets/branding/piggypath-icon.png")

for density, scale in [("mdpi", 1), ("hdpi", 1.5), ("xhdpi", 2), ("xxhdpi", 3), ("xxxhdpi", 4)]:
    folder = f"android/app/src/main/res/mipmap-{density}"
    save(render(round(48 * scale), opaque=True), f"{folder}/ic_launcher.png")
    # Fit the complete logo inside the round icon's inscribed square.
    save(render(round(48 * scale), fraction=0.66, opaque=True, circle=True), f"{folder}/ic_launcher_round.png")
    # Keep every visible source pixel inside a 64 dp circle, allowing 1 dp
    # of antialiasing margin inside the platform's 66 dp safe circle.
    save(render(round(108 * scale), fraction=adaptive_side_dp / 108), f"{folder}/ic_launcher_foreground.png")

catalog = ROOT / "ios/PiggyPath/Images.xcassets/AppIcon.appiconset"
contents = json.loads((catalog / "Contents.json").read_text(encoding="utf-8"))
for entry in contents["images"]:
    pixels = round(float(entry["size"].split("x")[0]) * float(entry["scale"].rstrip("x")))
    save(render(pixels, opaque=True), str((catalog / entry["filename"]).relative_to(ROOT)))

print("Exported transparent app logo, Android launcher icons, and opaque iOS icons.")
