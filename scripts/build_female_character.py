import os
from PIL import Image

def generate_female_sheet():
    src_path = 'public/assets/gfx/character.png'
    im = Image.open(src_path).convert('RGBA')
    w, h = im.size
    pixels = im.load()

    # Remap tunic from red to noble cobalt blue dress
    # Remap hair accessory / ribbon
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a < 100:
                continue

            # Protect face: y in frame % 32 between 10 and 18
            fy = y % 32
            fx = x % 16
            is_face = (10 <= fy <= 18) and (r > 160 and g > 110 and b > 80 and r >= g and g >= b)
            is_eye_or_mouth = (10 <= fy <= 18) and (r < 60 and g < 60 and b < 60)
            if is_face or is_eye_or_mouth:
                continue

            # Tunic/Dress: red tones -> cobalt blue dress
            if (fy >= 14 and fy <= 25) and (r > 120 and r > g * 1.35 and r > b * 1.35):
                lum = (r * 0.299 + g * 0.587 + b * 0.114) / 160.0
                pixels[x, y] = (
                    min(255, int(37 * lum)),
                    min(255, int(99 * lum + 15)),
                    min(255, int(235 * lum)),
                    a
                )

            # Hair Ribbon at fy = 8..9
            if (fy == 8 or fy == 9) and (5 <= fx <= 10) and (r > 50 and g > 30 and b > 20):
                pixels[x, y] = (245, 158, 11, a) # Gold headband

    # Add braided hair hanging on sides for row 0 (down) and row 2 (up)
    for row in range(h // 32):
        for col in range(w // 16):
            if col < 4:
                base_x = col * 16
                base_y = row * 32
                # Braids on left & right of head
                if row == 0 or row == 2:
                    for by in range(14, 21):
                        pixels[base_x + 2, base_y + by] = (100, 65, 40, 255)
                        pixels[base_x + 13, base_y + by] = (100, 65, 40, 255)
                    # Gold hair tie beads at bottom of braid
                    pixels[base_x + 2, base_y + 20] = (245, 158, 11, 255)
                    pixels[base_x + 13, base_y + 20] = (245, 158, 11, 255)

    out_path = 'public/assets/gfx/character_female.png'
    im.save(out_path)
    print(f'✅ Generated {out_path} ({im.size})')

if __name__ == '__main__':
    generate_female_sheet()
