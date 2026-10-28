import Phaser from 'phaser';
import { sound } from '../audio/sound';
import { MEDIEVAL_CHAPTERS, ChapterData } from '../data/chapters';
import { MEDIEVAL_BUILDINGS, MEDIEVAL_ITEMS, MedievalItemId } from '../data/items';
import { MEDIEVAL_RELICS, MedievalRelic } from '../data/relics';
import { MEDIEVAL_DECOR, RESOURCE_NODES, DecorObject, ResourceNode } from '../data/decor';
import { gameState } from '../systems/GameState';
import { WildlifeManager } from '../world/Wildlife';
import { LivingWorldManager } from '../world/LivingWorldManager';
import { ChapterBanner } from '../ui/ChapterBanner';
import { CompanionManager } from '../world/Companion';

export interface InteractiveTarget {
  id: string;
  kind: 'mentor' | 'resource' | 'relic' | 'building_plot' | 'interactive_quest' | 'companion';
  name: string;
  sub: string;
  x: number;
  y: number;
  minChapter: number;
  itemId?: MedievalItemId;
  relic?: MedievalRelic;
  buildingId?: string;
  questChapter?: number;
  questObjectiveIndex?: number;
  questMessage?: string;
  actionTip?: string;
  discovered?: boolean;
  nodeDef?: ResourceNode;
}

export class WorldScene extends Phaser.Scene {
  public mapW = 100;
  public mapH = 80;
  public player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
  };
  private spaceKey?: Phaser.Input.Keyboard.Key;
  private enterKey?: Phaser.Input.Keyboard.Key;

  private mentorSprite: Phaser.GameObjects.Sprite | null = null;
  private targets: InteractiveTarget[] = [];
  private activeTarget: InteractiveTarget | null = null;
  private labelDiv: HTMLElement | null = null;

  private spawnedBuildings = new Set<string>();
  private buildingPlotSprites = new Map<string, Phaser.GameObjects.GameObject[]>();
  private relicVisuals = new Map<string, Phaser.GameObjects.GameObject[]>();
  private resourceState = new Map<string, { sprite: Phaser.GameObjects.Image; readyAt: number }>();

  public wildlifeManager!: WildlifeManager;
  public livingWorldManager!: LivingWorldManager;
  public chapterBanner!: ChapterBanner;
  public companionManager!: CompanionManager;

  private stepTimer = 0;
  private facing: 'down' | 'up' | 'left' | 'right' = 'down';
  private lastBannerChapter = -1;
  private isDialogZoomed = false;

  // Bridge bounds for footstep audio & river crossing
  private bridgeBounds = [
    { x: 48 * 16, y: 38 * 16, w: 8 * 16, h: 5 * 16 },
    { x: 48 * 16, y: 62 * 16, w: 8 * 16, h: 4 * 16 },
  ];

  constructor() {
    super('WorldScene');
  }

  create(): void {
    // 1. Bake Per-Pixel Multi-Biome Ground with 4x4 Bayer Dithering
    this.bakeMedievalTerrainTexture();

    this.add.image(0, 0, 'medieval_baked_ground').setOrigin(0, 0).setDepth(0);

    // 2. Initialize Subsystems
    this.wildlifeManager = new WildlifeManager(this);
    this.livingWorldManager = new LivingWorldManager(this);
    this.chapterBanner = new ChapterBanner();
    this.companionManager = new CompanionManager(this);

    // 3. Dense Ground Flora Scattering (150+ grass tufts, wildflowers, pebbles, mushrooms)
    this.scatterGroundFlora();

    // 4. Living River Shores & Water Infrastructure
    this.buildRiverShores();

    // 5. Border Trees & Streuobstwiese
    this.placeBorderTrees();

    // 6. Setup Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      };
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    // 7. Place Static Decor & Architecture
    this.placeWorldDecor();

    // 8. Place Resource Hotspots
    this.placeResourceNodes();

    // 9. Spawn Player
    this.player = this.add.sprite(gameState.playerX, gameState.playerY, 'character', 0);
    this.player.setOrigin(0.5, 0.9);
    this.player.setScale(1.0);
    this.player.setDepth(this.player.y);

    // 10. Setup Camera
    this.cameras.main.setBounds(0, 0, this.mapW * 16, this.mapH * 16);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2.2);

    // 11. Companion Unlock (Kapitel 1)
    this.companionManager.unlock(this.player.x - 20, this.player.y);

    // 12. Setup Interactive Targets & Mentors
    this.setupTargets();
    this.initInteractionLabel();

    // Expose interaction trigger globally for DOM label click & UI scene
    (window as any).__triggerInteraction = () => this.triggerInteraction();

    // 13. Init Wildlife & Living World
    this.wildlifeManager.init();
    this.livingWorldManager.initWaterEffects(50 * 16, 54 * 16, 4 * 16, 76 * 16);

    // 14. Fire & Smoke on Forges & Braziers
    this.livingWorldManager.registerFireSource(36 * 16, 52 * 16, true, 34, 0xffa533); // Schmiede
    this.livingWorldManager.registerFireSource(22 * 16, 16 * 16, true, 30, 0xff7722); // Burg-Kamin
    this.livingWorldManager.registerFireSource(24 * 16, 28 * 16, false, 24, 0xffaa44); // Burgtor-Fackel

    // 15. First Chapter Banner
    this.lastBannerChapter = gameState.chapter;
    const curCh = MEDIEVAL_CHAPTERS.find((c) => c.id === gameState.chapter);
    if (curCh) {
      this.chapterBanner.show({
        chapterNumber: curCh.number,
        title: curCh.title,
        subtitle: `${curCh.eraName} · ${curCh.sub}`,
      });
    }

    // 16. Single Proximity DOM Label
    this.initInteractionLabel();

    // Subscribe to state changes (building erections, chapter advances)
    gameState.subscribe(() => {
      this.onGameStateChanged();
    });

    // Start BGM
    sound.startBGM(gameState.chapter);
  }

  private bakeMedievalTerrainTexture(): void {
    const W = this.mapW * 16;
    const H = this.mapH * 16;
    const texKey = 'medieval_baked_ground';
    if (this.textures.exists(texKey)) return;

    // 1. Source Image Data from ground_a2 (RPG Maker MV 768x576)
    const srcImg = this.textures.get('ground_a2').getSourceImage() as HTMLImageElement;
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = srcImg.width;
    srcCanvas.height = srcImg.height;
    const sctx = srcCanvas.getContext('2d')!;
    sctx.drawImage(srcImg, 0, 0);
    const srcData = sctx.getImageData(0, 0, srcImg.width, srcImg.height).data;
    const sw = srcImg.width;

    // 2. Source Image Data from Overworld (Classic 16-Bit SNES Water tile at 48,48)
    const owImg = this.textures.get('Overworld').getSourceImage() as HTMLImageElement;
    const owCanvas = document.createElement('canvas');
    owCanvas.width = owImg.width;
    owCanvas.height = owImg.height;
    const owctx = owCanvas.getContext('2d')!;
    owctx.drawImage(owImg, 0, 0);
    const owData = owctx.getImageData(0, 0, owImg.width, owImg.height).data;
    const oww = owImg.width;

    // In RPG Maker MV A2 (768x576, 8x4 Blöcke à 96x144) liegt die 100% nahtlose
    // 48x48-Innenkachel jedes Blocks exakt bei (bx*96 + 24, by*144 + 72).
    const sampleBlock = (bx: number, by: number, x: number, y: number): [number, number, number] => {
      const u = ((x % 48) + 48) % 48;
      const v = ((y % 48) + 48) % 48;
      const sx = bx * 96 + 24 + u;
      const sy = by * 144 + 72 + v;
      const idx = (sy * sw + sx) * 4;
      return [srcData[idx], srcData[idx + 1], srcData[idx + 2]];
    };

    const sampleWater = (x: number, y: number): [number, number, number] => {
      const u = ((x % 16) + 16) % 16;
      const v = ((y % 16) + 16) % 16;
      const sx = 48 + u;
      const sy = 48 + v;
      const idx = (sy * oww + sx) * 4;
      return [owData[idx], owData[idx + 1], owData[idx + 2]];
    };

    // 4x4 Bayer-Dither-Matrix für authentische 16-Bit-Pixel-Übergänge
    const bayer4 = [
      [0 / 16, 8 / 16, 2 / 16, 10 / 16],
      [12 / 16, 4 / 16, 14 / 16, 6 / 16],
      [3 / 16, 11 / 16, 1 / 16, 9 / 16],
      [15 / 16, 7 / 16, 13 / 16, 5 / 16],
    ];

    const canvasTex = this.textures.createCanvas(texKey, W, H)!;
    const ctx = canvasTex.getContext();
    const imgData = ctx.createImageData(W, H);
    const dst = imgData.data;

    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const dither = bayer4[(y >> 1) & 3][(x >> 1) & 3] - 0.5;
        const tx = x / 16;
        const ty = y / 16;

        // River Burgbach (x: 50..54 with organic curve)
        const riverCenterX = 52 + Math.sin(ty * 0.12) * 2.5;
        const distRiver = Math.abs(tx - riverCenterX);

        // Wooden Bridges at y: 38.5..42.5 (Marktbrücke) and y: 62.5..65.5 (Mühlensteg)
        const isBridge =
          distRiver < 3.2 && ((ty >= 38.5 && ty <= 42.5) || (ty >= 62.5 && ty <= 65.5));

        // Roads
        const dCastleRoad = this.distToSegment(tx, ty, 28, 28, 50, 40);
        const dVillageRoad = this.distToSegment(tx, ty, 26, 58, 50, 40);
        const dKlosterRoad = this.distToSegment(tx, ty, 54, 40, 78, 22);
        const dFarmRoad = this.distToSegment(tx, ty, 54, 40, 70, 56);
        const dMillBridgeRoad = this.distToSegment(tx, ty, 44, 64, 66, 62);
        const minRoadDist = Math.min(dCastleRoad, dVillageRoad, dKlosterRoad, dFarmRoad, dMillBridgeRoad);

        // Castle Plateau (tx: 16..36, ty: 12..28)
        const inCastleCourt = tx >= 16 && tx <= 36 && ty >= 12 && ty <= 28;
        // Monastery cloister (tx: 74..86, ty: 14..24)
        const inMonasteryCourt = tx >= 74 && tx <= 86 && ty >= 14 && ty <= 24;

        let bx = 1;
        let by = 1;
        let isWater = false;
        let isBridgePlank = false;

        if (isBridge) {
          isBridgePlank = true;
        } else if (distRiver < 2.0) {
          isWater = true;
        } else if (distRiver < 3.4 + dither * 0.8) {
          // Warm sand / clay river shore
          bx = 2;
          by = 1;
        } else if (inCastleCourt || inMonasteryCourt) {
          // Grey flagstone / cobblestone paving
          bx = 1;
          by = 2;
        } else if (minRoadDist < 1.6 + dither * 0.5) {
          // Trodden dirt road
          bx = 1;
          by = 0;
        } else {
          // Multi-biome meadow / deep forest grass with organic Bayer waves
          const wave = Math.sin(x * 0.022 + y * 0.018) * 0.5 + Math.cos(x * 0.015 - y * 0.025) * 0.5;
          const borderBoost =
            (x < 140 ? (140 - x) / 80 : 0) +
            (y < 120 ? (120 - y) / 70 : 0) +
            (x > W - 140 ? (x - (W - 140)) / 80 : 0) +
            (y > H - 120 ? (y - (H - 120)) / 70 : 0);

          if (wave + borderBoost + dither * 0.55 > 0.38) {
            bx = 0; // Deep forest moss grass
            by = 1;
          } else {
            bx = 1; // Summer meadow lush grass
            by = 1;
          }
        }

        for (let py = y; py < y + 2 && py < H; py++) {
          for (let px = x; px < x + 2 && px < W; px++) {
            let r: number, g: number, b: number;
            if (isBridgePlank) {
              const plankPattern = (px + (py % 4 === 0 ? 1 : 0)) % 6 === 0 ? 112 : 144;
              r = plankPattern;
              g = Math.round(plankPattern * 0.72);
              b = Math.round(plankPattern * 0.44);
            } else if (isWater) {
              const [wr, wg, wb] = sampleWater(px, py);
              const depthFactor = 1.0 - (distRiver / 2.0) * 0.2;
              r = Math.round(wr * depthFactor);
              g = Math.round(wg * depthFactor);
              b = Math.round(wb * depthFactor);
            } else {
              [r, g, b] = sampleBlock(bx, by, px, py);
            }

            const oi = (py * W + px) * 4;
            dst[oi] = r;
            dst[oi + 1] = g;
            dst[oi + 2] = b;
            dst[oi + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    canvasTex.refresh();
  }

  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  private isPointInBuilding(x: number, y: number): boolean {
    const tx = x / 16;
    const ty = y / 16;
    if (tx >= 14 && tx <= 26 && ty >= 10 && ty <= 22) return true;
    if (tx >= 24 && tx <= 32 && ty >= 26 && ty <= 33) return true;
    if (tx >= 34 && tx <= 40 && ty >= 15 && ty <= 21) return true;
    if (tx >= 72 && tx <= 92 && ty >= 10 && ty <= 26) return true;
    if (tx >= 14 && tx <= 38 && ty >= 48 && ty <= 74) return true;
    if (tx >= 62 && tx <= 72 && ty >= 46 && ty <= 54) return true;
    if (tx >= 41 && tx <= 47 && ty >= 61 && ty <= 67) return true;
    if (tx >= 44 && tx <= 56 && ty >= 42 && ty <= 46) return true;
    return false;
  }

  private isPointInRiver(x: number, y: number): boolean {
    const tx = x / 16;
    const ty = y / 16;
    const riverCenterX = 52 + Math.sin(ty * 0.12) * 2.5;
    return Math.abs(tx - riverCenterX) < 1.95;
  }

  private isOnBridge(x: number, y: number): boolean {
    const ty = y / 16;
    return (ty >= 38.2 && ty <= 42.8) || (ty >= 62.2 && ty <= 65.8);
  }

  private isWalkable(x: number, y: number): boolean {
    if (x < 20 || x > (this.mapW - 2) * 16 || y < 20 || y > (this.mapH - 2) * 16) return false;
    // Block river water unless on one of the two wooden bridges
    if (this.isPointInRiver(x, y) && !this.isOnBridge(x, y)) {
      return false;
    }
    const tx = x / 16;
    const ty = y / 16;
    // Solid building roof/wall footprints (leaving front doors & mentors accessible)
    if (tx >= 17.5 && tx <= 22.5 && ty >= 11.5 && ty <= 15.2) return false; // Bergfried
    if (tx >= 35.0 && tx <= 39.0 && ty >= 15.0 && ty <= 17.3) return false; // Marstall
    if (tx >= 75.5 && tx <= 80.5 && ty >= 11.5 && ty <= 15.2) return false; // Klosterkirche
    if (tx >= 86.2 && tx <= 89.8 && ty >= 17.0 && ty <= 19.3) return false; // Skriptorium
    if (tx >= 16.2 && tx <= 19.8 && ty >= 49.0 && ty <= 51.3) return false; // Fronhof-Meierhaus
    if (tx >= 30.2 && tx <= 33.8 && ty >= 49.0 && ty <= 51.3) return false; // Dorfschmiede
    if (tx >= 20.0 && tx <= 24.0 && ty >= 64.5 && ty <= 67.2) return false; // Dorfgasthof
    if (tx >= 30.2 && tx <= 33.8 && ty >= 65.0 && ty <= 67.3) return false; // Bauernkate
    if (tx >= 42.2 && tx <= 45.8 && ty >= 60.5 && ty <= 63.1) return false; // Wassermühle
    if (tx >= 64.0 && tx <= 68.0 && ty >= 46.5 && ty <= 49.2) return false; // Zehntscheune
    if (tx >= 86.8 && tx <= 89.2 && ty >= 44.5 && ty <= 47.2) return false; // Windmühle
    return true;
  }

  private isOnRoad(x: number, y: number): boolean {
    const tx = x / 16;
    const ty = y / 16;
    const dCastleRoad = this.distToSegment(tx, ty, 28, 28, 50, 40);
    const dVillageRoad = this.distToSegment(tx, ty, 26, 58, 50, 40);
    const dKlosterRoad = this.distToSegment(tx, ty, 54, 40, 78, 22);
    const dFarmRoad = this.distToSegment(tx, ty, 54, 40, 70, 56);
    return Math.min(dCastleRoad, dVillageRoad, dKlosterRoad, dFarmRoad) < 1.4;
  }

  private buildRiverShores(): void {
    const curatedShoreRocks: Array<[string, number, number, number]> = [
      ['rock_moss_a', 52 * 16 - 36, 120, 0.75],
      ['rock_small_a', 52 * 16 + 34, 150, 0.8],
      ['rock_moss_b', 52 * 16 - 32, 230, 0.7],
      ['rock_small_b', 52 * 16 + 32, 280, 0.85],
      ['rock_moss_f', 52 * 16 - 34, 370, 0.7],
      ['rock_small_c', 52 * 16 + 36, 440, 0.8],
      ['rock_moss_g', 52 * 16 - 30, 520, 0.75],
      ['rock_moss_a', 52 * 16 - 34, 730, 0.75],
      ['rock_small_d', 52 * 16 + 34, 780, 0.85],
      ['rock_moss_c', 52 * 16 - 32, 860, 0.7],
      ['rock_small_a', 52 * 16 + 36, 940, 0.8],
      ['rock_moss_f', 52 * 16 - 36, 1030, 0.75],
      ['rock_small_b', 52 * 16 + 34, 1110, 0.8],
      ['rock_moss_b', 52 * 16 - 30, 1180, 0.75],
    ];

    curatedShoreRocks.forEach(([fr, rx, ry, sc]) => {
      if (this.textures.get('world_atlas')?.has(fr)) {
        this.add.image(rx, ry, 'world_atlas', fr).setScale(sc).setDepth(ry);
      }
    });

    const shoreReeds: Array<[string, number, number]> = [
      ['reeds', 52 * 16 - 28, 90],
      ['reeds_2', 52 * 16 + 26, 130],
      ['reeds', 52 * 16 - 26, 190],
      ['reeds_2', 52 * 16 + 28, 250],
      ['reeds', 52 * 16 - 28, 330],
      ['reeds_2', 52 * 16 + 26, 410],
      ['reeds', 52 * 16 - 26, 490],
      ['reeds_2', 52 * 16 + 28, 550],
      ['reeds', 52 * 16 - 28, 710],
      ['reeds_2', 52 * 16 + 26, 760],
      ['reeds', 52 * 16 - 26, 830],
      ['reeds_2', 52 * 16 + 28, 900],
      ['reeds', 52 * 16 - 28, 980],
      ['reeds_2', 52 * 16 + 26, 1060],
      ['reeds', 52 * 16 - 26, 1150],
      ['reeds_2', 52 * 16 + 28, 1210],
    ];

    shoreReeds.forEach(([key, rx, ry]) => {
      let spr: Phaser.GameObjects.Image | null = null;
      if (this.textures.exists(key)) {
        spr = this.add.image(rx, ry, key);
      } else if (this.textures.get('world_atlas')?.has('fern_1')) {
        spr = this.add.image(rx, ry, 'world_atlas', 'fern_1');
      }
      if (spr) {
        spr.setOrigin(0.5, 0.9).setScale(0.9).setDepth(ry);
      }
    });

    const lilypads: Array<[string, number, number]> = [
      ['lilypad', 52 * 16 - 10, 160],
      ['lilypad_flower', 52 * 16 + 8, 210],
      ['lilypad', 52 * 16 - 6, 360],
      ['lilypad_flower', 52 * 16 + 10, 480],
      ['lilypad', 52 * 16 - 8, 740],
      ['lilypad_flower', 52 * 16 + 12, 880],
      ['lilypad', 52 * 16 - 10, 1080],
    ];

    lilypads.forEach(([key, lx, ly]) => {
      if (this.textures.exists(key)) {
        this.add.image(lx, ly, key).setOrigin(0.5, 0.5).setScale(0.95).setDepth(ly);
      }
    });
  }

  private scatterGroundFlora(): void {
    const W = this.mapW * 16;
    const H = this.mapH * 16;
    const rng = new Phaser.Math.RandomDataGenerator(['medieval-feudal-flora-v2']);

    const meadowPool = [
      'grass_s1',
      'grass_s2',
      'grass_s3',
      'grass_s4',
      'grass_1',
      'grass_2',
      'flower_bunch_a',
      'flower_bunch_b',
      'flower_bunch_c',
      'flower_purple',
      'flower_white',
      'flower_pink',
      'flower_blue_a',
      'flower_tulip_y',
      'flower_sun',
      'fern_1',
      'fern_2',
    ];

    const roadPool = ['pebbles_a', 'pebbles_b', 'pebbles_c', 'rock_small_a'];
    const forestPool = ['mushroom_small', 'mushroom_b', 'mushroom_red', 'fern_1', 'fern_2', 'fern_3', 'grass_s1'];

    const atlas = this.textures.get('world_atlas');
    if (!atlas) return;

    for (let i = 0; i < 150; i++) {
      const x = rng.between(28, W - 28);
      const y = rng.between(32, H - 28);

      if (this.isPointInBuilding(x, y) || this.isPointInRiver(x, y)) continue;

      const onRoad = this.isOnRoad(x, y);
      const isShady = y < 140 || y > H - 140 || x < 140 || x > W - 140;

      const frame = onRoad
        ? rng.pick(roadPool)
        : isShady
        ? rng.pick(forestPool)
        : rng.pick(meadowPool);

      if (atlas.has(frame)) {
        const sc = onRoad ? 0.75 : rng.realInRange(0.75, 0.9);
        this.add.image(x, y, 'world_atlas', frame).setScale(sc).setDepth(1.2);
      }
    }
  }

  private placeBorderTrees(): void {
    const curatedTrees: Array<[string, number, number]> = [
      ['tree_pine_1', 14 * 16, 8 * 16],
      ['tree_pine_2', 22 * 16, 7 * 16],
      ['tree_oak_1', 32 * 16, 8 * 16],
      ['tree_oak_2', 10 * 16, 18 * 16],
      ['tree_oak_1', 68 * 16, 8 * 16],
      ['tree_oak_2', 76 * 16, 7 * 16],
      ['tree_oak_3', 88 * 16, 8 * 16],
      ['tree_fir_1', 94 * 16, 16 * 16],
      ['tree_apple', 42 * 16, 38 * 16],
      ['tree_apple', 46 * 16, 34 * 16],
      ['tree_willow', 47 * 16, 72 * 16],
      ['tree_willow', 58 * 16, 74 * 16],
      ['tree_oak_2', 64 * 16, 74 * 16],
      ['tree_oak_1', 78 * 16, 76 * 16],
      ['tree_pine_1', 92 * 16, 72 * 16],
    ];

    const atlas = this.textures.get('world_atlas');
    if (!atlas) return;

    for (const [key, x, y] of curatedTrees) {
      if (atlas.has(key)) {
        const spr = this.add.image(x, y, 'world_atlas', key);
        spr.setOrigin(0.5, 0.9);
        spr.setScale(0.9);
        spr.setDepth(y);
        this.livingWorldManager.registerFlora(spr);
      }
    }
  }

  private placeWorldDecor(): void {
    // 1. Static Decor from MEDIEVAL_DECOR
    for (const d of MEDIEVAL_DECOR) {
      let img: Phaser.GameObjects.Image | null = null;
      if (this.textures.exists(d.spriteKey)) {
        img = this.add.image(d.x, d.y, d.spriteKey);
      } else if (this.textures.get('world_atlas')?.has(d.spriteKey)) {
        img = this.add.image(d.x, d.y, 'world_atlas', d.spriteKey);
      }
      if (img) {
        img.setOrigin(d.originX ?? 0.5, d.originY ?? 0.9);
        if (d.scale) img.setScale(d.scale);
        img.setDepth(d.y);

        // Flora Wind Sway
        if (d.spriteKey.startsWith('tree_') || d.spriteKey.startsWith('bush_')) {
          this.livingWorldManager.registerFlora(img);
        }
      }
    }

    // 2. Dynamic Erected Buildings & Unbuilt Plot Markers
    this.syncBuiltBuildings(false);
  }

  private syncBuiltBuildings(animateNew = true): void {
    for (const bDef of MEDIEVAL_BUILDINGS) {
      const isBuilt = gameState.builtBuildings.has(bDef.id);

      if (isBuilt && !this.spawnedBuildings.has(bDef.id)) {
        this.spawnedBuildings.add(bDef.id);

        // Remove unbuilt plot marker if present
        const plotObjs = this.buildingPlotSprites.get(bDef.id);
        if (plotObjs) {
          plotObjs.forEach((o) => o.destroy());
          this.buildingPlotSprites.delete(bDef.id);
        }

        // Spawn main building sprite
        let bImg: Phaser.GameObjects.Image | null = null;
        if (this.textures.exists(bDef.spriteKey)) {
          bImg = this.add.image(bDef.x, bDef.y, bDef.spriteKey);
        } else if (this.textures.get('world_atlas')?.has(bDef.spriteKey)) {
          bImg = this.add.image(bDef.x, bDef.y, 'world_atlas', bDef.spriteKey);
        }

        const spawnedList: Phaser.GameObjects.Image[] = [];
        if (bImg) {
          bImg.setOrigin(0.5, 0.9);
          bImg.setScale(bDef.id === 'dorfgatter' ? 1.25 : bDef.scale);
          bImg.setDepth(bDef.y);
          spawnedList.push(bImg);
        }

        // Special composite enclosure for Viehgatter (dorfgatter) so a full cattle fence & trough appear
        if (bDef.id === 'dorfgatter') {
          if (this.textures.exists('fence_gate')) {
            const leftFence = this.add
              .image(bDef.x - 26, bDef.y, 'fence_gate')
              .setOrigin(0.5, 0.9)
              .setScale(1.1)
              .setDepth(bDef.y);
            const rightFence = this.add
              .image(bDef.x + 26, bDef.y, 'fence_gate')
              .setOrigin(0.5, 0.9)
              .setScale(1.1)
              .setDepth(bDef.y);
            spawnedList.push(leftFence, rightFence);
          }
          if (this.textures.exists('farm_animal_enclosure')) {
            const trough = this.add
              .image(bDef.x, bDef.y - 14, 'farm_animal_enclosure')
              .setOrigin(0.5, 0.9)
              .setScale(1.15)
              .setDepth(bDef.y - 2);
            spawnedList.push(trough);
          }
        }

        if (animateNew && spawnedList.length > 0) {
          spawnedList.forEach((s) => {
            const targetScale = s.scaleX;
            s.setScale(0.1);
            this.tweens.add({
              targets: s,
              scaleX: targetScale,
              scaleY: targetScale,
              duration: 420,
              ease: 'Back.easeOut',
            });
          });
          this.spawnFloatingText(bDef.x, bDef.y - 22, `🏰 ${bDef.title} errichtet!`, '#fde68a');
        }
      } else if (!isBuilt && !this.buildingPlotSprites.has(bDef.id)) {
        // Subtle foundation plot marker on the map so player knows where the building will appear
        const g = this.add.graphics();
        g.lineStyle(1.5, 0xfbbf24, 0.75);
        g.fillStyle(0x78350f, 0.22);
        g.fillRoundedRect(bDef.x - 16, bDef.y - 16, 32, 18, 4);
        g.strokeRoundedRect(bDef.x - 16, bDef.y - 16, 32, 18, 4);
        g.setDepth(bDef.y - 10);
        this.buildingPlotSprites.set(bDef.id, [g]);
      }
    }
  }

  public spawnFloatingText(x: number, y: number, msg: string, color = '#fef08a'): void {
    const txt = this.add.text(x, y, msg, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color,
      stroke: '#1c1309',
      strokeThickness: 3,
      fontStyle: 'bold',
    });
    txt.setOrigin(0.5, 1).setDepth(9999);
    this.tweens.add({
      targets: txt,
      y: y - 24,
      alpha: 0,
      duration: 1400,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  private placeResourceNodes(): void {
    for (const node of RESOURCE_NODES) {
      let spr: Phaser.GameObjects.Image | null = null;
      if (this.textures.exists(node.spriteKey)) {
        spr = this.add.image(node.x, node.y, node.spriteKey);
      } else if (this.textures.get('world_atlas')?.has(node.spriteKey)) {
        spr = this.add.image(node.x, node.y, 'world_atlas', node.spriteKey);
      }
      if (spr) {
        spr.setOrigin(0.5, 0.9);
        if (node.scale) spr.setScale(node.scale);
        spr.setDepth(node.y);

        this.resourceState.set(node.id, { sprite: spr, readyAt: 0 });
        this.livingWorldManager.registerResourceHotspot(node.x, node.y);
        if (node.spriteKey.startsWith('tree_') || node.spriteKey.startsWith('bush_')) {
          this.livingWorldManager.registerFlora(spr);
        }
      }
    }
  }

  private syncRelicVisuals(): void {
    for (const rel of MEDIEVAL_RELICS) {
      const isDiscovered = gameState.discoveredRelics.has(rel.id);
      if (isDiscovered) {
        const objs = this.relicVisuals.get(rel.id);
        if (objs) {
          objs.forEach((o) => o.destroy());
          this.relicVisuals.delete(rel.id);
        }
        const t = this.targets.find((x) => x.id === `relic_${rel.id}`);
        if (t) t.discovered = true;
      }
    }
  }

  private setupTargets(): void {
    this.targets = [];

    // 1. Mentoren der Kapitel
    for (const ch of MEDIEVAL_CHAPTERS) {
      this.targets.push({
        id: `mentor_${ch.mentor.id}`,
        kind: 'mentor',
        name: ch.mentor.name,
        sub: ch.mentor.role,
        x: ch.mentor.x,
        y: ch.mentor.y,
        minChapter: ch.id,
        actionTip: '[E] Ansprechen',
      });
    }

    // Spawn aktiven Mentor-Sprite für aktuelles Kapitel
    this.updateActiveMentorSprite();

    // 2. Relikte auf der Karte (mit echtem Relikt-Sprite + Leucht-Marker, jederzeit auswählbar!)
    for (const rel of MEDIEVAL_RELICS) {
      const isDiscovered = gameState.discoveredRelics.has(rel.id);
      if (!isDiscovered) {
        const objs: Phaser.GameObjects.GameObject[] = [];
        if (this.textures.exists('relic_marker_glow')) {
          const marker = this.add.sprite(rel.x, rel.y, 'relic_marker_glow');
          marker.setOrigin(0.5, 0.5);
          marker.setScale(0.75);
          marker.setDepth(rel.y - 1);

          this.tweens.add({
            targets: marker,
            scale: 0.95,
            alpha: { from: 0.55, to: 0.95 },
            yoyo: true,
            repeat: -1,
            duration: 950,
            ease: 'Sine.easeInOut',
          });
          objs.push(marker);
        }
        if (this.textures.exists(rel.id)) {
          const relImg = this.add.image(rel.x, rel.y - 3, rel.id);
          relImg.setOrigin(0.5, 0.6);
          relImg.setScale(0.65);
          relImg.setDepth(rel.y + 1);
          this.tweens.add({
            targets: relImg,
            y: rel.y - 6,
            yoyo: true,
            repeat: -1,
            duration: 1100,
            ease: 'Sine.easeInOut',
          });
          objs.push(relImg);
        }
        this.relicVisuals.set(rel.id, objs);
      }

      this.targets.push({
        id: `relic_${rel.id}`,
        kind: 'relic',
        name: rel.name,
        sub: 'Archäologischer Leitfund',
        x: rel.x,
        y: rel.y,
        minChapter: 1, // Alle Relikte auf der Karte sind jederzeit untersuch- & sammelbar!
        relic: rel,
        discovered: isDiscovered,
        actionTip: '[E] Fundstück bergen & untersuchen',
      });
    }

    // 3. Ressourcen-Hotspots (Holz schlagen, Steine abbauen, Eisenerz, Ernte)
    for (const r of RESOURCE_NODES) {
      let actionLabel = '[E] Ernten & Sammeln';
      if (r.item === 'holz_balken') actionLabel = '[E] Holz schlagen (+Bauholz)';
      else if (r.item === 'feldstein') actionLabel = '[E] Steine abbauen (+Bruchstein)';
      else if (r.item === 'eisen_barren') actionLabel = '[E] Eisenerz abbauen (+Eisen)';
      else if (r.item === 'wollballen') actionLabel = '[E] Schafwolle scheren';

      this.targets.push({
        id: `res_${r.id}`,
        kind: 'resource',
        name: r.name,
        sub: 'Rohstoffquelle',
        x: r.x,
        y: r.y,
        minChapter: 1,
        itemId: r.item as MedievalItemId,
        nodeDef: r,
        actionTip: actionLabel,
      });
    }

    // 3b. Bauplätze für errichtbare Bauwerke
    for (const bDef of MEDIEVAL_BUILDINGS) {
      this.targets.push({
        id: `plot_${bDef.id}`,
        kind: 'building_plot',
        name: `Bauplatz: ${bDef.title}`,
        sub: bDef.name,
        x: bDef.x,
        y: bDef.y,
        minChapter: 1,
        buildingId: bDef.id,
        actionTip: '[E] Bauwerk errichten / ansehen',
      });
    }

    // 4. Interaktive Dorf- & Burg-Stationen
    this.targets.push({
      id: 'inter_schmiede_amboss',
      kind: 'interactive_quest',
      name: 'Dorfamboss',
      sub: 'Dorfschmiede',
      x: 36 * 16,
      y: 54 * 16,
      minChapter: 1,
      actionTip: '[E] Dorfschmiede öffnen (Taste C)',
    });

    this.targets.push({
      id: 'inter_kloster_kraeuter',
      kind: 'interactive_quest',
      name: 'Kräutergarten-Mörser',
      sub: 'Infirmerie St. Benedikt',
      x: 74 * 16,
      y: 26 * 16,
      minChapter: 3,
      actionTip: '[E] Arznei-Station öffnen',
    });

    this.targets.push({
      id: 'inter_burg_ruestung',
      kind: 'interactive_quest',
      name: 'Ritterliche Rüstkammer',
      sub: 'Burg Steinfels',
      x: 16 * 16,
      y: 24 * 16,
      minChapter: 6,
      actionTip: '[E] Rüstkammer-Station öffnen',
    });

    // 5. Interaktive Dorf- & Hof-Objekte aus MEDIEVAL_DECOR
    for (const d of MEDIEVAL_DECOR) {
      if (d.interactive) {
        this.targets.push({
          id: d.id,
          kind: d.kind === 'resource' ? 'resource' : 'interactive_quest',
          name: d.label ? d.label.replace(/^\[E\]\s*/, '') : d.id,
          sub: d.kind === 'building' ? 'Dorfgebäude' : 'Interaktives Objekt',
          x: d.x,
          y: d.y,
          minChapter: 1,
          actionTip: d.label || '[E] Interagieren',
        });
      }
    }

    // 6. Falko Streichel-Ziel
    if (this.companionManager.sprite) {
      this.targets.push({
        id: 'companion_falko',
        kind: 'companion',
        name: 'Hofhund Falko',
        sub: 'Treuer Begleiter',
        x: this.companionManager.sprite.x,
        y: this.companionManager.sprite.y,
        minChapter: 1,
        actionTip: '[E] Falko kraulen ❤️',
      });
    }
  }

  private updateActiveMentorSprite(): void {
    if (this.mentorSprite) {
      this.mentorSprite.destroy();
      this.mentorSprite = null;
    }

    const curCh = MEDIEVAL_CHAPTERS.find((c) => c.id === gameState.chapter);
    if (!curCh) return;

    const mentor = curCh.mentor;
    const spriteKey = mentor.avatar.split('/').pop()?.replace('.png', '') || 'keep_peasant_m';

    if (this.textures.exists(spriteKey)) {
      this.mentorSprite = this.add.sprite(mentor.x, mentor.y, spriteKey, 0);
      this.mentorSprite.setOrigin(0.5, 0.9);
      this.mentorSprite.setScale(0.8);
      this.mentorSprite.setDepth(mentor.y);
      this.mentorSprite.setInteractive({ useHandCursor: true });
      this.mentorSprite.on('pointerdown', () => this.triggerInteraction());

      if (this.anims.exists(`${spriteKey}-idle-down`)) {
        this.mentorSprite.play(`${spriteKey}-idle-down`);
      }
    }
  }

  private initInteractionLabel(): void {
    const existing = document.getElementById('world-dom-label');
    if (existing) {
      this.labelDiv = existing;
    } else {
      this.labelDiv = document.createElement('div');
      this.labelDiv.id = 'world-dom-label';
      this.labelDiv.className = 'world-dom-label';
      this.labelDiv.style.display = 'none';
      document.body.appendChild(this.labelDiv);
    }
    this.labelDiv.style.pointerEvents = 'auto';
    this.labelDiv.style.cursor = 'pointer';
    this.labelDiv.onclick = (e) => {
      e.stopPropagation();
      this.triggerInteraction();
    };
  }

  private onGameStateChanged(): void {
    // 1. Sync newly built buildings & discovered relics immediately!
    this.syncBuiltBuildings(true);
    this.syncRelicVisuals();

    // 2. Check chapter banner
    if (this.lastBannerChapter !== gameState.chapter) {
      this.lastBannerChapter = gameState.chapter;
      const curCh = MEDIEVAL_CHAPTERS.find((c) => c.id === gameState.chapter);
      if (curCh) {
        this.chapterBanner.show({
          chapterNumber: curCh.number,
          title: curCh.title,
          subtitle: `${curCh.eraName} · ${curCh.sub}`,
        });
      }
      this.updateActiveMentorSprite();
      sound.startBGM(gameState.chapter);
    }
  }

  public focusOnDialog(targetX: number, targetY: number): void {
    this.isDialogZoomed = true;
    const midX = (this.player.x + targetX) / 2;
    const midY = (this.player.y + targetY) / 2;

    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.32,
      duration: 450,
      ease: 'Cubic.easeInOut',
    });
  }

  public resetDialogFocus(): void {
    this.isDialogZoomed = false;
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 2.2,
      duration: 400,
      ease: 'Cubic.easeInOut',
    });
  }

  private getPlayerSurface(): 'stone' | 'dirt' | 'grass' | 'wood' {
    // 1. Holzbrücke
    for (const b of this.bridgeBounds) {
      if (
        this.player.x >= b.x &&
        this.player.x <= b.x + b.w &&
        this.player.y >= b.y &&
        this.player.y <= b.y + b.h
      ) {
        return 'wood';
      }
    }
    // 2. Stein: Burg-Plateau & Marktplatz
    const tx = this.player.x / 16;
    const ty = this.player.y / 16;
    if (tx >= 16 && tx <= 38 && ty >= 12 && ty <= 30) return 'stone';
    // 3. Pfade
    if (ty >= 36 && ty <= 44) return 'dirt';
    return 'grass';
  }

  update(time: number, delta: number): void {
    const win = window as any;

    // Update resource node regrowth alpha
    const now = Date.now();
    for (const [, state] of this.resourceState) {
      const ready = now >= state.readyAt;
      state.sprite.setAlpha(ready ? 1.0 : 0.45);
    }

    // CRITICAL FIX: Block world movement & world [E] trigger while any modal/dialog is open!
    if (win.__isModalOpen && win.__isModalOpen()) {
      if (this.wasd?.E) Phaser.Input.Keyboard.JustDown(this.wasd.E);
      if (this.spaceKey) Phaser.Input.Keyboard.JustDown(this.spaceKey);
      if (this.enterKey) Phaser.Input.Keyboard.JustDown(this.enterKey);
      this.player.stop();
      if (this.labelDiv) this.labelDiv.style.display = 'none';
      return;
    }

    // 1. Movement Inputs (WASD, CursorKeys, TouchControls)
    let moveX = 0;
    let moveY = 0;

    const touch = win.__touchControls;
    if (touch && (touch.dx !== 0 || touch.dy !== 0)) {
      moveX = touch.dx;
      moveY = touch.dy;
    } else {
      if (this.cursors.left?.isDown || this.wasd?.A?.isDown) moveX -= 1;
      if (this.cursors.right?.isDown || this.wasd?.D?.isDown) moveX += 1;
      if (this.cursors.up?.isDown || this.wasd?.W?.isDown) moveY -= 1;
      if (this.cursors.down?.isDown || this.wasd?.S?.isDown) moveY += 1;
    }

    const isMoving = moveX !== 0 || moveY !== 0;

    if (isMoving) {
      const len = Math.hypot(moveX, moveY);
      const speed = 94; // px / sec
      const vx = (moveX / len) * speed * (delta / 1000);
      const vy = (moveY / len) * speed * (delta / 1000);

      const nextX = Phaser.Math.Clamp(this.player.x + vx, 20, (this.mapW - 2) * 16);
      const nextY = Phaser.Math.Clamp(this.player.y + vy, 20, (this.mapH - 2) * 16);

      // Smooth sliding collision against river water & solid buildings
      if (this.isWalkable(nextX, nextY)) {
        this.player.x = nextX;
        this.player.y = nextY;
      } else if (this.isWalkable(nextX, this.player.y)) {
        this.player.x = nextX;
      } else if (this.isWalkable(this.player.x, nextY)) {
        this.player.y = nextY;
      }
      this.player.setDepth(this.player.y);

      // Facing & Walk Animation
      if (Math.abs(moveX) > Math.abs(moveY)) {
        if (moveX > 0) {
          this.facing = 'right';
          this.player.setFlipX(false);
          this.player.play('walk-right', true);
        } else {
          this.facing = 'left';
          this.player.setFlipX(true);
          this.player.play('walk-right', true);
        }
      } else {
        if (moveY > 0) {
          this.facing = 'down';
          this.player.setFlipX(false);
          this.player.play('walk-down', true);
        } else {
          this.facing = 'up';
          this.player.setFlipX(false);
          this.player.play('walk-up', true);
        }
      }

      // Footstep Audio
      this.stepTimer += delta;
      if (this.stepTimer > 360) {
        this.stepTimer = 0;
        sound.footstep(this.getPlayerSurface());
        gameState.walkedDistanceMeters += 1;
      }
    } else {
      this.player.stop();
      if (this.facing === 'down') this.player.setFrame(0);
      else if (this.facing === 'right') this.player.setFrame(17);
      else if (this.facing === 'up') this.player.setFrame(34);
      else this.player.setFrame(17);
    }

    // Save coords in GameState
    gameState.playerX = this.player.x;
    gameState.playerY = this.player.y;
    gameState.playTimeSeconds += delta / 1000;
    gameState.dayTime = (gameState.dayTime + delta / 480000) % 1;

    // 2. Subsystem Updates
    this.wildlifeManager.update(delta, this.player.x, this.player.y);
    this.livingWorldManager.update(delta);
    this.companionManager.update(this.player, this.targets, delta);

    // 3. Proximity Target & Quest Compass
    this.updateActiveTargetAndCompass();

    // 4. Handle Touch Action Button (Keyboard [E]/[Space]/[Enter] is handled cleanly by UIScene)
    if (touch && touch.actionPressed) {
      touch.actionPressed = false;
      this.triggerInteraction();
    }
  }

  private updateActiveTargetAndCompass(): void {
    let closestTarget: InteractiveTarget | null = null;
    let minDist = 52; // Proximity threshold

    for (const t of this.targets) {
      if (t.minChapter > gameState.chapter) continue;
      // Skip already discovered relics on the map
      if (t.kind === 'relic' && (t.discovered || (t.relic && gameState.discoveredRelics.has(t.relic.id)))) {
        continue;
      }
      // Skip building plots that are already built
      if (t.kind === 'building_plot' && t.buildingId && gameState.builtBuildings.has(t.buildingId)) {
        continue;
      }

      // Falko Coords dynamisch abfragen
      const tx = t.kind === 'companion' && this.companionManager.sprite ? this.companionManager.sprite.x : t.x;
      const ty = t.kind === 'companion' && this.companionManager.sprite ? this.companionManager.sprite.y : t.y;

      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, tx, ty);
      const reach = t.kind === 'interactive_quest' || t.kind === 'relic' ? 56 : 48;
      if (d < reach && d < minDist) {
        minDist = d;
        closestTarget = t;
      }
    }

    this.activeTarget = closestTarget;

    // DOM-Label Positionierung
    if (this.activeTarget && this.labelDiv) {
      const tx =
        this.activeTarget.kind === 'companion' && this.companionManager.sprite
          ? this.companionManager.sprite.x
          : this.activeTarget.x;
      const ty =
        this.activeTarget.kind === 'companion' && this.companionManager.sprite
          ? this.companionManager.sprite.y
          : this.activeTarget.y;

      const cam = this.cameras.main;
      const rect = this.game.canvas.getBoundingClientRect();
      const sx = rect.left + ((tx - cam.worldView.x) / cam.worldView.width) * rect.width;
      const sy = rect.top + ((ty - 28 - cam.worldView.y) / cam.worldView.height) * rect.height;

      this.labelDiv.style.left = `${sx}px`;
      this.labelDiv.style.top = `${sy}px`;
      this.labelDiv.innerHTML = `<strong>${this.activeTarget.name}</strong><br><span style="font-size:11px;color:#fde68a">${this.activeTarget.actionTip || '[E] Interagieren'}</span>`;
      this.labelDiv.style.display = 'block';
    } else if (this.labelDiv) {
      this.labelDiv.style.display = 'none';
    }

    // Quest-Radar / Compass zum intelligenten Ziel
    const curCh = MEDIEVAL_CHAPTERS.find((c) => c.id === gameState.chapter);
    if (curCh) {
      const steps = gameState.getQuestStepProgress(curCh.id);
      let targetX = curCh.targetCoords.x;
      let targetY = curCh.targetCoords.y;
      let targetName = curCh.mentor.name;
      let actionTip = `📍 Sprich mit ${curCh.mentor.name} [E]`;

      if (!steps[0]?.done) {
        // Step 0: Mentor Intro Dialog
        targetX = curCh.mentor.x;
        targetY = curCh.mentor.y;
        targetName = curCh.mentor.name;
        actionTip = `📍 Sprich mit ${curCh.mentor.name} [E]`;
      } else if (!steps[1]?.done) {
        // Step 1: Action (Falko, Relic, Station, etc.)
        if (curCh.id === 1 && this.companionManager.sprite) {
          targetX = this.companionManager.sprite.x;
          targetY = this.companionManager.sprite.y;
          targetName = 'Hofhund Falko';
          actionTip = '❤️ Streichle Falko [E]!';
        } else if (curCh.id === 2) {
          targetX = 62 * 16;
          targetY = 60 * 16;
          targetName = 'Pflugmesser (Südfeld)';
          actionTip = '📍 Birg das Pflugmesser [E]!';
        } else if (curCh.id === 3) {
          targetX = 74 * 16;
          targetY = 26 * 16;
          targetName = 'Kräutergarten (Kloster)';
          actionTip = '🌿 Untersuche die Kräuter [E]!';
        } else if (curCh.id === 4) {
          targetX = 32 * 16;
          targetY = 44 * 16;
          targetName = 'Marktplatz (Silberdenar)';
          actionTip = '🪙 Untersuche den Markt [E]!';
        } else if (curCh.id === 5) {
          targetX = 44 * 16;
          targetY = 64 * 16;
          targetName = 'Wassermühle am Mühlenbach';
          actionTip = '⚙️ Mahle Getreide an der Mühle [E]!';
        } else if (curCh.id === 6) {
          targetX = 16 * 16;
          targetY = 24 * 16;
          targetName = 'Ritterliche Rüstkammer';
          actionTip = '🛡️ Untersuche die Rüstkammer [E]!';
        } else {
          targetX = curCh.targetCoords.x;
          targetY = curCh.targetCoords.y;
          targetName = curCh.targetCoords.name;
        }
      } else if (!steps[2]?.done) {
        // Step 2: Crafting [C]
        targetX = this.player.x;
        targetY = this.player.y;
        targetName = 'Werkstatt';
        gameState.compassText = '🥖 Drücke C -> Handwerksmenü öffnen & Gegenstand herstellen!';
      } else if (!steps[3]?.done) {
        // Step 3: Building [B]
        const reqB = MEDIEVAL_BUILDINGS.find((b) => b.chapter <= curCh.id && !gameState.builtBuildings.has(b.id));
        if (reqB) {
          targetX = reqB.x;
          targetY = reqB.y;
          targetName = `Bauplatz: ${reqB.title}`;
          actionTip = `🏰 Drücke B (oder E am Bauplatz) -> ${reqB.title} errichten!`;
        } else {
          targetX = this.player.x;
          targetY = this.player.y;
          targetName = 'Baugelände';
          gameState.compassText = '🏰 Drücke B -> Baumodus öffnen & Struktur errichten!';
        }
      } else {
        // ALL 4 STEPS DONE! Point to Mentor for Quiz!
        targetX = curCh.mentor.x;
        targetY = curCh.mentor.y;
        targetName = `${curCh.mentor.name} (Prüfung)`;
        actionTip = `✨ Alle Aufgaben erfüllt! Sprich mit ${curCh.mentor.name} [E] für das Quiz!`;
      }

      if (steps[0]?.done && !steps[2]?.done && targetX === this.player.x && targetY === this.player.y) {
        // Compass text already set above!
      } else {
        const dx = targetX - this.player.x;
        const dy = targetY - this.player.y;
        gameState.setCompass(targetName, dx, dy, actionTip);
      }
      gameState.activeObjectiveText = curCh.objective;
    }
  }

  public triggerInteraction(): void {
    if (!this.activeTarget) return;

    sound.click();

    // 1. Companion
    if (this.activeTarget.kind === 'companion') {
      this.companionManager.pet();
      gameState.safety = Math.min(100, gameState.safety + 3);
      if (gameState.chapter === 1) {
        gameState.setObjectiveProgress(1, 1, true);
      }
      gameState.notify();
      return;
    }

    // 2. Mentor -> Dialog öffnen
    if (this.activeTarget.kind === 'mentor') {
      const curCh = MEDIEVAL_CHAPTERS.find((c) => c.id === gameState.chapter);
      if (curCh) {
        this.focusOnDialog(this.activeTarget.x, this.activeTarget.y);
        const win = window as any;
        if (win.__openMentorDialog) {
          win.__openMentorDialog(curCh);
        }
      }
      return;
    }

    // 3. Relikt bergen
    if (this.activeTarget.kind === 'relic' && this.activeTarget.relic) {
      const rel = this.activeTarget.relic;
      this.activeTarget.discovered = true;
      gameState.discoverRelic(rel.id);
      this.syncRelicVisuals();
      sound.questStep();
      if (rel.id === 'relic_pflugmesser' && gameState.chapter === 2) {
        gameState.setObjectiveProgress(2, 1, true);
      } else if (rel.id === 'relic_codex' && gameState.chapter === 3) {
        gameState.setObjectiveProgress(3, 1, true);
      } else if (rel.id === 'relic_silberdenar' && gameState.chapter === 4) {
        gameState.setObjectiveProgress(4, 1, true);
      } else if (rel.id === 'relic_ritterschild' && gameState.chapter === 6) {
        gameState.setObjectiveProgress(6, 1, true);
      } else if (rel.id === 'relic_lehnsurkunde' && gameState.chapter === 4) {
        gameState.setObjectiveProgress(4, 1, true);
      }
      const win = window as any;
      if (win.__openArtifactInspector) {
        win.__openArtifactInspector(rel);
      }
      return;
    }

    // 3b. Bauplatz direkt vor Ort errichten oder Baumenü öffnen
    if (this.activeTarget.kind === 'building_plot' && this.activeTarget.buildingId) {
      const bDef = MEDIEVAL_BUILDINGS.find((b) => b.id === this.activeTarget!.buildingId);
      const win = window as any;
      if (bDef && gameState.hasItems(bDef.cost)) {
        if (gameState.build(bDef.id)) {
          sound.questStep();
          const curCh = MEDIEVAL_CHAPTERS.find((c) => c.id === gameState.chapter);
          if (curCh && bDef.chapter <= curCh.id) {
            gameState.setObjectiveProgress(curCh.id, 3, true);
          }
          if (win.__showToast) {
            win.__showToast(`🏰 ${bDef.title} erfolgreich vor Ort errichtet!`);
          }
          return;
        }
      }
      if (win.__toggleModal) win.__toggleModal('B');
      return;
    }

    // 4. Rohstoff ernten (Holz schlagen, Steine abbauen, Eisenerz, Felder, Brunnen)
    if (this.activeTarget.kind === 'resource') {
      const itemId = this.activeTarget.itemId;
      const nodeDef = this.activeTarget.nodeDef;
      const win = window as any;

      if (nodeDef) {
        const st = this.resourceState.get(nodeDef.id);
        const now = Date.now();
        if (st && now < st.readyAt) {
          const secs = Math.ceil((st.readyAt - now) / 1000);
          if (win.__showToast) {
            win.__showToast(`⏳ ${nodeDef.name} regeneriert noch (${secs}s)...`);
          }
          return;
        }
        if (st) {
          st.readyAt = now + Math.min(12000, nodeDef.respawnTime || 12000);
          st.sprite.setAlpha(0.45);
        }
      }

      if (itemId) {
        const amount = nodeDef?.amount || 2;
        gameState.addInventory(itemId, amount);
        gameState.food = Math.max(10, gameState.food - 1);
        gameState.notify();
        sound.questStep();
        const itemName = MEDIEVAL_ITEMS[itemId]?.name || 'Rohstoff';
        let verb = 'Geerntet';
        if (itemId === 'holz_balken') verb = '🪓 Holz geschlagen';
        else if (itemId === 'feldstein') verb = '⛏️ Steine abgebaut';
        else if (itemId === 'eisen_barren') verb = '⛏️ Eisenerz geschürft';
        else if (itemId === 'wollballen') verb = '✂️ Wolle geschoren';

        this.spawnFloatingText(this.activeTarget.x, this.activeTarget.y - 16, `+${amount} ${itemName}`, '#fde68a');
        if (win.__showToast) {
          win.__showToast(`${verb}: +${amount} ${itemName} erhalten!`);
        }
      } else if (this.activeTarget.id === 'dorf_brunnen' || this.activeTarget.id === 'burg_zisterne') {
        gameState.addInventory('wasser_eimer', 2);
        sound.questStep();
        this.spawnFloatingText(this.activeTarget.x, this.activeTarget.y - 16, '+2 Brunnenwasser', '#93c5fd');
        if (win.__showToast) win.__showToast('💧 Klares Quellwasser aus dem Brunnen geschöpft (+2 Wassereimer)!');
      } else {
        sound.click();
        if (win.__showToast) win.__showToast(`🔍 ${this.activeTarget.name} untersucht.`);
      }
      return;
    }

    // 5. Interaktive Stationen & Gebäude
    if (this.activeTarget.id === 'inter_schmiede_amboss' || this.activeTarget.id === 'dorf_amboss') {
      const win = window as any;
      if (win.__toggleModal) win.__toggleModal('C');
      return;
    }

    if (this.activeTarget.id === 'dorf_bread_bakeoven') {
      const win = window as any;
      if (gameState.craft('brot_backen')) {
        sound.questStep();
        if (gameState.chapter === 1) gameState.setObjectiveProgress(1, 2, true);
        this.spawnFloatingText(this.activeTarget.x, this.activeTarget.y - 16, '+2 Dorfbrot!', '#fde68a');
        if (win.__showToast) win.__showToast('🥖 Du hast im Steinbackofen 2 knusprige Dorfrote gebacken!');
      } else if (win.__toggleModal) {
        win.__toggleModal('C');
      }
      return;
    }

    if (this.activeTarget.id === 'inter_kloster_kraeuter' || this.activeTarget.id === 'kloster_kraeutergarten' || this.activeTarget.id === 'kloster_herbal_planter') {
      if (gameState.chapter === 3) gameState.setObjectiveProgress(3, 1, true);
      const win = window as any;
      if (win.__openStation) win.__openStation('station_kraeuter');
      return;
    }

    if (this.activeTarget.id === 'inter_burg_ruestung' || this.activeTarget.id === 'burg_ruestkammer' || this.activeTarget.id === 'burg_armor_suit') {
      if (gameState.chapter === 6) gameState.setObjectiveProgress(6, 1, true);
      const win = window as any;
      if (win.__openStation) win.__openStation('station_ruestkammer');
      return;
    }

    if (this.activeTarget.id === 'dorf_wassermuehle' || this.activeTarget.id === 'acker_windmill_tower') {
      sound.questStep();
      gameState.addInventory('mehl_sack', 2);
      if (gameState.chapter === 5) gameState.setObjectiveProgress(5, 1, true);
      this.spawnFloatingText(this.activeTarget.x, this.activeTarget.y - 16, '+2 Roggenmehl', '#fde68a');
      const win = window as any;
      if (win.__showToast) win.__showToast('⚙️ Die Mühle mahlt das Korn zu feinem Mehl (+2 Roggenmehl)!');
      return;
    }

    if (this.activeTarget.id === 'dorf_gasthof' || this.activeTarget.id === 'dorf_tavern_casks') {
      sound.door();
      gameState.food = Math.min(100, gameState.food + 15);
      gameState.notify();
      this.spawnFloatingText(this.activeTarget.x, this.activeTarget.y - 16, '+15% Stärkung', '#86efac');
      const win = window as any;
      if (win.__showToast) win.__showToast('🍻 Dorfkrug "Zum Goldenen Pflug": Du stärkst dich am Kamin (+15% Nahrung).');
      return;
    }

    if (this.activeTarget.id === 'kloster_scriptorium_desk') {
      sound.questStep();
      gameState.addInventory('pergament_bogen', 1);
      gameState.knowledge = Math.min(100, gameState.knowledge + 5);
      gameState.notify();
      this.spawnFloatingText(this.activeTarget.x, this.activeTarget.y - 16, '+1 Pergament', '#fde68a');
      const win = window as any;
      if (win.__showToast) win.__showToast('📜 Im Skriptorium ein glattes Kalbspergament präpariert (+1 Pergament)!');
      return;
    }

    const win = window as any;
    if (win.__showToast) {
      win.__showToast(`🔍 ${this.activeTarget.name}: Ein Zeugnis mittelalterlicher Alltagskultur.`);
    }
  }
}
