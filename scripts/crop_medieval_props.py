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

# 1. Medieval Fortress / Knight
fortress_b1 = os.path.join(scratch_dir, 'medieval_fortress_tileset', 'tile-B-01.png')
knight_b1 = os.path.join(scratch_dir, 'medieval_knight-1', 'tile-B-01.png')
furniture_b1 = os.path.join(scratch_dir, 'medieval_furniture', 'tile-B-01.png')

# 2. Medieval Monastery
monastery_b1 = os.path.join(scratch_dir, 'medieval_monastery', 'tile-B-01.png')

# 3. Medieval Tavern
tavern_b1 = os.path.join(scratch_dir, 'medieval_tavern-1', 'tile-B-01.png')

# 4. Medieval Village & Farm
village_b1 = os.path.join(scratch_dir, 'medieval_village-2', 'tile-B-01.png')
farm_b1 = os.path.join(scratch_dir, 'medieval_farm', 'tile-B-01.png')

# Extract key props
props = [
    # Burg / Ritter
    (knight_b1, 0, 0, 2, 2, 'weapon_rack_new.png'),
    (knight_b1, 2, 0, 1, 2, 'knight_armor_suit.png'),
    (knight_b1, 3, 0, 1, 2, 'training_dummy_prop.png'),
    (furniture_b1, 0, 0, 2, 3, 'royal_throne_gold.png'),
    (furniture_b1, 2, 0, 2, 2, 'castle_chest_wood.png'),
    (fortress_b1, 0, 0, 3, 4, 'fortress_gatehouse.png'),
    (fortress_b1, 3, 0, 3, 3, 'fortress_battlement.png'),

    # Kloster
    (monastery_b1, 0, 0, 2, 2, 'monastery_scriptorium_desk.png'),
    (monastery_b1, 2, 0, 1, 2, 'monastery_book_lectern.png'),
    (monastery_b1, 3, 0, 3, 2, 'monastery_altar_shrine.png'),
    (monastery_b1, 0, 2, 2, 2, 'monastery_herbal_planter.png'),

    # Taverne
    (tavern_b1, 0, 0, 3, 2, 'tavern_serving_counter.png'),
    (tavern_b1, 3, 0, 2, 2, 'tavern_beer_casks.png'),
    (tavern_b1, 0, 2, 2, 2, 'tavern_dining_table.png'),

    # Dorf & Fronhof
    (village_b1, 0, 0, 2, 2, 'village_stone_well_prop.png'),
    (village_b1, 2, 0, 2, 2, 'village_bread_bakeoven.png'),
    (village_b1, 0, 2, 2, 2, 'village_hay_wagon.png'),
    (village_b1, 4, 0, 3, 3, 'peasant_thatched_cottage.png'),

    # Farm & Dreifelderwirtschaft
    (farm_b1, 0, 0, 3, 4, 'farm_windmill_tower.png'),
    (farm_b1, 3, 0, 2, 2, 'farm_hay_rick_pile.png'),
    (farm_b1, 0, 4, 2, 2, 'farm_animal_enclosure.png'),
    (farm_b1, 2, 4, 3, 2, 'farm_plow_shelter.png'),
]

for src, tx, ty, tw, th, out_name in props:
    if os.path.exists(src):
        crop_and_downscale(src, tx, ty, tw, th, out_name)
    else:
        print(f"Skipping {out_name}: source {src} not found")

print("All atomic props extracted and downscaled to 16px standard!")
