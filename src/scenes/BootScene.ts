import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    // 1. World & Terrain
    this.load.atlas('world_atlas', '/assets/world/world_atlas.png', '/assets/world/world_atlas.json');
    this.load.image('ground_a2', '/assets/world/ground_a2.png');
    this.load.image('ground_med_a2', '/assets/world/ground_med_a2.png');
    this.load.image('cliffs_nature', '/assets/world/cliffs_nature.png');
    this.load.image('Overworld', '/assets/gfx/Overworld.png');

    // 2. Main 16x32 Character Spritesheet
    this.load.spritesheet('character', '/assets/gfx/character.png', {
      frameWidth: 16,
      frameHeight: 32,
    });

    // 3. Keep 48x64 Character Sheets (Idle down 4 frames, Walk down 6 frames)
    const keepChars = [
      'keep_squire',
      'keep_peasant_f',
      'keep_peasant_m',
      'keep_monk',
      'keep_noble',
      'keep_knight',
      'keep_queen',
      'keep_elder',
      'keep_blacksmith',
      'keep_farmer',
      'keep_guard',
    ];
    for (const kc of keepChars) {
      this.load.spritesheet(kc, `/assets/characters/${kc}.png`, {
        frameWidth: 48,
        frameHeight: 64,
      });
    }

    // 4. Fauna & Companion
    this.load.spritesheet('farm_dog_walk', '/assets/fauna/farm_dog_walk_strip.png', {
      frameWidth: 26,
      frameHeight: 21,
    });
    this.load.spritesheet('farm_dog_idle', '/assets/fauna/farm_dog_idle_strip.png', {
      frameWidth: 26,
      frameHeight: 21,
    });
    this.load.spritesheet('cow_brown', '/assets/fauna/cow_brown.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('calf_brown', '/assets/fauna/calf_brown.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('horse', '/assets/fauna/horse.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('sheep', '/assets/fauna/sheep.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('sheep_baby', '/assets/fauna/sheep_baby.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('pig', '/assets/fauna/pig.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('piglet', '/assets/fauna/piglet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('chicken_brown', '/assets/fauna/chicken_brown.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('chick_dark', '/assets/fauna/chick_dark.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('duck', '/assets/fauna/duck.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('critters', '/assets/fauna/critters.png', { frameWidth: 16, frameHeight: 16 });

    // 5. Props & Buildings
    const props = [
      'keep',
      'gatehouse',
      'chapel',
      'smithy',
      'watermill',
      'barn',
      'inn',
      'stable',
      'cottage_thatch',
      'cottage_stone',
      'well',
      'archery_target',
      'training_dummy',
      'rack_shields',
      'rack_swords',
      'bench',
      'bench_stone',
      'stall_blue',
      'stall_green',
      'stall_red',
      'cart_hay',
      'cart_goods',
      'hay_bale',
      'hay_pile',
      'anvil',
      'crop_wheat_4',
      'keep_fences',
      'keep_garden',
      'flowerbed_gold',
      'flowerbed_blue',
      'flowerbed_violet',
      'reeds',
      'reeds_2',
      'lilypad',
      'lilypad_flower',
      'woodpile',
      'chopping_block',
      'barrel_water',
      'bucket_water',
      'sign_smith',
      'sign_inn',
      'lantern_post',
      'crate_apples',
      'basket_bread',
      // Newly extracted & scaled medieval props from Assets packs
      'weapon_rack_new',
      'knight_armor_suit',
      'training_dummy_prop',
      'royal_throne_gold',
      'castle_chest_wood',
      'fortress_gatehouse',
      'fortress_battlement',
      'monastery_scriptorium_desk',
      'monastery_book_lectern',
      'monastery_altar_shrine',
      'monastery_herbal_planter',
      'tavern_serving_counter',
      'tavern_beer_casks',
      'tavern_dining_table',
      'village_stone_well_prop',
      'village_bread_bakeoven',
      'village_hay_wagon',
      'peasant_thatched_cottage',
      'farm_windmill_tower',
      'farm_hay_rick_pile',
      'farm_animal_enclosure',
      'farm_plow_shelter',
    ];
    for (const p of props) {
      this.load.image(p, `/assets/props/${p}.png`);
    }

    // 6. Relics & Glow Marker
    this.load.image('relic_marker_glow', '/assets/icons/relic_marker_glow.png');
    this.load.image('relic_pflugmesser', '/assets/relics/relic_pflugmesser.png');
    this.load.image('relic_silberdenar', '/assets/relics/relic_silberdenar.png');
    this.load.image('relic_lehnsurkunde', '/assets/relics/relic_lehnsurkunde.png');
    this.load.image('relic_ritterschild', '/assets/relics/relic_ritterschild.png');
    this.load.image('relic_codex', '/assets/relics/relic_codex.png');
  }

  create(): void {
    this.createAnimations();
    this.scene.start('WorldScene');
    this.scene.start('UIScene');
  }

  private createAnimations(): void {
    // 16x32 LPC Player Animations
    const lpc = (key: string, start: number) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers('character', { start, end: start + 3 }),
          frameRate: 8,
          repeat: -1,
        });
      }
    };
    lpc('walk-down', 0);
    lpc('walk-right', 17);
    lpc('walk-up', 34);
    lpc('walk-left', 51);

    // Dog Animations
    if (!this.anims.exists('dog-walk') && this.textures.exists('farm_dog_walk')) {
      this.anims.create({
        key: 'dog-walk',
        frames: this.anims.generateFrameNumbers('farm_dog_walk', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1,
      });
    }
    if (!this.anims.exists('dog-idle') && this.textures.exists('farm_dog_idle')) {
      this.anims.create({
        key: 'dog-idle',
        frames: this.anims.generateFrameNumbers('farm_dog_idle', { start: 0, end: 7 }),
        frameRate: 4,
        repeat: -1,
      });
    }

    // Keep Characters (48x64 sheets)
    const keepChars = [
      'keep_squire',
      'keep_peasant_f',
      'keep_peasant_m',
      'keep_monk',
      'keep_noble',
      'keep_knight',
      'keep_queen',
      'keep_elder',
      'keep_blacksmith',
      'keep_farmer',
      'keep_guard',
    ];
    for (const kc of keepChars) {
      if (this.textures.exists(kc)) {
        // Idle Down (Row 0, first 4 frames)
        if (!this.anims.exists(`${kc}-idle-down`)) {
          this.anims.create({
            key: `${kc}-idle-down`,
            frames: this.anims.generateFrameNumbers(kc, { start: 0, end: 3 }),
            frameRate: 4,
            repeat: -1,
          });
        }
        // Walk Down (Row 4, frames 24..29)
        if (!this.anims.exists(`${kc}-walk-down`)) {
          this.anims.create({
            key: `${kc}-walk-down`,
            frames: this.anims.generateFrameNumbers(kc, { start: 24, end: 29 }),
            frameRate: 8,
            repeat: -1,
          });
        }
      }
    }

    // =========================================================================
    // 16-Bit Living Fauna Animations (Stardew 32x32 / 16x16 Standard)
    // =========================================================================
    const anim4 = (key: string, tex: string, start: number, fps = 6) => {
      if (!this.anims.exists(key) && this.textures.exists(tex)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(tex, { start, end: start + 3 }),
          frameRate: fps,
          repeat: -1,
        });
      }
    };

    // Cattle (cow_brown, calf_brown)
    anim4('cow-walk-down', 'cow_brown', 0, 5);
    anim4('cow-walk-right', 'cow_brown', 4, 5);
    anim4('cow-walk-up', 'cow_brown', 8, 5);
    anim4('cow-graze', 'cow_brown', 12, 3);
    if (!this.anims.exists('cow-idle') && this.textures.exists('cow_brown')) {
      this.anims.create({ key: 'cow-idle', frames: [{ key: 'cow_brown', frame: 4 }], frameRate: 1 });
    }

    anim4('calf-walk-down', 'calf_brown', 0, 6);
    anim4('calf-walk-right', 'calf_brown', 4, 6);
    anim4('calf-walk-up', 'calf_brown', 8, 6);
    anim4('calf-graze', 'calf_brown', 12, 4);
    if (!this.anims.exists('calf-idle') && this.textures.exists('calf_brown')) {
      this.anims.create({ key: 'calf-idle', frames: [{ key: 'calf_brown', frame: 4 }], frameRate: 1 });
    }

    // Sheep & Lamb (sheep, sheep_baby)
    anim4('sheep-walk-down', 'sheep', 0, 5);
    anim4('sheep-walk-right', 'sheep', 4, 5);
    anim4('sheep-walk-up', 'sheep', 8, 5);
    anim4('sheep-graze', 'sheep', 12, 3);
    if (!this.anims.exists('sheep-idle') && this.textures.exists('sheep')) {
      this.anims.create({ key: 'sheep-idle', frames: [{ key: 'sheep', frame: 4 }], frameRate: 1 });
    }

    anim4('sheep-baby-walk-down', 'sheep_baby', 0, 6);
    anim4('sheep-baby-walk-right', 'sheep_baby', 4, 6);
    anim4('sheep-baby-walk-up', 'sheep_baby', 8, 6);
    anim4('sheep-baby-graze', 'sheep_baby', 12, 4);
    if (!this.anims.exists('sheep-baby-idle') && this.textures.exists('sheep_baby')) {
      this.anims.create({ key: 'sheep-baby-idle', frames: [{ key: 'sheep_baby', frame: 4 }], frameRate: 1 });
    }

    // Pig & Piglet (pig, piglet)
    anim4('pig-walk-down', 'pig', 0, 5);
    anim4('pig-walk-right', 'pig', 4, 5);
    anim4('pig-walk-up', 'pig', 8, 5);
    anim4('pig-forage', 'pig', 12, 4);
    if (!this.anims.exists('pig-idle') && this.textures.exists('pig')) {
      this.anims.create({ key: 'pig-idle', frames: [{ key: 'pig', frame: 4 }], frameRate: 1 });
    }

    anim4('piglet-walk-down', 'piglet', 0, 6);
    anim4('piglet-walk-right', 'piglet', 4, 6);
    anim4('piglet-walk-up', 'piglet', 8, 6);
    anim4('piglet-forage', 'piglet', 12, 5);
    if (!this.anims.exists('piglet-idle') && this.textures.exists('piglet')) {
      this.anims.create({ key: 'piglet-idle', frames: [{ key: 'piglet', frame: 4 }], frameRate: 1 });
    }

    // Horse
    if (!this.anims.exists('horse-idle') && this.textures.exists('horse')) {
      this.anims.create({
        key: 'horse-idle',
        frames: this.anims.generateFrameNumbers('horse', { start: 0, end: 3 }),
        frameRate: 3,
        repeat: -1,
      });
      this.anims.create({
        key: 'horse-walk',
        frames: this.anims.generateFrameNumbers('horse', { start: 14, end: 17 }),
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: 'horse-graze',
        frames: this.anims.generateFrameNumbers('horse', { start: 0, end: 2 }),
        frameRate: 2,
        repeat: -1,
      });
    }

    // Poultry (chicken_brown, chick_dark)
    anim4('chicken-walk-right', 'chicken_brown', 4, 6);
    anim4('chicken-peck', 'chicken_brown', 12, 4);
    if (!this.anims.exists('chicken-idle') && this.textures.exists('chicken_brown')) {
      this.anims.create({ key: 'chicken-idle', frames: [{ key: 'chicken_brown', frame: 4 }], frameRate: 1 });
    }

    anim4('chick-walk-right', 'chick_dark', 4, 7);
    anim4('chick-peck', 'chick_dark', 12, 5);
    if (!this.anims.exists('chick-idle') && this.textures.exists('chick_dark')) {
      this.anims.create({ key: 'chick-idle', frames: [{ key: 'chick_dark', frame: 4 }], frameRate: 1 });
    }

    // Duck
    if (!this.anims.exists('duck-swim') && this.textures.exists('duck')) {
      this.anims.create({
        key: 'duck-swim',
        frames: this.anims.generateFrameNumbers('duck', { start: 12, end: 15 }),
        frameRate: 4,
        repeat: -1,
      });
      this.anims.create({
        key: 'duck-idle',
        frames: [{ key: 'duck', frame: 12 }],
        frameRate: 1,
      });
    }

    // Critters: River Frogs (Frames 280..283 idle/croak, 284..286 jump)
    if (!this.anims.exists('frog-croak') && this.textures.exists('critters')) {
      this.anims.create({
        key: 'frog-croak',
        frames: this.anims.generateFrameNumbers('critters', { start: 280, end: 283 }),
        frameRate: 4,
        repeat: -1,
      });
      this.anims.create({
        key: 'frog-jump',
        frames: this.anims.generateFrameNumbers('critters', { start: 284, end: 286 }),
        frameRate: 6,
        repeat: 0,
      });
    }
  }
}
