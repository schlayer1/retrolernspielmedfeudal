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

  private mentorSprite: Phaser.GameObjects.Sprite | null = null;
  private targets: InteractiveTarget[] = [];
  private activeTarget: InteractiveTarget | null = null;
  private labelDiv: HTMLElement | null = null;

  public wildlifeManager!: WildlifeManager;
  public livingWorldManager!: LivingWorldManager;
  public chapterBanner!: ChapterBanner;
  public companionManager!: CompanionManager;

  private stepTimer = 0;
  private facing: 'down' | 'up' | 'left' | 'right' = 'down';
  private lastBannerChapter = -1;
  private isDialogZoomed = false;

  // Bridge bounds for footstep audio
  private bridgeBounds = [{ x: 48 * 16, y: 38 * 16, w: 8 * 16, h: 5 * 16 }];

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

    // 3. Setup Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      };
    }

    // 4. Place Static Decor & Architecture
    this.placeWorldDecor();

    // 5. Place Resource Hotspots
    this.placeResourceNodes();

    // 6. Spawn Player
    this.player = this.add.sprite(gameState.playerX, gameState.playerY, 'character', 0);
    this.player.setOrigin(0.5, 0.9);
    this.player.setScale(1.0);
    this.player.setDepth(this.player.y);

    // 7. Setup Camera
    this.cameras.main.setBounds(0, 0, this.mapW * 16, this.mapH * 16);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2.2);

    // 8. Setup Interactive Targets & Mentors
    this.setupTargets();

    // 9. Init Wildlife & Living World
    this.wildlifeManager.init();
    this.livingWorldManager.initWaterEffects(50 * 16, 54 * 16, 4 * 16, 76 * 16);

    // 10. Fire & Smoke on Forges & Braziers
    this.livingWorldManager.registerFireSource(36 * 16, 52 * 16, true, 34, 0xffa533); // Schmiede
    this.livingWorldManager.registerFireSource(22 * 16, 16 * 16, true, 30, 0xff7722); // Burg-Kamin
    this.livingWorldManager.registerFireSource(24 * 16, 28 * 16, false, 24, 0xffaa44); // Burgtor-Fackel

    // 11. Companion Unlock (Kapitel 1)
    this.companionManager.unlock(this.player.x - 20, this.player.y);

    // 12. First Chapter Banner
    this.lastBannerChapter = gameState.chapter;
    const curCh = MEDIEVAL_CHAPTERS.find((c) => c.id === gameState.chapter);
    if (curCh) {
      this.chapterBanner.show({
        chapterNumber: curCh.number,
        title: curCh.title,
        subtitle: `${curCh.eraName} · ${curCh.sub}`,
      });
    }

    // 13. Single Proximity DOM Label
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

    const canvasTex = this.textures.createCanvas(texKey, W, H)!;
    const ctx = canvasTex.getContext();
    const imgData = ctx.createImageData(W, H);
    const dst = imgData.data;

    // Palette Colors (16-Bit Bayer Sampling)
    // 0: Lush grass, 1: Deep forest grass, 2: Cobble stone, 3: Warm dirt road, 4: Sand shore, 5: Water
    const colLush: [number, number, number] = [98, 148, 62];
    const colDeep: [number, number, number] = [68, 112, 44];
    const colStone: [number, number, number] = [142, 138, 130];
    const colCastlePave: [number, number, number] = [170, 165, 155];
    const colDirt: [number, number, number] = [178, 136, 88];
    const colShore: [number, number, number] = [212, 184, 134];
    const colWater: [number, number, number] = [62, 124, 184];

    const bayer4 = [
      [0 / 16, 8 / 16, 2 / 16, 10 / 16],
      [12 / 16, 4 / 16, 14 / 16, 6 / 16],
      [3 / 16, 11 / 16, 1 / 16, 9 / 16],
      [15 / 16, 7 / 16, 13 / 16, 5 / 16],
    ];

    for (let y = 0; y < H; y += 2) {
      for (let x = 0; x < W; x += 2) {
        const dither = bayer4[(y >> 1) & 3][(x >> 1) & 3] - 0.5;
        const tx = x / 16;
        const ty = y / 16;

        // River Burgbach (x: 50..54 with organic curve)
        const riverCenterX = 52 + Math.sin(ty * 0.12) * 2.5;
        const distRiver = Math.abs(tx - riverCenterX);

        // Wooden Bridge at y: 39..42
        const isBridge = distRiver < 3.2 && ty >= 38.5 && ty <= 42.5;

        // Roads
        // Castle path: from (28, 28) to bridge (52, 40)
        const dCastleRoad = this.distToSegment(tx, ty, 28, 28, 50, 40);
        // Village road: from (24, 56) to bridge (50, 40)
        const dVillageRoad = this.distToSegment(tx, ty, 26, 58, 50, 40);
        // Monastery road: from bridge (54, 40) to (78, 22)
        const dKlosterRoad = this.distToSegment(tx, ty, 54, 40, 78, 22);
        // Farm road: from bridge (54, 40) to (70, 56)
        const dFarmRoad = this.distToSegment(tx, ty, 54, 40, 70, 56);

        const minRoadDist = Math.min(dCastleRoad, dVillageRoad, dKlosterRoad, dFarmRoad);

        // Castle Plateau (x: 14..38, y: 8..30)
        const inCastleCourt = tx >= 16 && tx <= 36 && ty >= 12 && ty <= 28;

        for (let py = y; py < y + 2 && py < H; py++) {
          for (let px = x; px < x + 2 && px < W; px++) {
            let rgb: [number, number, number];

            if (isBridge) {
              rgb = [138, 98, 62]; // Wood planks
            } else if (distRiver < 2.2) {
              rgb = colWater;
            } else if (distRiver < 3.4) {
              rgb = colShore;
            } else if (inCastleCourt) {
              rgb = dither > 0.1 ? colCastlePave : colStone;
            } else if (minRoadDist < 1.6 + dither * 0.4) {
              rgb = minRoadDist < 0.9 ? colStone : colDirt;
            } else {
              // Meadow / Forest with Bayer waves
              const wave = Math.sin(px * 0.02 + py * 0.02) * 0.5 + Math.cos(px * 0.015 - py * 0.025) * 0.5;
              if (wave + dither * 0.5 > 0.4) {
                rgb = colDeep;
              } else {
                rgb = colLush;
              }
            }

            const oi = (py * W + px) * 4;
            dst[oi] = rgb[0];
            dst[oi + 1] = rgb[1];
            dst[oi + 2] = rgb[2];
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

  private placeWorldDecor(): void {
    // 1. Static Decor from MEDIEVAL_DECOR
    for (const d of MEDIEVAL_DECOR) {
      if (this.textures.exists(d.spriteKey)) {
        const img = this.add.image(d.x, d.y, d.spriteKey);
        img.setOrigin(d.originX ?? 0.5, d.originY ?? 0.9);
        if (d.scale) img.setScale(d.scale);
        img.setDepth(d.y);

        // Flora Wind Sway
        if (d.spriteKey.startsWith('tree_') || d.spriteKey.startsWith('bush_')) {
          this.livingWorldManager.registerFlora(img);
        }
      }
    }

    // 2. Dynamic Erected Buildings (from gameState.builtBuildings)
    for (const bId of gameState.builtBuildings) {
      const bDef = MEDIEVAL_BUILDINGS.find((b) => b.id === bId);
      if (bDef && this.textures.exists(bDef.spriteKey)) {
        const bImg = this.add.image(bDef.x, bDef.y, bDef.spriteKey);
        bImg.setOrigin(0.5, 0.9);
        bImg.setScale(bDef.scale);
        bImg.setDepth(bDef.y);
      }
    }
  }

  private placeResourceNodes(): void {
    for (const node of RESOURCE_NODES) {
      if (this.textures.exists(node.spriteKey)) {
        const spr = this.add.image(node.x, node.y, node.spriteKey);
        spr.setOrigin(0.5, 0.9);
        if (node.scale) spr.setScale(node.scale);
        spr.setDepth(node.y);

        this.livingWorldManager.registerResourceHotspot(node.x, node.y);
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

    // 2. Relikte auf der Karte (mit In-World-Marker)
    for (const rel of MEDIEVAL_RELICS) {
      const isDiscovered = gameState.discoveredRelics.has(rel.id);
      if (!isDiscovered && this.textures.exists('relic_marker_glow')) {
        const marker = this.add.sprite(rel.x, rel.y, 'relic_marker_glow');
        marker.setOrigin(0.5, 0.5);
        marker.setScale(0.85);
        marker.setDepth(rel.y);

        // Pulsing glow
        this.tweens.add({
          targets: marker,
          scale: 1.05,
          alpha: { from: 0.7, to: 1.0 },
          yoyo: true,
          repeat: -1,
          duration: 900,
          ease: 'Sine.easeInOut',
        });
      }

      this.targets.push({
        id: `relic_${rel.id}`,
        kind: 'relic',
        name: rel.name,
        sub: 'Archäologischer Leitfund',
        x: rel.x,
        y: rel.y,
        minChapter: rel.unlockedChapter,
        relic: rel,
        actionTip: '[E] Fundstück bergen & untersuchen',
      });
    }

    // 3. Ressourcen-Hotspots
    for (const r of RESOURCE_NODES) {
      this.targets.push({
        id: `res_${r.id}`,
        kind: 'resource',
        name: r.name,
        sub: 'Rohstoffquelle',
        x: r.x,
        y: r.y,
        minChapter: 1,
        itemId: r.item as MedievalItemId,
        actionTip: '[E] Ernten & Sammeln',
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

    // 5. Falko Streichel-Ziel
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
  }

  private onGameStateChanged(): void {
    // Check chapter banner
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
    // 1. Movement Inputs (WASD, CursorKeys, TouchControls)
    let moveX = 0;
    let moveY = 0;

    const win = window as any;
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
      const speed = 90; // px / sec
      const vx = (moveX / len) * speed * (delta / 1000);
      const vy = (moveY / len) * speed * (delta / 1000);

      const nextX = Phaser.Math.Clamp(this.player.x + vx, 20, (this.mapW - 2) * 16);
      const nextY = Phaser.Math.Clamp(this.player.y + vy, 20, (this.mapH - 2) * 16);

      this.player.x = nextX;
      this.player.y = nextY;
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

    // 2. Subsystem Updates
    this.wildlifeManager.update(delta, this.player.x, this.player.y);
    this.livingWorldManager.update(delta);
    this.companionManager.update(this.player, this.targets, delta);

    // 3. Proximity Target & Quest Compass
    this.updateActiveTargetAndCompass();

    // 4. Handle Interaction Trigger [E]
    const ePressed = Phaser.Input.Keyboard.JustDown(this.wasd?.E) || (touch && touch.actionPressed);
    if (ePressed) {
      if (touch) touch.actionPressed = false;
      this.triggerInteraction();
    }
  }

  private updateActiveTargetAndCompass(): void {
    let closestTarget: InteractiveTarget | null = null;
    let minDist = 44; // Proximity threshold

    for (const t of this.targets) {
      if (t.minChapter > gameState.chapter) continue;

      // Falko Coords dynamisch abfragen
      const tx = t.kind === 'companion' && this.companionManager.sprite ? this.companionManager.sprite.x : t.x;
      const ty = t.kind === 'companion' && this.companionManager.sprite ? this.companionManager.sprite.y : t.y;

      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, tx, ty);
      if (d < minDist) {
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
      const sy = rect.top + ((ty - 24 - cam.worldView.y) / cam.worldView.height) * rect.height;

      this.labelDiv.style.left = `${sx}px`;
      this.labelDiv.style.top = `${sy}px`;
      this.labelDiv.innerHTML = `<strong>${this.activeTarget.name}</strong><br><span style="font-size:11px;color:#fde68a">${this.activeTarget.actionTip || '[E] Interagieren'}</span>`;
      this.labelDiv.style.display = 'block';
    } else if (this.labelDiv) {
      this.labelDiv.style.display = 'none';
    }

    // Quest-Radar / Compass zum aktuellen Kapitel-Mentor
    const curCh = MEDIEVAL_CHAPTERS.find((c) => c.id === gameState.chapter);
    if (curCh) {
      const dx = curCh.targetCoords.x - this.player.x;
      const dy = curCh.targetCoords.y - this.player.y;
      gameState.setCompass(curCh.targetCoords.name, dx, dy);
      gameState.activeObjectiveText = curCh.objective;
    }
  }

  private triggerInteraction(): void {
    if (!this.activeTarget) return;

    sound.click();

    // 1. Companion
    if (this.activeTarget.kind === 'companion') {
      this.companionManager.pet();
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
      gameState.discoverRelic(rel.id);
      sound.questStep();
      const win = window as any;
      if (win.__openArtifactInspector) {
        win.__openArtifactInspector(rel);
      }
      return;
    }

    // 4. Rohstoff ernten
    if (this.activeTarget.kind === 'resource' && this.activeTarget.itemId) {
      gameState.addInventory(this.activeTarget.itemId, 2);
      sound.questStep();
      const win = window as any;
      if (win.__showToast) {
        win.__showToast(`🌾 +2 ${MEDIEVAL_ITEMS[this.activeTarget.itemId]?.name || 'Rohstoff'} erhalten!`);
      }
      return;
    }

    // 5. Interaktive Stationen
    if (this.activeTarget.id === 'inter_schmiede_amboss') {
      const win = window as any;
      if (win.__toggleModal) win.__toggleModal('craft');
      return;
    }

    if (this.activeTarget.id === 'inter_kloster_kraeuter') {
      const win = window as any;
      if (win.__openStation) win.__openStation('station_kraeuter');
      return;
    }

    if (this.activeTarget.id === 'inter_burg_ruestung') {
      const win = window as any;
      if (win.__openStation) win.__openStation('station_ruestkammer');
      return;
    }
  }
}
