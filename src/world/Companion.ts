import Phaser from 'phaser';

export class CompanionManager {
  private scene: Phaser.Scene;
  public sprite: Phaser.GameObjects.Sprite | null = null;
  public isUnlocked = false;
  private state: 'following' | 'idle' | 'alert' | 'petting' = 'following';
  private idleTimer = 0;
  private alertCooldown = 0;
  private emoteDiv: HTMLElement | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public unlock(startX: number, startY: number): void {
    if (this.isUnlocked && this.sprite) return;
    this.isUnlocked = true;

    this.sprite = this.scene.add.sprite(startX, startY, 'farm_dog_idle', 0);
    this.sprite.setOrigin(0.5, 0.85);
    this.sprite.setScale(1.0);
    this.sprite.setDepth(startY);

    // Klick-Interaktion zum Streicheln
    this.sprite.setInteractive({ useHandCursor: true });
    this.sprite.on('pointerdown', () => this.pet());

    if (this.scene.anims.exists('dog-idle')) {
      this.sprite.play('dog-idle');
    }

    console.log('🐾 Falko der Hofhund schließt sich treu an!');
  }

  public update(player: Phaser.GameObjects.Sprite, targets: any[], deltaMs: number): void {
    if (!this.isUnlocked || !this.sprite) return;

    const dog = this.sprite;
    const distToPlayer = Phaser.Math.Distance.Between(dog.x, dog.y, player.x, player.y);

    if (this.alertCooldown > 0) this.alertCooldown -= deltaMs;

    // 1. Secret-of-Evermore Spürsinn (< 110px) zu unentdeckten Relikten
    if (this.alertCooldown <= 0 && this.state !== 'petting') {
      for (const t of targets) {
        if (!t.discovered && t.kind === 'relic') {
          const tx = t.x ?? t.sprite?.x;
          const ty = t.y ?? t.sprite?.y;
          if (tx !== undefined && ty !== undefined) {
            const distToTarget = Phaser.Math.Distance.Between(dog.x, dog.y, tx, ty);
            if (distToTarget < 90) {
              this.triggerAlert(t, tx, ty);
              return;
            }
          }
        }
      }
    }

    if (this.state === 'petting') return;

    // 2. Folgen (Tethered Following)
    if (distToPlayer > 32) {
      this.state = 'following';
      const angle = Phaser.Math.Angle.Between(dog.x, dog.y, player.x, player.y);
      const speed = distToPlayer > 80 ? 110 : 70;
      dog.x += Math.cos(angle) * speed * (deltaMs / 1000);
      dog.y += Math.sin(angle) * speed * (deltaMs / 1000);

      dog.setFlipX(Math.cos(angle) < 0);
      if (this.scene.anims.exists('dog-walk')) {
        dog.play('dog-walk', true);
      }
      dog.setDepth(dog.y);
      this.idleTimer = 0;
    } else {
      // In Ruhezone
      this.idleTimer += deltaMs;
      if (this.idleTimer > 2000 && this.state !== 'idle') {
        this.state = 'idle';
        if (this.scene.anims.exists('dog-idle')) {
          dog.play('dog-idle', true);
        }
      }
    }

    // Emote-Position synchronisieren
    this.updateEmotePosition();
  }

  public pet(): void {
    if (!this.sprite) return;
    this.state = 'petting';

    // Sound
    const win = window as any;
    if (win.__gameSound && win.__gameSound.pet) {
      win.__gameSound.pet();
    }

    this.showEmote('❤️ Wuff!');

    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 1.15,
      yoyo: true,
      duration: 180,
      repeat: 2,
      onComplete: () => {
        this.state = 'following';
      },
    });
  }

  private triggerAlert(target: any, tx: number, ty: number): void {
    if (!this.sprite) return;
    this.state = 'alert';
    this.alertCooldown = 12000;

    // Dog läuft kurz in Richtung Relikt
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, tx, ty);
    this.sprite.setFlipX(Math.cos(angle) < 0);
    this.showEmote('🐾 Wuff! Hier liegt etwas verborgen!');

    const win = window as any;
    if (win.__gameSound && win.__gameSound.questStep) {
      win.__gameSound.questStep();
    }
  }

  private showEmote(text: string): void {
    this.removeEmote();

    this.emoteDiv = document.createElement('div');
    this.emoteDiv.className = 'companion-emote-bubble';
    this.emoteDiv.innerText = text;
    this.emoteDiv.style.position = 'fixed';
    this.emoteDiv.style.transform = 'translate(-50%, -100%)';
    this.emoteDiv.style.background = 'rgba(26, 20, 16, 0.92)';
    this.emoteDiv.style.border = '1.5px solid #ffd86b';
    this.emoteDiv.style.borderRadius = '12px';
    this.emoteDiv.style.padding = '4px 10px';
    this.emoteDiv.style.fontSize = '12px';
    this.emoteDiv.style.fontWeight = 'bold';
    this.emoteDiv.style.color = '#fffbf0';
    this.emoteDiv.style.zIndex = '35';
    this.emoteDiv.style.pointerEvents = 'none';
    this.emoteDiv.style.boxShadow = '0 3px 8px rgba(0,0,0,0.45)';
    this.emoteDiv.style.transition = 'opacity 0.4s ease';

    document.body.appendChild(this.emoteDiv);
    this.updateEmotePosition();

    setTimeout(() => {
      if (this.emoteDiv) {
        this.emoteDiv.style.opacity = '0';
        setTimeout(() => this.removeEmote(), 400);
      }
    }, 2800);
  }

  private updateEmotePosition(): void {
    if (!this.emoteDiv || !this.sprite) return;
    const cam = this.scene.cameras.main;
    const canvas = this.scene.game.canvas;
    const rect = canvas.getBoundingClientRect();

    const sx = rect.left + ((this.sprite.x - cam.worldView.x) / cam.worldView.width) * rect.width;
    const sy = rect.top + ((this.sprite.y - 20 - cam.worldView.y) / cam.worldView.height) * rect.height;

    this.emoteDiv.style.left = `${sx}px`;
    this.emoteDiv.style.top = `${sy}px`;
  }

  private removeEmote(): void {
    if (this.emoteDiv && this.emoteDiv.parentNode) {
      this.emoteDiv.parentNode.removeChild(this.emoteDiv);
      this.emoteDiv = null;
    }
  }

  public destroy(): void {
    this.removeEmote();
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
