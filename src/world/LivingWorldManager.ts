import Phaser from 'phaser';

export interface FireSource {
  x: number;
  y: number;
  hasSmoke: boolean;
  smokeRate?: number;
  glowRadius?: number;
  glowColor?: number;
}

export interface ResourceHotspot {
  x: number;
  y: number;
  lastSparkle?: number;
  sparkleInterval?: number;
}

export class LivingWorldManager {
  private scene: Phaser.Scene;
  private floraSprites: (Phaser.GameObjects.Sprite | Phaser.GameObjects.Image)[] = [];
  private bannerSprites: Phaser.GameObjects.Image[] = [];
  private fireSources: FireSource[] = [];
  private fireGlows: Phaser.GameObjects.Arc[] = [];
  private smokeParticles: Phaser.GameObjects.Arc[] = [];
  private waterRipples: Phaser.GameObjects.Rectangle[] = [];
  private resourceSpots: ResourceHotspot[] = [];

  // Wind state
  private smokeTimer = 0;
  private waterTimer = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // 1. FLORA & WIND
  public registerFlora(sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image | null): void {
    if (!sprite) return;
    this.floraSprites.push(sprite);

    const delay = Math.random() * 2500;
    const duration = 2400 + Math.random() * 1200;
    const maxAngle = 0.8 + Math.random() * 0.6;

    this.scene.tweens.add({
      targets: sprite,
      angle: { from: -maxAngle, to: maxAngle },
      duration,
      delay,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // 2. BANNER & FLAGS
  public registerBanner(sprite: Phaser.GameObjects.Image | null): void {
    if (!sprite) return;
    this.bannerSprites.push(sprite);

    this.scene.tweens.add({
      targets: sprite,
      angle: { from: -1.8, to: 1.8 },
      duration: 1600 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // 3. FIRE & SMOKE
  public registerFireSource(
    x: number,
    y: number,
    hasSmoke = true,
    glowRadius = 32,
    glowColor = 0xffa533
  ): void {
    const glow = this.scene.add
      .circle(x, y - 6, glowRadius, glowColor, 0.22)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(y - 2);

    this.fireGlows.push(glow);

    this.scene.tweens.add({
      targets: glow,
      scaleX: { from: 0.94, to: 1.06 },
      scaleY: { from: 0.92, to: 1.08 },
      alpha: { from: 0.16, to: 0.28 },
      duration: 130 + Math.random() * 80,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.fireSources.push({
      x,
      y,
      hasSmoke,
      smokeRate: 700 + Math.random() * 400,
      glowRadius,
      glowColor,
    });
  }

  // 4. WATER EFFECTS
  public initWaterEffects(riverMinX: number, riverMaxX: number, minY: number, maxY: number): void {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const rx = Phaser.Math.Between(riverMinX, riverMaxX);
      const ry = Phaser.Math.Between(minY, maxY);
      const w = Phaser.Math.Between(14, 28);
      const ripple = this.scene.add
        .rectangle(rx, ry, w, 2, 0xd8f0ff, 0.45)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(ry);

      this.scene.tweens.add({
        targets: ripple,
        alpha: { from: 0.1, to: 0.6 },
        scaleX: { from: 0.8, to: 1.2 },
        x: `+=${Phaser.Math.Between(-3, 3)}`,
        y: `+=${Phaser.Math.Between(6, 12)}`,
        duration: 1800 + Math.random() * 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.waterRipples.push(ripple);
    }
  }

  // 5. RESOURCE SPARKLES
  public registerResourceHotspot(x: number, y: number): void {
    this.resourceSpots.push({
      x,
      y,
      lastSparkle: 0,
      sparkleInterval: 3000 + Math.random() * 3000,
    });
  }

  public update(delta: number): void {
    this.smokeTimer += delta;
    this.waterTimer += delta;

    // Aufsteigender Rauch
    if (this.smokeTimer > 600) {
      this.smokeTimer = 0;
      for (const fs of this.fireSources) {
        if (!fs.hasSmoke) continue;
        if (Math.random() < 0.6) this.spawnSmokePuff(fs.x, fs.y);
      }
    }

    // Sparkles
    for (const spot of this.resourceSpots) {
      spot.lastSparkle = (spot.lastSparkle || 0) + delta;
      if (spot.lastSparkle > (spot.sparkleInterval || 4000)) {
        spot.lastSparkle = 0;
        this.spawnResourceSparkle(spot.x, spot.y);
      }
    }
  }

  private spawnSmokePuff(x: number, y: number): void {
    const startX = x + Phaser.Math.Between(-3, 3);
    const startY = y - 8;
    const smoke = this.scene.add
      .circle(startX, startY, Phaser.Math.Between(3, 5), 0xdddddd, 0.35)
      .setDepth(startY + 30);

    this.scene.tweens.add({
      targets: smoke,
      x: startX + Phaser.Math.Between(12, 22),
      y: startY - Phaser.Math.Between(32, 48),
      scale: 1.8,
      alpha: 0,
      duration: 1600,
      ease: 'Sine.easeOut',
      onComplete: () => {
        smoke.destroy();
      },
    });
  }

  private spawnResourceSparkle(x: number, y: number): void {
    const star = this.scene.add
      .text(x + Phaser.Math.Between(-8, 8), y - 16, '✦', {
        fontSize: '11px',
        color: '#fef08a',
      })
      .setOrigin(0.5)
      .setDepth(y + 20)
      .setAlpha(0.9);

    this.scene.tweens.add({
      targets: star,
      y: star.y - 14,
      alpha: 0,
      scale: 1.4,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => star.destroy(),
    });
  }
}
