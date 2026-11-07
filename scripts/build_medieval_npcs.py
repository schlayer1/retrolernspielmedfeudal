import os
from PIL import Image

def remap_npc(base_img, config):
    w, h = base_img.size
    out_img = base_img.copy()
    pixels = out_img.load()

    # config keys:
    # hair_color: (r, g, b)
    # tunic_color: (r, g, b)
    # pants_color: (r, g, b)
    # headwear: optional function(col, row, x, y)
    # accessory: optional function(col, row, x, y)

    for col in range(4):
        for row in range(4):
            fx = col * 16
            fy = row * 32

            for y in range(32):
                for x in range(16):
                    px = fx + x
                    py = fy + y
                    r, g, b, a = pixels[px, py]
                    if a < 100:
                        continue

                    # Protected face zone: y in 10..18, x in 3..12
                    is_face = (10 <= y <= 18) and (r > 160 and g > 110 and b > 80 and r >= g and g >= b)
                    is_eye_or_mouth = (10 <= y <= 18) and (r < 60 and g < 60 and b < 60)

                    if is_face or is_eye_or_mouth:
                        continue

                    # Hair zone: y <= 14
                    is_hair = (y <= 13) and (r > 50 and r < 155 and g > 30 and g < 110 and b > 15 and b < 85 and r > g and g >= b)
                    if is_hair and 'hair_color' in config:
                        hr, hg, hb = config['hair_color']
                        lum = (r * 0.299 + g * 0.587 + b * 0.114) / 100.0
                        pixels[px, py] = (
                            min(255, int(hr * lum)),
                            min(255, int(hg * lum)),
                            min(255, int(hb * lum)),
                            a
                        )

                    # Tunic / Chest zone: y >= 14 and y <= 23
                    is_tunic = (14 <= y <= 23) and (r > 100 and r > g * 1.3 and r > b * 1.3)
                    if is_tunic and 'tunic_color' in config:
                        tr, tg, tb = config['tunic_color']
                        lum = (r * 0.299 + g * 0.587 + b * 0.114) / 150.0
                        pixels[px, py] = (
                            min(255, int(tr * lum)),
                            min(255, int(tg * lum)),
                            min(255, int(tb * lum)),
                            a
                        )

                    # Pants / Lower body zone: y >= 22
                    is_pants = (y >= 22) and (b > 60 and b > r * 1.05 and b >= g)
                    if is_pants and 'pants_color' in config:
                        pr, pg, pb = config['pants_color']
                        lum = (r * 0.299 + g * 0.587 + b * 0.114) / 100.0
                        pixels[px, py] = (
                            min(255, int(pr * lum)),
                            min(255, int(pg * lum)),
                            min(255, int(pb * lum)),
                            a
                        )

            # Custom headwear or accessories per frame
            if 'draw_decor' in config:
                config['draw_decor'](pixels, fx, fy, row, col)

    return out_img


def draw_meier_decor(pixels, fx, fy, row, col):
    # Working hood / bonnet and leather belt
    # Belt at y=21
    for x in range(4, 12):
        if pixels[fx + x, fy + 21][3] > 100:
            pixels[fx + x, fy + 21] = (70, 40, 15, 255)
    # Gold buckle
    if row == 0:
        pixels[fx + 7, fy + 21] = (245, 158, 11, 255)
        pixels[fx + 8, fy + 21] = (245, 158, 11, 255)

def draw_walther_decor(pixels, fx, fy, row, col):
    # Peasant rope belt
    for x in range(4, 12):
        if pixels[fx + x, fy + 21][3] > 100:
            pixels[fx + x, fy + 21] = (180, 150, 100, 255)

def draw_anselm_decor(pixels, fx, fy, row, col):
    # Monastic tonsure (bald top center on down/side view) & white rope cincture
    if row == 0 or row == 2:
        for x in range(6, 10):
            if pixels[fx + x, fy + 7][3] > 100:
                pixels[fx + x, fy + 7] = (225, 185, 145, 255)
            if pixels[fx + x, fy + 8][3] > 100:
                pixels[fx + x, fy + 8] = (225, 185, 145, 255)
    # White rope belt at y=21
    for x in range(4, 12):
        if pixels[fx + x, fy + 21][3] > 100:
            pixels[fx + x, fy + 21] = (235, 235, 225, 255)

def draw_wolfram_decor(pixels, fx, fy, row, col):
    # Steel knight helm at top (y=3..8) and white cross on chest (row 0)
    for y in range(4, 8):
        for x in range(4, 12):
            if pixels[fx + x, fy + y][3] > 100:
                pixels[fx + x, fy + y] = (160, 170, 185, 255)
    if row == 0:
        # White cross on surcoat
        pixels[fx + 7, fy + 17] = (245, 245, 250, 255)
        pixels[fx + 8, fy + 17] = (245, 245, 250, 255)
        pixels[fx + 7, fy + 18] = (245, 245, 250, 255)
        pixels[fx + 8, fy + 18] = (245, 245, 250, 255)
        pixels[fx + 6, fy + 17] = (245, 245, 250, 255)
        pixels[fx + 9, fy + 17] = (245, 245, 250, 255)

def draw_eberhard_decor(pixels, fx, fy, row, col):
    # Golden count circlet on forehead (y=8..9)
    for x in range(5, 11):
        if pixels[fx + x, fy + 8][3] > 100:
            pixels[fx + x, fy + 8] = (250, 204, 21, 255)
    # Ruby gemstone center
    if row == 0:
        pixels[fx + 7, fy + 8] = (220, 38, 38, 255)
        pixels[fx + 8, fy + 8] = (220, 38, 38, 255)
    # White ermine fur collar (y=14..15)
    if row == 0:
        for x in range(4, 12):
            if pixels[fx + x, fy + 14][3] > 100:
                pixels[fx + x, fy + 14] = (245, 245, 245, 255)

def draw_hartmut_decor(pixels, fx, fy, row, col):
    # Quarterly tabard: left side blue, right side gold on chest (row 0)
    if row == 0:
        for y in range(15, 21):
            for x in range(4, 8):
                if pixels[fx + x, fy + y][3] > 100:
                    pixels[fx + x, fy + y] = (37, 99, 235, 255)
            for x in range(8, 12):
                if pixels[fx + x, fy + y][3] > 100:
                    pixels[fx + x, fy + y] = (234, 179, 8, 255)

def draw_jakob_decor(pixels, fx, fy, row, col):
    # Patrician velvet cap and gold chain
    if row == 0:
        pixels[fx + 7, fy + 15] = (234, 179, 8, 255)
        pixels[fx + 8, fy + 15] = (234, 179, 8, 255)
        pixels[fx + 6, fy + 16] = (234, 179, 8, 255)
        pixels[fx + 9, fy + 16] = (234, 179, 8, 255)

def draw_arnold_decor(pixels, fx, fy, row, col):
    # Heavy leather apron
    if row == 0:
        for y in range(16, 23):
            for x in range(5, 11):
                if pixels[fx + x, fy + y][3] > 100:
                    pixels[fx + x, fy + y] = (120, 53, 15, 255)


def main():
    base = Image.open('public/assets/gfx/npcs/base_template.png')
    out_dir = 'public/assets/gfx/npcs'
    os.makedirs(out_dir, exist_ok=True)

    npcs = {
        'npc_meier': {
            'hair_color': (90, 60, 40),
            'tunic_color': (45, 100, 45),     # Sage green tunic
            'pants_color': (70, 50, 35),      # Brown breeches
            'draw_decor': draw_meier_decor,
        },
        'npc_walther': {
            'hair_color': (140, 130, 110),   # Graying elder hair
            'tunic_color': (160, 125, 80),    # Raw linen tunic
            'pants_color': (85, 65, 45),
            'draw_decor': draw_walther_decor,
        },
        'npc_anselm': {
            'hair_color': (80, 55, 35),
            'tunic_color': (55, 35, 20),      # Dark monk cowl
            'pants_color': (45, 28, 16),
            'draw_decor': draw_anselm_decor,
        },
        'npc_wolfram': {
            'hair_color': (70, 45, 30),
            'tunic_color': (185, 28, 28),     # Scarlet red knight surcoat
            'pants_color': (148, 163, 184),   # Steel chainmail greaves
            'draw_decor': draw_wolfram_decor,
        },
        'npc_eberhard': {
            'hair_color': (150, 140, 130),   # Silver noble hair
            'tunic_color': (136, 19, 55),     # Crimson noble velvet
            'pants_color': (65, 15, 30),
            'draw_decor': draw_eberhard_decor,
        },
        'npc_hartmut': {
            'hair_color': (110, 75, 45),
            'tunic_color': (37, 99, 235),     # Heraldic blue & gold
            'pants_color': (30, 58, 138),
            'draw_decor': draw_hartmut_decor,
        },
        'npc_jakob': {
            'hair_color': (85, 55, 35),
            'tunic_color': (30, 58, 138),     # Ultramarine patrician robe
            'pants_color': (20, 30, 60),
            'draw_decor': draw_jakob_decor,
        },
        'npc_arnold': {
            'hair_color': (100, 90, 80),
            'tunic_color': (51, 65, 85),      # Master mason slate tunic
            'pants_color': (40, 45, 55),
            'draw_decor': draw_arnold_decor,
        },
    }

    for npc_id, cfg in npcs.items():
        sheet = remap_npc(base, cfg)
        out_path = os.path.join(out_dir, f'{npc_id}.png')
        sheet.save(out_path)
        print(f'✅ Generated 16x32 NPC sheet: {out_path} ({sheet.size})')

if __name__ == '__main__':
    main()
