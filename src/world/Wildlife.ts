import Phaser from 'phaser';

export type AnimalState = 'idle_breathe' | 'graze_eat' | 'wander_tether' | 'player_aware';

interface AnimalEntity {
  sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
  baseX: number;
  baseY: number;
  wanderRadius: number;
  speed: number;
  baseScale: number;
  state: AnimalState;
  stateTimer: number;
  targetX: number;
  targetY: number;
  facingRight: boolean;
  stepPhase: number;
  activeTween: Phaser.Tweens.Tween | null;
}

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Map obstacles to prevent animals from walking through walls, into fires or water
const BUILDING_OBSTACLES: BoundingBox[] = [
  // Bergfried & Palas
  { minX: 14 * 16, maxX: 26 * 16, minY: 10 * 16, maxY: 20 * 16 },
  // Burgtor
  { minX: 24 * 16, maxX: 32 * 16, minY: 26 * 16, maxY: 33 * 16 },
  // Kloster
  { minX: 72 * 16, maxX: 92 * 16, minY: 10 * 16, maxY: 24 * 16 },
  // Fronhof & Schmiede
  { minX: 14 * 16, maxX: 38 * 16, minY: 48 * 16, maxY: 56 * 16 },
  // Dorfgasthof & Hütten
  { minX: 18 * 16, maxX: 38 * 16, minY: 64 * 16, maxY: 74 * 16 },
  // Zehntscheune
  { minX: 62 * 16, maxX: 72 * 16, minY: 46 * 16, maxY: 54 * 16 },
  // Burgbach Flussbett (ohne Brücke)
  { minX: 49 * 16, maxX: 55 * 16, minY: 0, maxY: 36 * 16 },
  { minX: 49 * 16, maxX: 55 * 16, minY: 44 * 16, maxY: 80 * 16 },
];

export class WildlifeManager {
  private scene: Phaser.Scene;
  private animals: AnimalEntity[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public init(): void {
    // 1. Ritterpferde auf der Burgkoppel (Nordwest)
    this.spawnAnimal(34 * 16, 16 * 16, 'horse', 24, 12, 0.95);
    this.spawnAnimal(38 * 16, 20 * 16, 'horse', 20, 10, 0.95);

    // 2. Zugochsen & Jungkälber auf der Fronhofsweide (Südwest)
    this.spawnAnimal(22 * 16, 60 * 16, 'cow_brown', 24, 10, 1.0);
    this.spawnAnimal(26 * 16, 62 * 16, 'calf_brown', 18, 12, 0.85);

    // 3. Schafe & Lämmer auf der Allmendeweide (Südost)
    this.spawnAnimal(76 * 16, 68 * 16, 'sheep', 20, 13, 0.95);
    this.spawnAnimal(80 * 16, 70 * 16, 'sheep', 22, 12, 0.95);
    this.spawnAnimal(84 * 16, 68 * 16, 'sheep_baby', 16, 14, 0.85);

    // 4. Hofschweine bei der Zehntscheune
    this.spawnAnimal(70 * 16, 56 * 16, 'pig', 18, 12, 0.95);
    this.spawnAnimal(74 * 16, 58 * 16, 'piglet', 14, 14, 0.85);

    // 5. Hofhühner beim Meierhof
    this.spawnAnimal(16 * 16, 56 * 16, 'chicken_brown', 14, 15, 0.9);
    this.spawnAnimal(19 * 16, 58 * 16, 'chick_dark', 10, 16, 0.8);

    // 6. Enten auf dem Burgbach (Wasser)
    this.spawnDuck(52 * 16, 22 * 16, 16);
    this.spawnDuck(51 * 16, 32 * 16, 16);
    this.spawnDuck(52 * 16, 62 * 16, 16);
  }

  private isPointBlocked(x: number, y: number): boolean {
    for (const b of BUILDING_OBSTACLES) {
      if (x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY) {
        return true;
      }
    }
    return false;
  }

  private spawnAnimal(x: number, y: number, texKey: string, radius: number, speed: number, baseScale = 1.0): void {
    if (!this.scene.textures.exists(texKey)) return;
    try {
      const img = this.scene.add.sprite(x, y, texKey, 0);
      img.setOrigin(0.5, 0.85);
      img.setScale(baseScale);
      img.setDepth(y);

      const entity: AnimalEntity = {
        sprite: img,
        baseX: x,
        baseY: y,
        wanderRadius: radius,
        speed,
        baseScale,
        state: 'idle_breathe',
        stateTimer: 2000 + Math.random() * 3000,
        targetX: x,
        targetY: y,
        facingRight: Math.random() > 0.5,
        stepPhase: 0,
        activeTween: null,
      };

      this.animals.push(entity);
    } catch {
      // Ignoriere fehlende Sprites
    }
  }

  private spawnDuck(x: number, y: number, radius: number): void {
    if (!this.scene.textures.exists('duck')) return;
    try {
      const duck = this.scene.add.sprite(x, y, 'duck', 12);
      duck.setOrigin(0.5, 0.7);
      duck.setScale(0.9);
      duck.setDepth(y);

      const entity: AnimalEntity = {
        sprite: duck,
        baseX: x,
        baseY: y,
        wanderRadius: radius,
        speed: 8,
        baseScale: 0.9,
        state: 'wander_tether',
        stateTimer: 3000,
        targetX: x,
        targetY: y,
        facingRight: true,
        stepPhase: 0,
        activeTween: null,
      };

      this.animals.push(entity);
    } catch {
      // Ignore
    }
  }

  public update(delta: number, playerX: number, playerY: number): void {
    const dt = delta / 1000;

    for (const a of this.animals) {
      a.stateTimer -= delta;

      const dx = playerX - a.sprite.x;
      const dy = playerY - a.sprite.y;
      const distToPlayer = Math.hypot(dx, dy);

      // Player Proximity: Tier hält inne und schaut zum Spieler
      if (distToPlayer < 36 && a.state !== 'player_aware') {
        a.state = 'player_aware';
        a.stateTimer = 1800;
        if (a.activeTween) {
          a.activeTween.stop();
          a.activeTween = null;
        }
        a.facingRight = dx > 0;
        a.sprite.setScale((a.facingRight ? -1 : 1) * a.baseScale, a.baseScale);
      }

      if (a.state === 'player_aware') {
        if (a.stateTimer <= 0 || distToPlayer > 50) {
          a.state = 'idle_breathe';
          a.stateTimer = 2500;
        }
        continue;
      }

      // State Machine Transition
      if (a.stateTimer <= 0) {
        const roll = Math.random();
        if (roll < 0.4) {
          a.state = 'idle_breathe';
          a.stateTimer = 2500 + Math.random() * 3000;
        } else if (roll < 0.7) {
          a.state = 'graze_eat';
          a.stateTimer = 3000 + Math.random() * 2500;
          this.triggerGraze(a);
        } else {
          a.state = 'wander_tether';
          a.stateTimer = 2000 + Math.random() * 3000;
          this.pickNewTarget(a);
        }
      }

      // Wander Step
      if (a.state === 'wander_tether') {
        const tdx = a.targetX - a.sprite.x;
        const tdy = a.targetY - a.sprite.y;
        const distToTarget = Math.hypot(tdx, tdy);

        if (distToTarget > 2) {
          const stepDist = a.speed * dt;
          const nx = a.sprite.x + (tdx / distToTarget) * stepDist;
          const ny = a.sprite.y + (tdy / distToTarget) * stepDist;

          if (!this.isPointBlocked(nx, ny)) {
            a.sprite.x = nx;
            a.sprite.y = ny;
            a.sprite.setDepth(ny);
            a.facingRight = tdx > 0;
            a.sprite.setScale((a.facingRight ? -1 : 1) * a.baseScale, a.baseScale);

            // Sanftes Geh-Wippen
            a.stepPhase += dt * 10;
            a.sprite.y += Math.sin(a.stepPhase) * 0.25;
          } else {
            a.state = 'idle_breathe';
            a.stateTimer = 1500;
          }
        } else {
          a.state = 'idle_breathe';
          a.stateTimer = 2000;
        }
      }
    }
  }

  private pickNewTarget(a: AnimalEntity): void {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * a.wanderRadius;
    const candX = a.baseX + Math.cos(angle) * r;
    const candY = a.baseY + Math.sin(angle) * r;

    if (!this.isPointBlocked(candX, candY)) {
      a.targetX = candX;
      a.targetY = candY;
    } else {
      a.targetX = a.baseX;
      a.targetY = a.baseY;
    }
  }

  private triggerGraze(a: AnimalEntity): void {
    if (a.activeTween) a.activeTween.stop();
    a.activeTween = this.scene.tweens.add({
      targets: a.sprite,
      angle: a.facingRight ? -4 : 4,
      scaleY: a.baseScale * 0.95,
      yoyo: true,
      repeat: 3,
      duration: 600,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        a.sprite.angle = 0;
        a.sprite.setScale((a.facingRight ? -1 : 1) * a.baseScale, a.baseScale);
        a.activeTween = null;
      },
    });
  }
}
