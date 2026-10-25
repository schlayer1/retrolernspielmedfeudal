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
  }
}
