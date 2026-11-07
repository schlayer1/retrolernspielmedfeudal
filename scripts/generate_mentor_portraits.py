import os
from PIL import Image, ImageDraw

def create_base_portrait(bg_color=(22, 19, 31)):
    # 64x64 canvas
    im = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    # Background
    d.rectangle([2, 2, 61, 61], fill=bg_color)

    # Ornate Gold Frame
    # Outer gold border
    d.rectangle([0, 0, 63, 63], outline=(120, 53, 15, 255), width=1)
    d.rectangle([1, 1, 62, 62], outline=(217, 119, 6, 255), width=1)
    d.rectangle([2, 2, 61, 61], outline=(251, 191, 36, 255), width=1)
    d.rectangle([3, 3, 60, 60], outline=(146, 64, 14, 255), width=1)
    # Corner highlights
    im.putpixel((1, 1), (254, 240, 138, 255))
    im.putpixel((62, 1), (254, 240, 138, 255))
    im.putpixel((1, 62), (254, 240, 138, 255))
    im.putpixel((62, 62), (254, 240, 138, 255))

    return im

def draw_head_and_face(d, skin=(240, 200, 160), shadow=(210, 165, 125), happy=False, beard=None, eye_color=(35, 25, 20)):
    # Neck: x 27..36, y 36..46
    d.rectangle([27, 36, 36, 45], fill=shadow)
    d.rectangle([28, 36, 35, 45], fill=skin)

    # Head base: x 22..41, y 18..37
    d.rectangle([22, 18, 41, 37], fill=skin)
    # Jaw shadow on right side
    d.rectangle([38, 20, 41, 37], fill=shadow)
    d.rectangle([24, 35, 39, 37], fill=shadow)

    # Eyes: left x 26..28, right x 35..37, y 25..26
    # White of eye
    d.rectangle([25, 25, 28, 26], fill=(245, 245, 250))
    d.rectangle([34, 25, 37, 26], fill=(245, 245, 250))
    # Pupils
    if happy:
        # Cheerful crinkled eyes
        d.line([(25, 25), (28, 24)], fill=eye_color, width=1)
        d.line([(34, 24), (37, 25)], fill=eye_color, width=1)
    else:
        d.rectangle([26, 25, 27, 26], fill=eye_color)
        d.rectangle([35, 25, 36, 26], fill=eye_color)
        # Highlight dot
        d.point((26, 25), fill=(255, 255, 255))
        d.point((35, 25), fill=(255, 255, 255))

    # Eyebrows: y 22..23
    d.line([(24, 22), (29, 22)], fill=(60, 40, 25), width=1)
    d.line([(33, 22), (38, 22)], fill=(60, 40, 25), width=1)

    # Nose: y 27..30, x 31..32
    d.line([(31, 27), (31, 30)], fill=shadow, width=1)
    d.point((32, 30), fill=shadow)

    # Mouth: y 33, x 29..34
    if happy:
        # Smile curve
        d.line([(28, 33), (30, 34)], fill=(160, 60, 50), width=1)
        d.line([(30, 34), (33, 34)], fill=(160, 60, 50), width=1)
        d.line([(33, 34), (35, 33)], fill=(160, 60, 50), width=1)
        # Cheek rosy blushes
        d.rectangle([23, 28, 25, 29], fill=(245, 175, 155))
        d.rectangle([37, 28, 39, 29], fill=(245, 175, 155))
    else:
        d.line([(29, 33), (34, 33)], fill=(160, 70, 60), width=1)

    # Beard if any
    if beard:
        b_col, b_dark = beard
        d.rectangle([25, 34, 38, 39], fill=b_col)
        d.rectangle([28, 39, 35, 42], fill=b_col)
        d.rectangle([26, 32, 28, 34], fill=b_col)
        d.rectangle([35, 32, 37, 34], fill=b_col)
        d.line([(26, 35), (37, 35)], fill=b_dark, width=1)


def generate_all_portraits():
    out_dir = 'public/assets/portraits'
    os.makedirs(out_dir, exist_ok=True)

    configs = {
        'meier': {
            'hair': (75, 50, 30),
            'tunic': (45, 100, 45),       # Sage green
            'tunic_shadow': (30, 70, 30),
            'hat': (90, 60, 35),         # Hofmeier felt cap
            'hat_shadow': (65, 40, 20),
            'trim': (217, 119, 6),
            'beard': None,
        },
        'walther': {
            'hair': (155, 150, 140),     # Elder gray/straw
            'tunic': (160, 125, 80),     # Rough peasant linen
            'tunic_shadow': (120, 90, 55),
            'hat': None,
            'trim': (110, 80, 45),
            'beard': ((150, 145, 135), (120, 115, 105)),
        },
        'anselm': {
            'hair': (75, 50, 35),
            'tunic': (60, 38, 22),       # Benedictine monk brown cowl
            'tunic_shadow': (42, 25, 14),
            'hat': None,
            'tonsure': True,
            'trim': (235, 235, 220),     # White wool cincture cord
            'beard': None,
        },
        'wolfram': {
            'hair': (65, 45, 30),
            'tunic': (185, 28, 28),      # Scarlet red surcoat
            'tunic_shadow': (130, 18, 18),
            'armor': True,
            'trim': (245, 245, 250),     # White cross
            'beard': ((70, 50, 35), (50, 35, 25)),
        },
        'eberhard': {
            'hair': (180, 180, 190),     # Noble silver
            'tunic': (136, 19, 55),      # Crimson royal velvet
            'tunic_shadow': (95, 12, 38),
            'crown': True,               # Golden count circlet with rubies
            'ermine': True,              # Ermine white fur mantle
            'trim': (251, 191, 36),
            'beard': ((175, 175, 185), (140, 140, 150)),
        },
        'hartmut': {
            'hair': (110, 75, 45),
            'tunic': (37, 99, 235),      # Heraldic blue & gold
            'tunic_shadow': (29, 78, 216),
            'heraldic_gold': (234, 179, 8),
            'trim': (250, 204, 21),
            'beard': None,
        },
        'jakob': {
            'hair': (85, 55, 35),
            'tunic': (30, 58, 138),      # Patrician indigo
            'tunic_shadow': (20, 40, 95),
            'fur_collar': (120, 80, 50),
            'gold_chain': True,
            'trim': (234, 179, 8),
            'beard': ((90, 60, 40), (65, 40, 25)),
        },
        'arnold': {
            'hair': (120, 115, 110),     # Master mason grizzled hair
            'tunic': (51, 65, 85),       # Slate gray vest
            'tunic_shadow': (35, 45, 60),
            'apron': (120, 53, 15),      # Heavy split leather apron
            'trim': (180, 83, 9),
            'beard': ((115, 110, 105), (85, 80, 75)),
        },
    }

    for p_id, cfg in configs.items():
        for mood in ['neutral', 'happy']:
            is_happy = (mood == 'happy')
            im = create_base_portrait()
            d = ImageDraw.Draw(im)

            # 1. Shoulders & Tunic (y 42..60, x 8..55)
            # Base shoulders
            d.polygon([(8, 60), (14, 46), (26, 42), (37, 42), (49, 46), (55, 60)], fill=cfg['tunic_shadow'])
            d.polygon([(10, 60), (16, 47), (27, 43), (36, 43), (47, 47), (53, 60)], fill=cfg['tunic'])

            # Heraldic two-tone for Hartmut
            if cfg.get('heraldic_gold'):
                d.polygon([(32, 60), (32, 43), (47, 47), (53, 60)], fill=cfg['heraldic_gold'])

            # Armor for Wolfram (Steel pauldrons & chainmail gorget)
            if cfg.get('armor'):
                d.rectangle([10, 46, 20, 58], fill=(160, 170, 185))
                d.rectangle([43, 46, 53, 58], fill=(130, 140, 155))
                d.rectangle([25, 42, 38, 48], fill=(148, 163, 184))

            # Ermine fur collar for Eberhard
            if cfg.get('ermine'):
                d.rectangle([18, 42, 45, 47], fill=(245, 245, 248))
                # Ermine black tails
                d.point((22, 45), fill=(20, 20, 20))
                d.point((32, 45), fill=(20, 20, 20))
                d.point((41, 45), fill=(20, 20, 20))

            # Fur collar for Jakob
            if cfg.get('fur_collar'):
                d.rectangle([18, 43, 45, 48], fill=cfg['fur_collar'])
                d.rectangle([20, 44, 43, 47], fill=(150, 105, 70))

            # Mason apron for Arnold
            if cfg.get('apron'):
                d.polygon([(24, 44), (39, 44), (41, 60), (22, 60)], fill=cfg['apron'])

            # Gold chain for Jakob
            if cfg.get('gold_chain'):
                d.line([(24, 48), (32, 54)], fill=(250, 204, 21), width=1)
                d.line([(32, 54), (39, 48)], fill=(250, 204, 21), width=1)
                d.point((32, 55), fill=(217, 119, 6))

            # White chivalric cross for Wolfram
            if cfg.get('armor'):
                d.line([(31, 50), (31, 58)], fill=(255, 255, 255), width=2)
                d.line([(27, 53), (35, 53)], fill=(255, 255, 255), width=2)

            # 2. Hair back base
            h_col = cfg['hair']
            d.rectangle([18, 14, 45, 34], fill=h_col)

            # 3. Head & Face
            draw_head_and_face(d, happy=is_happy, beard=cfg.get('beard'))

            # 4. Front Hair & Headwear
            if cfg.get('tonsure'):
                # Bald top on monk
                d.rectangle([26, 12, 37, 19], fill=(235, 195, 155))
                # Ring of dark hair
                d.rectangle([21, 19, 42, 23], fill=h_col)
                d.rectangle([19, 21, 23, 33], fill=h_col)
                d.rectangle([40, 21, 44, 33], fill=h_col)
            elif cfg.get('hat'):
                # Hofmeier cap (x 19..44, y 8..18)
                d.polygon([(18, 17), (22, 9), (41, 9), (45, 17)], fill=cfg['hat'])
                d.line([(18, 17), (45, 17)], fill=cfg['hat_shadow'], width=2)
                # Golden quill/badge
                d.point((23, 11), fill=(251, 191, 36))
                d.point((24, 10), fill=(251, 191, 36))
            elif cfg.get('crown'):
                # Noble count hair
                d.rectangle([20, 13, 43, 19], fill=h_col)
                # Golden circlet (y 14..17, x 21..42)
                d.line([(21, 16), (42, 16)], fill=(251, 191, 36), width=2)
                d.polygon([(23, 14), (25, 12), (27, 14)], fill=(251, 191, 36))
                d.polygon([(30, 14), (32, 11), (34, 14)], fill=(251, 191, 36))
                d.polygon([(37, 14), (39, 12), (41, 14)], fill=(251, 191, 36))
                # Ruby in center
                d.point((32, 14), fill=(220, 38, 38))
            elif cfg.get('armor'):
                # Steel armet/helmet visor band across forehead
                d.rectangle([21, 12, 42, 18], fill=(160, 170, 185))
                d.line([(21, 18), (42, 18)], fill=(120, 130, 145), width=1)
                d.point((31, 15), fill=(245, 245, 250))
            else:
                # Regular medieval pageboy / hair bangs
                d.rectangle([21, 13, 42, 18], fill=h_col)
                d.rectangle([19, 18, 23, 30], fill=h_col)
                d.rectangle([40, 18, 44, 30], fill=h_col)

            out_file = os.path.join(out_dir, f'{p_id}_{mood}.png')
            im.save(out_file)
            print(f'✅ Portrait created: {out_file}')

if __name__ == '__main__':
    generate_all_portraits()
