from PIL import Image
import os

scratch_dir = '/Users/nicolekeller/.gemini/antigravity/brain/3e867ed1-0e73-4c5f-836e-a8fe985da8c4/scratch'
props_out = 'public/assets/props'
os.makedirs(props_out, exist_ok=True)

# Each tile in source is 48x48.
# When downscaled by 3 (NEAREST), each tile becomes 16x16.
def crop_and_downscale(source_sheet, tx, ty, tw, th, out_filename):
    im = Image.open(source_sheet).convert('RGBA')
    box = (tx * 48, ty * 48, (tx + tw) * 48, (ty + th) * 48)
    cropped = im.crop(box)
    scaled = cropped.resize((tw * 16, th * 16), Image.Resampling.NEAREST)
    target_path = os.path.join(props_out, out_filename)
    scaled.save(target_path)
    print(f"Extracted {out_filename}: {tw*16}x{th*16} px")

def sheet(pack, name):
    return os.path.join(scratch_dir, pack, name)

# Extract key props using verified grid coordinates (tx, ty, tw, th in 48x48 tiles)
props = [
    # Burg / Ritter
    (sheet('medieval_knight-1', 'tile-B-05.png'), 12, 12, 2, 2, 'weapon_rack_new.png'),
    (sheet('medieval_knight-1', 'tile-B-04.png'), 7, 0, 1, 2, 'knight_armor_suit.png'),
    (sheet('medieval_knight-1', 'tile-B-05.png'), 8, 10, 2, 2, 'training_dummy_prop.png'),
    (sheet('medieval_knight-1', 'tile-B-04.png'), 5, 0, 1, 2, 'royal_throne_gold.png'),
    (sheet('medieval_monastery', 'tile-B-03.png'), 0, 12, 2, 2, 'castle_chest_wood.png'),
    (sheet('medieval_fortress_tileset', 'tile-B-01.png'), 0, 0, 3, 4, 'fortress_gatehouse.png'),
    (sheet('medieval_fortress_tileset', 'tile-B-01.png'), 3, 0, 3, 3, 'fortress_battlement.png'),

    # Kloster
    (sheet('medieval_monastery', 'tile-B-03.png'), 0, 0, 2, 2, 'monastery_scriptorium_desk.png'),
    (sheet('medieval_monastery', 'tile-B-03.png'), 12, 14, 2, 2, 'monastery_book_lectern.png'),
    (sheet('medieval_monastery', 'tile-B-01.png'), 6, 4, 2, 2, 'monastery_altar_shrine.png'),
    (sheet('medieval_monastery', 'tile-B-04.png'), 0, 0, 2, 2, 'monastery_herbal_planter.png'),

    # Taverne
    (sheet('medieval_monastery', 'tile-B-05.png'), 4, 0, 4, 2, 'tavern_serving_counter.png'),
    (sheet('medieval_monastery', 'tile-B-05.png'), 8, 2, 2, 2, 'tavern_beer_casks.png'),
    (sheet('medieval_monastery', 'tile-B-05.png'), 0, 0, 4, 2, 'tavern_dining_table.png'),

    # Dorf & Fronhof
    (sheet('medieval_farm', 'tile-B-02.png'), 12, 6, 2, 3, 'village_stone_well_prop.png'),
    (sheet('medieval_monastery', 'tile-B-05.png'), 12, 0, 2, 2, 'village_bread_bakeoven.png'),
    (sheet('medieval_farm', 'tile-B-02.png'), 8, 2, 2, 1, 'village_hay_wagon.png'),
    (sheet('medieval_village-2', 'tile-B-04.png'), 0, 0, 2, 3, 'peasant_thatched_cottage.png'),

    # Farm & Dreifelderwirtschaft
    (sheet('medieval_farm', 'tile-B-05.png'), 8, 4, 2, 4, 'farm_windmill_tower.png'),
    (sheet('medieval_farm', 'tile-B-04.png'), 2, 10, 2, 2, 'farm_hay_rick_pile.png'),
    (sheet('medieval_farm', 'tile-B-05.png'), 0, 4, 2, 1, 'farm_animal_enclosure.png'),
    (sheet('medieval_farm', 'tile-B-05.png'), 4, 0, 2, 2, 'farm_plow_shelter.png'),
]

for src, tx, ty, tw, th, out_name in props:
    if os.path.exists(src):
        crop_and_downscale(src, tx, ty, tw, th, out_name)
    else:
        print(f"Skipping {out_name}: source {src} not found")

print("All atomic props extracted and downscaled to 16px standard!")
