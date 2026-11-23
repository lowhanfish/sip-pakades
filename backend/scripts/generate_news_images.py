from PIL import Image, ImageDraw, ImageFilter
from generate_hero_decor import (
    vertical_gradient,
    draw_clay_panel,
    draw_3d_sphere,
)


def gen_berita_rakor():
    """Rapat Koordinasi & Evaluasi Kecamatan (3D Clay Meeting & Chart Board)"""
    W, H = 1200, 760
    canvas = vertical_gradient(W, H, (207, 227, 255, 255), (241, 246, 253, 255))

    # Presentation board
    draw_clay_panel(canvas, [210, 110, 990, 560], radius=48, fill=(255, 255, 255, 245), inner_tint=(191, 219, 254, 90), shadow_alpha=40)
    draw_clay_panel(canvas, [265, 165, 935, 505], radius=32, fill=(238, 245, 255, 255), inner_tint=(191, 219, 254, 70), shadow_alpha=15)

    d = ImageDraw.Draw(canvas)
    # Bar charts on board
    bars = [(340, 320, 460, (56, 152, 255, 255)), (415, 275, 460, (14, 165, 233, 255)),
            (490, 235, 460, (37, 99, 235, 255)), (565, 290, 460, (52, 211, 153, 255))]
    for x, top, bot, col in bars:
        d.rounded_rectangle([x, top, x + 48, bot], radius=16, fill=col)

    # Agenda lines on right side of board
    for y in [235, 295, 355, 415]:
        d.rounded_rectangle([670, y, 875, y + 26], radius=13, fill=(191, 219, 254, 255))

    # Floating attendee clay avatars (3D spheres)
    draw_3d_sphere(canvas, 340, 610, 56, (37, 99, 235), (147, 197, 253))
    draw_3d_sphere(canvas, 600, 620, 62, (14, 165, 233), (186, 230, 253))
    draw_3d_sphere(canvas, 860, 610, 56, (34, 197, 94), (187, 247, 208))

    out = canvas.resize((600, 380), Image.Resampling.LANCZOS)
    out.convert("RGB").save("frontend/public/img/berita-rakor.webp", "WEBP", quality=92)


def gen_berita_layanan():
    """Maklumat Pelayanan SIP-PAKADES (3D Clay Service Counter & Digital Card)"""
    W, H = 1200, 760
    canvas = vertical_gradient(W, H, (219, 234, 254, 255), (240, 249, 255, 255))

    # Service terminal card
    draw_clay_panel(canvas, [250, 115, 950, 635], radius=56, fill=(255, 255, 255, 245), inner_tint=(191, 219, 254, 95), shadow_alpha=42)
    draw_clay_panel(canvas, [315, 175, 885, 305], radius=28, fill=(43, 149, 255, 255), inner_tint=(29, 78, 216, 100), shadow_alpha=24)

    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([355, 222, 660, 258], radius=18, fill=(255, 255, 255, 235))

    # Service cards inside
    draw_clay_panel(canvas, [315, 345, 580, 560], radius=32, fill=(238, 245, 255, 255), inner_tint=(191, 219, 254, 70), shadow_alpha=14)
    draw_clay_panel(canvas, [620, 345, 885, 560], radius=32, fill=(238, 245, 255, 255), inner_tint=(191, 219, 254, 70), shadow_alpha=14)

    # Badges
    draw_3d_sphere(canvas, 920, 155, 52, (250, 204, 21), (254, 249, 195))
    draw_3d_sphere(canvas, 250, 560, 64, (34, 197, 94), (187, 247, 208))
    d = ImageDraw.Draw(canvas)
    d.line([(222, 560), (242, 584)], fill=(255, 255, 255, 255), width=12)
    d.line([(242, 584), (282, 536)], fill=(255, 255, 255, 255), width=12)

    out = canvas.resize((600, 380), Image.Resampling.LANCZOS)
    out.convert("RGB").save("frontend/public/img/berita-layanan.webp", "WEBP", quality=92)


def gen_berita_musrenbang():
    """Musrenbang & Gotong Royong Pembangunan Desa (3D Clay Growth & Village Plan)"""
    W, H = 1200, 760
    canvas = vertical_gradient(W, H, (207, 227, 255, 255), (236, 253, 245, 255))

    # Main blueprint card
    draw_clay_panel(canvas, [200, 130, 1000, 620], radius=56, fill=(255, 255, 255, 242), inner_tint=(167, 243, 208, 95), shadow_alpha=40)
    draw_clay_panel(canvas, [260, 190, 940, 560], radius=36, fill=(236, 253, 245, 255), inner_tint=(167, 243, 208, 80), shadow_alpha=14)

    d = ImageDraw.Draw(canvas)
    # Growth curve
    d.line([(320, 480), (480, 390), (650, 420), (860, 250)], fill=(16, 185, 129, 255), width=16)

    # Nodes
    draw_3d_sphere(canvas, 320, 480, 28, (14, 165, 233), (186, 230, 253))
    draw_3d_sphere(canvas, 480, 390, 28, (14, 165, 233), (186, 230, 253))
    draw_3d_sphere(canvas, 650, 420, 28, (245, 158, 11), (254, 243, 199))
    draw_3d_sphere(canvas, 860, 250, 42, (34, 197, 94), (187, 247, 208))

    out = canvas.resize((600, 380), Image.Resampling.LANCZOS)
    out.convert("RGB").save("frontend/public/img/berita-musrenbang.webp", "WEBP", quality=92)


if __name__ == "__main__":
    gen_berita_rakor()
    gen_berita_layanan()
    gen_berita_musrenbang()
    print("News claymorphic thumbnails generated!")
