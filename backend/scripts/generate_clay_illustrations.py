import math
from PIL import Image, ImageDraw, ImageFilter

def create_clay_gradient(width, height, top_color, bottom_color):
    base = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(base)
    for y in range(height):
        r = y / height
        cur_r = int(top_color[0] + (bottom_color[0] - top_color[0]) * r)
        cur_g = int(top_color[1] + (bottom_color[1] - top_color[1]) * r)
        cur_b = int(top_color[2] + (bottom_color[2] - top_color[2]) * r)
        draw.line([(0, y), (width, y)], fill=(cur_r, cur_g, cur_b, 255))
    return base

def draw_clay_bubble(draw, bbox, fill_color, highlight_color):
    x0, y0, x1, y1 = bbox
    w, h = x1 - x0, y1 - y0
    # Outer base
    draw.ellipse(bbox, fill=fill_color)
    # Highlight
    hx0 = x0 + w * 0.15
    hy0 = y0 + h * 0.12
    hx1 = x0 + w * 0.55
    hy1 = y0 + h * 0.45
    draw.ellipse([hx0, hy0, hx1, hy1], fill=highlight_color)

# 1. Wisata Torobulu (Pantai & Laut Biru)
def gen_torobulu():
    w, h = 800, 520
    img = create_clay_gradient(w, h, (186, 230, 253), (254, 249, 195))
    draw = ImageDraw.Draw(img)
    # Sun
    draw_clay_bubble(draw, [560, 40, 700, 180], (253, 224, 71, 240), (255, 255, 255, 200))
    # Hills
    draw.polygon([(0, 310), (140, 240), (320, 290), (510, 230), (680, 280), (800, 250), (800, 520), (0, 520)], fill=(125, 211, 252, 230))
    draw.polygon([(0, 350), (190, 280), (380, 330), (590, 270), (760, 310), (800, 290), (800, 520), (0, 520)], fill=(56, 189, 248, 240))
    # Ocean waves
    draw.polygon([(0, 340), (800, 320), (800, 440), (0, 460)], fill=(14, 165, 233, 255))
    # Soft beach sand
    draw.polygon([(0, 430), (800, 400), (800, 520), (0, 520)], fill=(254, 240, 138, 255))
    # Clay Palms
    draw.line([(680, 440), (660, 280)], fill=(120, 75, 40, 255), width=8)
    draw_clay_bubble(draw, [600, 220, 720, 310], (34, 197, 94, 240), (134, 239, 172, 220))
    draw_clay_bubble(draw, [630, 240, 710, 320], (22, 163, 74, 240), (74, 222, 128, 220))
    # Boat
    draw.polygon([(240, 380), (360, 380), (340, 410), (260, 410)], fill=(239, 68, 68, 240))
    draw.polygon([(295, 330), (345, 375), (295, 375)], fill=(255, 255, 255, 240))
    img.convert("RGB").save("frontend/public/img/wisata-torobulu.webp", "WEBP", quality=92)

# 2. Wisata Air Terjun (Air Terjun Moramo / Alam)
def gen_waterfall():
    w, h = 800, 520
    img = create_clay_gradient(w, h, (147, 197, 253), (209, 250, 229))
    draw = ImageDraw.Draw(img)
    # Lush jungle mountains
    draw.polygon([(0, 200), (240, 90), (480, 220), (720, 110), (800, 170), (800, 520), (0, 520)], fill=(22, 101, 52, 255))
    draw.polygon([(0, 280), (210, 160), (420, 280), (640, 180), (800, 260), (800, 520), (0, 520)], fill=(34, 197, 94, 240))
    # Waterfall cliff rock
    draw.polygon([(320, 240), (480, 240), (510, 520), (290, 520)], fill=(100, 116, 139, 255))
    # Cascading water
    draw.polygon([(360, 240), (440, 240), (460, 500), (340, 500)], fill=(186, 230, 253, 240))
    draw.polygon([(380, 250), (420, 250), (435, 480), (365, 480)], fill=(255, 255, 255, 250))
    # River lagoon pool
    draw_clay_bubble(draw, [150, 420, 650, 540], (56, 189, 248, 240), (186, 230, 253, 220))
    img.convert("RGB").save("frontend/public/img/wisata-air-terjun.webp", "WEBP", quality=92)

# 3. Wisata Mangrove (Pesisir & Ekowisata)
def gen_mangrove():
    w, h = 800, 520
    img = create_clay_gradient(w, h, (224, 242, 254), (254, 243, 199))
    draw = ImageDraw.Draw(img)
    # Sunset sun
    draw_clay_bubble(draw, [320, 100, 480, 260], (251, 146, 60, 240), (254, 215, 170, 220))
    # Water
    draw.polygon([(0, 310), (800, 310), (800, 520), (0, 520)], fill=(14, 165, 233, 240))
    # Mangrove islands
    draw_clay_bubble(draw, [40, 260, 260, 410], (21, 128, 61, 240), (134, 239, 172, 200))
    draw_clay_bubble(draw, [520, 250, 760, 420], (22, 163, 74, 240), (187, 247, 208, 200))
    draw_clay_bubble(draw, [280, 290, 460, 400], (34, 197, 94, 240), (220, 252, 231, 200))
    # Wooden bridge boardwalk
    draw.polygon([(370, 520), (430, 520), (405, 330), (395, 330)], fill=(180, 83, 9, 250))
    draw.line([(365, 450), (435, 450)], fill=(217, 119, 6, 255), width=4)
    draw.line([(375, 400), (425, 400)], fill=(217, 119, 6, 255), width=4)
    img.convert("RGB").save("frontend/public/img/wisata-mangrove.webp", "WEBP", quality=92)

# 4. Potensi Perikanan & Kelautan
def gen_perikanan():
    w, h = 800, 520
    img = create_clay_gradient(w, h, (186, 230, 253), (224, 242, 254))
    draw = ImageDraw.Draw(img)
    # Ocean base
    draw.polygon([(0, 220), (800, 220), (800, 520), (0, 520)], fill=(2, 132, 199, 240))
    # Aquaculture ponds
    draw_clay_bubble(draw, [60, 280, 360, 480], (14, 165, 233, 240), (186, 230, 253, 220))
    draw_clay_bubble(draw, [420, 300, 740, 500], (56, 189, 248, 240), (224, 242, 254, 220))
    # Fish silhouettes in clay style
    draw_clay_bubble(draw, [160, 340, 240, 380], (255, 255, 255, 230), (255, 255, 255, 255))
    draw_clay_bubble(draw, [520, 360, 620, 410], (254, 240, 138, 230), (255, 255, 255, 255))
    img.convert("RGB").save("frontend/public/img/potensi-perikanan.webp", "WEBP", quality=92)

# 5. Potensi Pertanian (Padi & Sawah)
def gen_pertanian():
    w, h = 800, 520
    img = create_clay_gradient(w, h, (254, 249, 195), (209, 250, 229))
    draw = ImageDraw.Draw(img)
    # Blue hills
    draw.polygon([(0, 220), (200, 140), (450, 230), (680, 150), (800, 210), (800, 520), (0, 520)], fill=(147, 197, 253, 220))
    # Terraced rice fields
    draw.polygon([(0, 270), (800, 250), (800, 360), (0, 380)], fill=(134, 239, 172, 240))
    draw.polygon([(0, 360), (800, 330), (800, 440), (0, 460)], fill=(74, 222, 128, 240))
    draw.polygon([(0, 440), (800, 410), (800, 520), (0, 520)], fill=(250, 204, 21, 240))
    img.convert("RGB").save("frontend/public/img/potensi-pertanian.webp", "WEBP", quality=92)

# 6. Potensi Perkebunan (Kakao, Jambu Mete, Lada)
def gen_perkebunan():
    w, h = 800, 520
    img = create_clay_gradient(w, h, (254, 243, 199), (220, 252, 231))
    draw = ImageDraw.Draw(img)
    # Hill background
    draw.polygon([(0, 240), (280, 160), (560, 250), (740, 180), (800, 220), (800, 520), (0, 520)], fill=(187, 247, 208, 230))
    # Plantation field
    draw.polygon([(0, 290), (800, 270), (800, 520), (0, 520)], fill=(34, 197, 94, 240))
    # Clay plantation trees
    for x in [120, 280, 460, 640]:
        draw.line([(x, 480), (x, 340)], fill=(120, 53, 15, 255), width=8)
        draw_clay_bubble(draw, [x - 55, 270, x + 55, 370], (22, 101, 52, 240), (134, 239, 172, 220))
    img.convert("RGB").save("frontend/public/img/potensi-perkebunan.webp", "WEBP", quality=92)

# 7. Gedung Kantor Kecamatan (Clay Government Building)
def gen_kantor_kecamatan():
    w, h = 800, 520
    img = create_clay_gradient(w, h, (186, 230, 253), (254, 249, 195))
    draw = ImageDraw.Draw(img)
    # Clouds
    draw_clay_bubble(draw, [80, 60, 260, 150], (255, 255, 255, 220), (255, 255, 255, 255))
    draw_clay_bubble(draw, [540, 70, 720, 160], (255, 255, 255, 220), (255, 255, 255, 255))
    # Plaza base
    draw.polygon([(0, 410), (800, 410), (800, 520), (0, 520)], fill=(203, 213, 225, 255))
    draw.polygon([(40, 440), (760, 440), (800, 520), (0, 520)], fill=(226, 232, 240, 255))
    # Main Building Body
    draw.rectangle([180, 220, 620, 420], fill=(255, 255, 255, 250))
    # Roof pediment
    draw.polygon([(160, 220), (400, 130), (640, 220)], fill=(2, 132, 199, 250))
    # Dome
    draw_clay_bubble(draw, [340, 70, 460, 170], (253, 224, 71, 250), (255, 255, 255, 220))
    # Columns
    for col_x in [230, 310, 390, 470, 550]:
        draw.rectangle([col_x, 220, col_x + 24, 420], fill=(241, 245, 249, 255))
        draw.rectangle([col_x - 4, 216, col_x + 28, 228], fill=(14, 165, 233, 255))
        draw.rectangle([col_x - 4, 410, col_x + 28, 422], fill=(14, 165, 233, 255))
    # Flagpole
    draw.line([(400, 70), (400, 20)], fill=(71, 85, 105, 255), width=3)
    draw.rectangle([400, 22, 440, 36], fill=(239, 68, 68, 255))
    draw.rectangle([400, 36, 440, 50], fill=(255, 255, 255, 255))
    img.convert("RGB").save("frontend/public/img/gedung-kecamatan.webp", "WEBP", quality=92)

# 8. Pelayanan Dokumen SIP-PAKADES
def gen_pelayanan_dokumen():
    w, h = 800, 520
    img = create_clay_gradient(w, h, (224, 242, 254), (254, 240, 138))
    draw = ImageDraw.Draw(img)
    # Ambient clay orbs
    draw_clay_bubble(draw, [50, 40, 220, 210], (186, 230, 253, 180), (255, 255, 255, 230))
    draw_clay_bubble(draw, [620, 300, 760, 440], (253, 224, 71, 180), (255, 255, 255, 230))
    # Document sheet in clay 3D tilt
    draw.polygon([(260, 110), (520, 70), (570, 410), (310, 450)], fill=(255, 255, 255, 255))
    # Header badge on document
    draw.polygon([(300, 130), (490, 100), (480, 160), (290, 190)], fill=(14, 165, 233, 230))
    # Lines of text
    for y_off in [210, 250, 290, 330, 370]:
        draw.line([(310, y_off), (490, y_off - 28)], fill=(203, 213, 225, 255), width=8)
    # Stamp / Seal
    draw_clay_bubble(draw, [430, 320, 530, 420], (239, 68, 68, 230), (254, 202, 202, 220))
    draw_clay_bubble(draw, [450, 340, 510, 400], (255, 255, 255, 255), (255, 255, 255, 255))
    # Checkmark badge
    draw_clay_bubble(draw, [180, 270, 310, 400], (34, 197, 94, 250), (187, 247, 208, 230))
    draw.line([(220, 335), (242, 360)], fill=(255, 255, 255, 255), width=7)
    draw.line([(242, 360), (280, 310)], fill=(255, 255, 255, 255), width=7)
    img.convert("RGB").save("frontend/public/img/pelayanan-dokumen.webp", "WEBP", quality=92)

# 9. Desa & Kelurahan Landscape
def gen_desa_kelurahan():
    w, h = 800, 520
    img = create_clay_gradient(w, h, (186, 230, 253), (220, 252, 231))
    draw = ImageDraw.Draw(img)
    # Distant clay mountain
    draw.polygon([(60, 320), (320, 120), (580, 320)], fill=(125, 211, 252, 230))
    draw.polygon([(260, 160), (320, 120), (380, 160)], fill=(255, 255, 255, 240))
    draw.polygon([(340, 320), (540, 160), (740, 320)], fill=(56, 189, 248, 230))
    # Rolling green hills
    draw_clay_bubble(draw, [-100, 260, 400, 540], (34, 197, 94, 240), (134, 239, 172, 200))
    draw_clay_bubble(draw, [350, 280, 850, 560], (22, 163, 74, 240), (74, 222, 128, 200))
    # Bale Desa Building
    draw.rectangle([340, 360, 480, 460], fill=(254, 243, 199, 255))
    draw.polygon([(320, 360), (410, 300), (500, 360)], fill=(217, 119, 6, 255))
    draw.rectangle([390, 400, 430, 460], fill=(120, 53, 15, 255))
    img.convert("RGB").save("frontend/public/img/desa-kelurahan.webp", "WEBP", quality=92)

if __name__ == "__main__":
    gen_torobulu()
    gen_waterfall()
    gen_mangrove()
    gen_perikanan()
    gen_pertanian()
    gen_perkebunan()
    gen_kantor_kecamatan()
    gen_pelayanan_dokumen()
    gen_desa_kelurahan()
    print("All 9 claymorphic illustrations generated!")
