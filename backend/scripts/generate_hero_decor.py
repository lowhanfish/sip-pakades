import math
from PIL import Image, ImageDraw, ImageFilter


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(len(c1)))


def vertical_gradient(w, h, top, bottom):
    img = Image.new("RGBA", (w, h))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        draw.line([(0, y), (w, y)], fill=lerp_color(top, bottom, t))
    return img


def draw_soft_shadow(canvas, bbox, radius, shadow_color=(37, 99, 235, 42), blur=28, offset=(0, 18)):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = bbox
    ox, oy = offset
    d.rounded_rectangle([x0 + ox, y0 + oy, x1 + ox, y1 + oy], radius=radius, fill=shadow_color)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    canvas.alpha_composite(layer)


def draw_clay_panel(canvas, bbox, radius, fill=(255, 255, 255, 240), inner_tint=(147, 197, 253, 85), shadow_alpha=40):
    draw_soft_shadow(canvas, bbox, radius, shadow_color=(30, 64, 175, shadow_alpha), blur=24, offset=(0, 16))
    panel = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(panel)
    d.rounded_rectangle(bbox, radius=radius, fill=fill)

    # Inner bottom-right blue clay shading
    x0, y0, x1, y1 = bbox
    shade = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    sd.rounded_rectangle([x0 + 6, y0 + 18, x1 - 6, y1 - 2], radius=radius, fill=inner_tint)
    shade = shade.filter(ImageFilter.GaussianBlur(14))

    mask = Image.new("L", canvas.size, 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle(bbox, radius=radius, fill=255)

    # Composite inner highlight & shade clipped to panel
    clipped = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    clipped.paste(shade, (0, 0), mask)
    panel.alpha_composite(clipped)

    # Crisp subtle top highlight border
    d2 = ImageDraw.Draw(panel)
    d2.rounded_rectangle(bbox, radius=radius, outline=(255, 255, 255, 235), width=3)
    canvas.alpha_composite(panel)


def draw_3d_sphere(canvas, cx, cy, r, base_color, light_color, shadow_color=(30, 64, 175, 45)):
    # Drop shadow
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sd.ellipse([cx - r, cy - r + r * 0.28, cx + r, cy + r + r * 0.28], fill=shadow_color)
    sh = sh.filter(ImageFilter.GaussianBlur(max(4, int(r * 0.35))))
    canvas.alpha_composite(sh)

    # Sphere body with radial gradient
    size = r * 2 + 4
    sph = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = sph.load()
    lx, ly = r * 0.65, r * 0.60
    for y in range(size):
        for x in range(size):
            dx = x - r
            dy = y - r
            dist = math.sqrt(dx * dx + dy * dy)
            if dist <= r:
                # Lighting vector
                ldx = (x - lx) / (r * 1.45)
                ldy = (y - ly) / (r * 1.45)
                ld = min(1.0, math.sqrt(ldx * ldx + ldy * ldy))
                col = lerp_color(light_color, base_color, ld ** 0.85)
                edge_alpha = 255 if dist < r - 1.2 else int(max(0, (r - dist) / 1.2) * 255)
                px[x, y] = (col[0], col[1], col[2], edge_alpha)
    canvas.alpha_composite(sph, (int(cx - r), int(cy - r)))


def gen_hero_clay_showcase():
    # 2x supersampled canvas (1600x1120 -> 800x560)
    W, H = 1600, 1120
    canvas = vertical_gradient(W, H, (207, 227, 255, 255), (240, 246, 255, 255))

    # Ambient glowing orbs
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([900, 60, 1520, 680], fill=(147, 197, 253, 110))
    gd.ellipse([80, 480, 680, 1080], fill=(186, 230, 253, 120))
    gd.ellipse([600, 700, 1180, 1100], fill=(224, 242, 254, 140))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    canvas.alpha_composite(glow)

    # Main floating Claymorphism + Glassmorphism dashboard card
    draw_clay_panel(canvas, [250, 220, 1350, 910], radius=64, fill=(255, 255, 255, 242), inner_tint=(191, 219, 254, 95), shadow_alpha=46)

    d = ImageDraw.Draw(canvas)

    # Left inner stat tiles inside main card
    # Tile 1: 94% SLA (soft ice blue)
    draw_clay_panel(canvas, [320, 290, 520, 430], radius=32, fill=(238, 245, 255, 255), inner_tint=(191, 219, 254, 70), shadow_alpha=18)
    # Tile 2: +42% Layanan (fresh emerald clay)
    draw_clay_panel(canvas, [548, 290, 748, 430], radius=32, fill=(74, 222, 128, 245), inner_tint=(22, 163, 74, 85), shadow_alpha=24)

    # Right inner chart container (soft ice blue)
    draw_clay_panel(canvas, [785, 290, 1280, 695], radius=40, fill=(238, 245, 255, 255), inner_tint=(191, 219, 254, 80), shadow_alpha=18)

    # Smooth spline curve inside right chart
    pts = []
    for i in range(60):
        t = i / 59.0
        x = 840 + t * 380
        y = 540 - math.sin(t * math.pi * 1.45) * 95 - t * 65
        pts.append((x, y))
    d = ImageDraw.Draw(canvas)
    for k in range(len(pts) - 1):
        d.line([pts[k], pts[k + 1]], fill=(56, 152, 255, 255), width=12)

    # Glowing node on curve
    draw_3d_sphere(canvas, 1175, 395, 22, (37, 99, 235), (147, 197, 253))

    # Left mini 3D bar chart
    bar_heights = [75, 115, 95, 155, 130, 185, 150, 210]
    for idx, bh in enumerate(bar_heights):
        bx = 335 + idx * 52
        by_bottom = 700
        by_top = by_bottom - bh
        col = (56, 152, 255, 255) if idx % 2 == 0 else (125, 211, 252, 255)
        d.rounded_rectangle([bx, by_top, bx + 26, by_bottom], radius=13, fill=col)

    # Bottom-left 3 clay icon buttons
    for idx, active in enumerate([True, False, False]):
        bx0 = 325 + idx * 140
        bg = (255, 255, 255, 255) if active else (238, 245, 255, 255)
        draw_clay_panel(canvas, [bx0, 745, bx0 + 115, 845], radius=28, fill=bg, inner_tint=(191, 219, 254, 70), shadow_alpha=20)
        d = ImageDraw.Draw(canvas)
        if active:
            d.rounded_rectangle([bx0, 745, bx0 + 115, 845], radius=28, outline=(56, 152, 255, 220), width=4)
        # Mini bars/dots inside button
        d.rounded_rectangle([bx0 + 34, 795, bx0 + 46, 818], radius=6, fill=(30, 41, 59, 230))
        d.rounded_rectangle([bx0 + 52, 778, bx0 + 64, 818], radius=6, fill=(56, 152, 255, 230))
        d.rounded_rectangle([bx0 + 70, 788, bx0 + 82, 818], radius=6, fill=(30, 41, 59, 230))

    # Bottom-right primary azure clay CTA pill
    draw_clay_panel(canvas, [785, 745, 1280, 845], radius=34, fill=(43, 149, 255, 255), inner_tint=(29, 78, 216, 110), shadow_alpha=36)

    # Top-left floating frosted glass-clay badge
    draw_clay_panel(canvas, [120, 95, 580, 320], radius=46, fill=(235, 245, 255, 195), inner_tint=(147, 197, 253, 120), shadow_alpha=35)
    # Bottom-right floating frosted glass-clay badge
    draw_clay_panel(canvas, [1010, 780, 1470, 995], radius=46, fill=(235, 245, 255, 195), inner_tint=(147, 197, 253, 120), shadow_alpha=35)

    # Decorative floating 3D clay spheres
    draw_3d_sphere(canvas, 220, 120, 44, (56, 189, 248), (224, 242, 254))
    draw_3d_sphere(canvas, 1390, 210, 52, (250, 204, 21), (254, 249, 195))
    draw_3d_sphere(canvas, 1250, 975, 38, (52, 211, 153), (209, 250, 229))
    draw_3d_sphere(canvas, 170, 770, 32, (96, 165, 250), (219, 234, 254))

    out = canvas.resize((800, 560), Image.Resampling.LANCZOS)
    out.convert("RGB").save("frontend/public/img/hero-clay-showcase.webp", "WEBP", quality=92)


def gen_pelayanan_3d_clay():
    W, H = 1200, 840
    canvas = vertical_gradient(W, H, (219, 234, 254, 255), (241, 246, 253, 255))

    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([120, 80, 620, 580], fill=(147, 197, 253, 115))
    gd.ellipse([600, 260, 1100, 760], fill=(167, 243, 208, 95))
    glow = glow.filter(ImageFilter.GaussianBlur(70))
    canvas.alpha_composite(glow)

    # Main document card
    draw_clay_panel(canvas, [280, 120, 920, 720], radius=56, fill=(255, 255, 255, 245), inner_tint=(191, 219, 254, 90), shadow_alpha=42)

    d = ImageDraw.Draw(canvas)
    # Header bar inside document
    draw_clay_panel(canvas, [350, 190, 850, 285], radius=28, fill=(238, 245, 255, 255), inner_tint=(191, 219, 254, 70), shadow_alpha=12)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([385, 222, 620, 252], radius=15, fill=(43, 149, 255, 235))

    # Skeleton lines
    for y in [345, 415, 485, 555]:
        w_line = 430 if y != 555 else 290
        d.rounded_rectangle([360, y, 360 + w_line, y + 28], radius=14, fill=(226, 232, 240, 255))

    # Floating green verified 3D sphere badge
    draw_3d_sphere(canvas, 890, 595, 88, (34, 197, 94), (187, 247, 208))
    d = ImageDraw.Draw(canvas)
    d.line([(850, 595), (880, 628)], fill=(255, 255, 255, 255), width=16)
    d.line([(880, 628), (934, 562)], fill=(255, 255, 255, 255), width=16)

    # Decorative floating spheres
    draw_3d_sphere(canvas, 210, 220, 48, (56, 189, 248), (224, 242, 254))
    draw_3d_sphere(canvas, 970, 175, 36, (250, 204, 21), (254, 249, 195))

    out = canvas.resize((600, 420), Image.Resampling.LANCZOS)
    out.convert("RGB").save("frontend/public/img/pelayanan-3d-clay.webp", "WEBP", quality=92)


def gen_wilayah_3d_clay():
    W, H = 1200, 840
    canvas = vertical_gradient(W, H, (207, 227, 255, 255), (238, 246, 255, 255))

    # Soft sky clouds
    draw_3d_sphere(canvas, 240, 190, 75, (235, 245, 255), (255, 255, 255))
    draw_3d_sphere(canvas, 320, 180, 92, (238, 246, 255), (255, 255, 255))
    draw_3d_sphere(canvas, 960, 170, 68, (254, 240, 138), (255, 255, 255))

    # Floating map island card
    draw_clay_panel(canvas, [170, 260, 1030, 720], radius=64, fill=(255, 255, 255, 242), inner_tint=(191, 219, 254, 95), shadow_alpha=42)
    draw_clay_panel(canvas, [220, 310, 980, 670], radius=44, fill=(224, 242, 254, 255), inner_tint=(147, 197, 253, 80), shadow_alpha=15)

    d = ImageDraw.Draw(canvas)
    # Stylized green coastal hills inside map card
    d.polygon([(220, 560), (430, 430), (680, 560), (880, 450), (980, 520), (980, 670), (220, 670)], fill=(74, 222, 128, 215))
    d.polygon([(220, 610), (490, 510), (760, 600), (980, 550), (980, 670), (220, 670)], fill=(34, 197, 94, 230))

    # 3D clay location pins
    draw_3d_sphere(canvas, 600, 410, 62, (37, 99, 235), (147, 197, 253))
    draw_3d_sphere(canvas, 600, 410, 24, (255, 255, 255), (255, 255, 255))
    draw_3d_sphere(canvas, 390, 505, 34, (245, 158, 11), (254, 243, 199))
    draw_3d_sphere(canvas, 815, 495, 34, (14, 165, 233), (224, 242, 254))

    out = canvas.resize((600, 420), Image.Resampling.LANCZOS)
    out.convert("RGB").save("frontend/public/img/wilayah-3d-clay.webp", "WEBP", quality=92)


if __name__ == "__main__":
    gen_hero_clay_showcase()
    gen_pelayanan_3d_clay()
    gen_wilayah_3d_clay()
    print("3D clay decorative landing page images generated!")
