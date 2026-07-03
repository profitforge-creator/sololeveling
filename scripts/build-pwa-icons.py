from pathlib import Path
from PIL import Image, ImageFilter
import math

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "public" / "icons"
SOURCE = ICONS / "system-s-transparent.png"


def background(size):
    image = Image.new("RGBA", (size, size))
    pixels = image.load()
    center = size * 0.48
    max_distance = math.sqrt(2) * size * 0.62
    for y in range(size):
        for x in range(size):
            distance = math.sqrt((x - center) ** 2 + (y - center) ** 2) / max_distance
            glow = max(0.0, 1.0 - distance)
            edge = max(0.0, min(1.0, distance))
            r = int(2 + glow * 3)
            g = int(7 + glow * 17 - edge * 2)
            b = int(18 + glow * 38 - edge * 5)
            pixels[x, y] = (r, max(3, g), max(10, b), 255)
    return image


def prepared_mark(target_size, fill_ratio):
    mark = Image.open(SOURCE).convert("RGBA")
    bbox = mark.getchannel("A").getbbox()
    if bbox:
        mark = mark.crop(bbox)
    limit = int(target_size * fill_ratio)
    mark.thumbnail((limit, limit), Image.Resampling.LANCZOS)
    return mark


def compose_icon(size, fill_ratio=0.76):
    canvas = background(size)
    mark = prepared_mark(size, fill_ratio)
    x = (size - mark.width) // 2
    y = (size - mark.height) // 2

    alpha = Image.new("L", (size, size), 0)
    alpha.paste(mark.getchannel("A"), (x, y))
    glow = Image.new("RGBA", (size, size), (23, 158, 255, 0))
    glow.putalpha(alpha.filter(ImageFilter.GaussianBlur(max(3, size // 34))))
    canvas = Image.alpha_composite(canvas, glow)
    canvas.alpha_composite(mark, (x, y))

    rim = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rp = rim.load()
    width = max(1, size // 128)
    for i in range(width):
        opacity = int(95 * (1 - i / max(1, width)))
        for p in range(i, size - i):
            rp[p, i] = (55, 198, 255, opacity)
            rp[p, size - 1 - i] = (55, 198, 255, opacity)
            rp[i, p] = (55, 198, 255, opacity)
            rp[size - 1 - i, p] = (55, 198, 255, opacity)
    return Image.alpha_composite(canvas, rim).convert("RGB")


def save_resized(master, size, name):
    master.resize((size, size), Image.Resampling.LANCZOS).save(ICONS / name, optimize=True)


def splash(width, height, name):
    base = background(max(width, height)).crop((0, 0, width, height))
    mark = prepared_mark(min(width, height), 0.46)
    x = (width - mark.width) // 2
    y = int(height * 0.38 - mark.height / 2)
    alpha = Image.new("L", (width, height), 0)
    alpha.paste(mark.getchannel("A"), (x, y))
    glow = Image.new("RGBA", (width, height), (29, 156, 255, 0))
    glow.putalpha(alpha.filter(ImageFilter.GaussianBlur(48)))
    base = Image.alpha_composite(base, glow)
    base.alpha_composite(mark, (x, y))
    base.convert("RGB").save(ICONS / name, optimize=True)


def main():
    ICONS.mkdir(parents=True, exist_ok=True)
    master = compose_icon(1024)
    master.save(ICONS / "icon-1024.png", optimize=True)
    for size in (512, 192, 180, 96, 48, 32, 16):
        name = "apple-touch-icon.png" if size == 180 else f"icon-{size}.png"
        save_resized(master, size, name)
    compose_icon(512, 0.64).save(ICONS / "icon-maskable-512.png", optimize=True)
    master.resize((64, 64), Image.Resampling.LANCZOS).save(
        ICONS / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )
    splash(1170, 2532, "splash-1170x2532.png")
    splash(1290, 2796, "splash-1290x2796.png")


if __name__ == "__main__":
    main()
