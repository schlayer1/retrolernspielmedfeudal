import Phaser from 'phaser';
import { gameState } from '../systems/GameState';
import { sound } from '../audio/sound';
import { STATIONS } from '../data/stations';
import { MEDIEVAL_RELICS } from '../data/relics';

export type InteriorRoomId =
  | 'burgsaal_palas'
  | 'klosterapotheke_skriptorium'
  | 'dorfschmiede_hufeisen'
  | 'zunftstube_rathaus';

export interface InteriorInitData {
  buildingId?: InteriorRoomId;
  roomId?: InteriorRoomId;
  buildingName?: string;
  title?: string;
  subtitle?: string;
  mentorId?: string;
  mentorName?: string;
  returnX: number;
  returnY: number;
}

interface Hotspot {
  id: string;
  x: number;
  y: number;
  label: string;
  speaker: string;
  text: string;
  action?: () => void;
}

export class InteriorScene extends Phaser.Scene {
  private initData!: InteriorInitData;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    ESC: Phaser.Input.Keyboard.Key;
  };
  private hotspots: Hotspot[] = [];
  private exitMat!: { x: number; y: number; w: number; h: number };
  private isExiting = false;
  private stepCooldown = 0;
  private domOverlay?: HTMLDivElement;

  constructor() {
    super({ key: 'InteriorScene' });
  }

  public init(data: InteriorInitData): void {
    const bId = (data?.roomId || data?.buildingId || 'burgsaal_palas') as InteriorRoomId;
    this.initData = {
      buildingId: bId,
      roomId: bId,
      title: data?.title || this.getRoomTitle(bId),
      subtitle: data?.subtitle || 'Europäisches Mittelalter · Feudale Lebenswelt',
      returnX: data?.returnX ?? 22 * 16,
      returnY: data?.returnY ?? 32 * 16,
    };
    this.hotspots = [];
    this.isExiting = false;
  }

  public create(): void {
    const ROOM_W = 352;
    const ROOM_H = 208;
    const CX = 240;
    const CY = 140;
    const LEFT = CX - ROOM_W / 2;
    const TOP = CY - ROOM_H / 2;

    this.cameras.main.setBackgroundColor('#100b07');

    document.getElementById('interior-dom-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'interior-dom-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:25;font-family:system-ui,sans-serif;';
    document.body.appendChild(overlay);
    this.domOverlay = overlay;

    const addDomTag = (
      rx: number,
      ry: number,
      text: string,
      bg = 'rgba(28,18,10,0.92)',
      border = '#d4af37',
      color = '#fef08a'
    ) => {
      const el = document.createElement('div');
      const pctX = (rx / 480) * 100;
      const pctY = (ry / 270) * 100;
      el.style.cssText = `
        position:absolute;left:${pctX}%;top:${pctY}%;transform:translate(-50%,-50%);
        background:${bg};border:1.5px solid ${border};color:${color};
        padding:2px 8px;border-radius:999px;font-size:11px;font-weight:800;
        white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.7);
      `;
      el.textContent = text;
      overlay.appendChild(el);
    };

    // Header Tag
    addDomTag(240, 18, `🏛️ ${this.initData.title}`, 'rgba(20,12,6,0.95)', '#f59e0b', '#fff');

    // Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        ESC: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      };
    }

    // Floor rendering
    const g = this.add.graphics();
    g.fillStyle(0x1a120b, 1.0);
    g.fillRect(LEFT - 12, TOP - 12, ROOM_W + 24, ROOM_H + 24);

    // Stone or wooden floor planks
    const isStone = this.initData.roomId === 'burgsaal_palas' || this.initData.roomId === 'klosterapotheke_skriptorium';
    g.fillStyle(isStone ? 0x3d352e : 0x4a2e18, 1.0);
    g.fillRect(LEFT, TOP, ROOM_W, ROOM_H);

    // Tile pattern
    g.lineStyle(1, isStone ? 0x27221d : 0x341d0e, 0.7);
    for (let x = LEFT; x <= LEFT + ROOM_W; x += 16) {
      g.lineBetween(x, TOP, x, TOP + ROOM_H);
    }
    for (let y = TOP; y <= TOP + ROOM_H; y += 16) {
      g.lineBetween(LEFT, y, LEFT + ROOM_W, y);
    }

    // Walls
    g.fillStyle(0x1c140d, 1.0);
    g.fillRect(LEFT, TOP, ROOM_W, 24);
    g.lineStyle(2, 0xd4af37, 0.85);
    g.strokeRect(LEFT, TOP, ROOM_W, ROOM_H);

    // Exit mat at bottom
    this.exitMat = { x: CX, y: TOP + ROOM_H - 12, w: 48, h: 20 };
    g.fillStyle(0x854d0e, 0.9);
    g.fillRect(this.exitMat.x - 24, this.exitMat.y - 10, 48, 20);
    addDomTag(this.exitMat.x, this.exitMat.y, '🚪 Auszug [E / S]', 'rgba(28,18,10,0.92)', '#f59e0b', '#fde68a');

    // Build specific room props
    this.buildRoom(this.initData.roomId || 'burgsaal_palas', LEFT, TOP, ROOM_W, ROOM_H, addDomTag);

    // Spawn Player
    this.player = this.physics.add.sprite(CX, TOP + ROOM_H - 36, 'character', 0);
    this.player.setOrigin(0.5, 0.9);
    this.player.setScale(1.0);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(LEFT + 8, TOP + 26, ROOM_W - 16, ROOM_H - 32);

    this.cameras.main.setBounds(0, 0, 480, 270);
    this.cameras.main.centerOn(240, 135);
    this.cameras.main.setZoom(1.0);

    sound.door?.();
  }

  private buildRoom(
    roomId: InteriorRoomId,
    left: number,
    top: number,
    w: number,
    h: number,
    addDomTag: Function
  ): void {
    const cx = left + w / 2;

    if (roomId === 'burgsaal_palas') {
      // 1. Thron des Grafen Eberhard
      addDomTag(cx, top + 42, '👑 Grafenthron & Kamin', 'rgba(45,20,10,0.95)', '#f59e0b', '#fef08a');
      this.hotspots.push({
        id: 'hs_thron',
        x: cx,
        y: top + 46,
        label: 'Grafenthron von Steinfels',
        speaker: 'Graf Eberhard',
        text: 'Von diesem Thron aus leite ich die Lehnsgerichte. Das Lehnswesen bindet Fürst und Vasall durch ewigen Treueid!',
      });

      // 2. Kaminfeuer
      const kaminX = left + 50;
      addDomTag(kaminX, top + 44, '🔥 Palas-Kamin', 'rgba(40,15,5,0.92)', '#ea580c', '#fdba74');
      this.hotspots.push({
        id: 'hs_kamin',
        x: kaminX,
        y: top + 48,
        label: 'Kaminfeuer',
        speaker: 'Burgkamin',
        text: 'Der Palas war das einzige dauerhaft beheizte Wohngebäude der Burg – der Sitz des Grafen und seiner Familie.',
      });

      // 3. Rüstungsständer
      const ruestX = left + w - 50;
      addDomTag(ruestX, top + 44, '🛡️ Ritterrüstung', 'rgba(25,25,35,0.92)', '#94a3b8', '#f8fafc');
      this.hotspots.push({
        id: 'hs_ruestung',
        x: ruestX,
        y: top + 48,
        label: 'Turnierharnisch',
        speaker: 'Ritter Wolfram',
        text: 'Topfhelm, Kettenhemd und Heroldsschild: Die Ausrüstung eines Ritters wog über 25 Kilogramm und kostete ein Vermögen.',
        action: () => {
          if (typeof (window as any).__openStation === 'function') {
            (window as any).__openStation('station_ruestkammer');
          }
        },
      });

      // 4. Prunktafel
      addDomTag(cx, top + 110, '🍷 Rittersaal-Tafel', 'rgba(30,18,10,0.9)', '#d4af37', '#fef3c7');
      this.hotspots.push({
        id: 'hs_tafel',
        x: cx,
        y: top + 114,
        label: 'Festtafel',
        speaker: 'Dame Mechthild',
        text: 'Nach der Jagd und auf Turnieren speisen hier die Vasallen. Minnesänger tragen ihre Lieder vor.',
      });
    } else if (roomId === 'klosterapotheke_skriptorium') {
      // 1. Skriptorium-Pult
      addDomTag(cx, top + 42, '📜 Skriptorium & Kodizes', 'rgba(20,25,35,0.95)', '#38bdf8', '#e0f2fe');
      this.hotspots.push({
        id: 'hs_skriptorium',
        x: cx,
        y: top + 46,
        label: 'Schreibpult des Skriptoriums',
        speaker: 'Bruder Anselm',
        text: 'Mit Gänsekiel und Gallustinte schreiben wir das Wort Gottes und antike Schriften auf Kalbspergament ab.',
        action: () => {
          if (typeof (window as any).__openArtifactInspector === 'function') {
            (window as any).__openArtifactInspector('relic_codex');
          }
        },
      });

      // 2. Kräutermörser
      const krautX = left + 60;
      addDomTag(krautX, top + 50, '🌿 Arznei-Mörser', 'rgba(15,35,20,0.92)', '#10b981', '#a7f3d0');
      this.hotspots.push({
        id: 'hs_apotheke',
        x: krautX,
        y: top + 54,
        label: 'Klosterapotheke',
        speaker: 'Infirmar Anselm',
        text: 'Hier zerstoßen wir Thymian, Ringelblume und Bienenwachs zu Wundsalben nach Hildegard von Bingen.',
        action: () => {
          if (typeof (window as any).__openStation === 'function') {
            (window as any).__openStation('station_kraeuter');
          }
        },
      });

      // 3. Bibliotheksregal
      const bibX = left + w - 60;
      addDomTag(bibX, top + 50, '📚 Klosterbibliothek', 'rgba(35,25,15,0.92)', '#d97706', '#fde68a');
      this.hotspots.push({
        id: 'hs_bib',
        x: bibX,
        y: top + 54,
        label: 'Bibliothek',
        speaker: 'Abt Benedikt',
        text: '"Ein Kloster ohne Bibliothek ist wie eine Festung ohne Rüstkammer." Wir hüten das Wissen des Abendlandes.',
      });
    } else if (roomId === 'dorfschmiede_hufeisen') {
      // 1. Esse & Rennofen
      addDomTag(cx, top + 42, '🔥 Rennofen & Schmiedeesse', 'rgba(45,15,5,0.95)', '#ea580c', '#fed7aa');
      this.hotspots.push({
        id: 'hs_esse',
        x: cx,
        y: top + 46,
        label: 'Schmiedeesse',
        speaker: 'Schmiedemeister Kunz',
        text: 'Im Holzkohlenfeuer glüht das Eisen bei über 1.000 Grad! Hier schmiede ich Pflugmesser, Äxte und Hufeisen.',
      });

      // 2. Amboss
      const ambossX = left + 65;
      addDomTag(ambossX, top + 85, '⚒️ Meisteramboss', 'rgba(30,30,35,0.92)', '#94a3b8', '#f1f5f9');
      this.hotspots.push({
        id: 'hs_amboss',
        x: ambossX,
        y: top + 89,
        label: 'Amboss',
        speaker: 'Schmiedeamboss',
        text: 'Schlag auf Schlag entsteht hier das Werkzeug der Bauern. Ohne das Eisen des Schmieds gäbe es keine Ernte.',
      });

      // 3. Hufeisen- & Pfluglager
      const lagerX = left + w - 65;
      addDomTag(lagerX, top + 85, '🌾 Pflugsech-Lager', 'rgba(35,25,10,0.92)', '#d97706', '#fef3c7');
      this.hotspots.push({
        id: 'hs_lager',
        x: lagerX,
        y: top + 89,
        label: 'Pfluglager',
        speaker: 'Bauer Walther',
        text: 'Das eiserne Pflugmesser schnitt dichte Wurzelböden senkrecht auf – der Kern der mittelalterlichen Agrarrevolution.',
        action: () => {
          if (typeof (window as any).__openArtifactInspector === 'function') {
            (window as any).__openArtifactInspector('relic_pflugmesser');
          }
        },
      });
    } else {
      // zunftstube_rathaus
      // 1. Zunftwaage
      addDomTag(cx, top + 42, '⚖️ Zunft- & Silberwaage', 'rgba(35,25,10,0.95)', '#f59e0b', '#fef08a');
      this.hotspots.push({
        id: 'hs_waage',
        x: cx,
        y: top + 46,
        label: 'Eichwaage der Stadt',
        speaker: 'Kaufmann Godeke',
        text: 'Stadtluft macht frei nach Jahr und Tag! Die Zünfte wachen streng über Maße, Gewichte und Tuchqualitäten.',
        action: () => {
          if (typeof (window as any).__openStation === 'function') {
            (window as any).__openStation('station_zunft_waage');
          }
        },
      });

      // 2. Münztisch & Kölner Denare
      const muenzX = left + 65;
      addDomTag(muenzX, top + 85, '🪙 Münztisch (Denare)', 'rgba(30,25,40,0.92)', '#a855f7', '#f3e8ff');
      this.hotspots.push({
        id: 'hs_muenzen',
        x: muenzX,
        y: top + 89,
        label: 'Münztisch',
        speaker: 'Münzmeister',
        text: '240 Silberpfennige ergeben ein ganzes Pfund Silber. Münzgeld löste den Tauschhandel im Hochmittelalter ab.',
        action: () => {
          if (typeof (window as any).__openArtifactInspector === 'function') {
            (window as any).__openArtifactInspector('relic_silberdenar');
          }
        },
      });

      // 3. Zunftlade & Privilegien
      const ladeX = left + w - 65;
      addDomTag(ladeX, top + 85, '📜 Zunftordnung & Siegel', 'rgba(40,15,10,0.92)', '#ef4444', '#fee2e2');
      this.hotspots.push({
        id: 'hs_privilegien',
        x: ladeX,
        y: top + 89,
        label: 'Zunftlade',
        speaker: 'Zunftmeister',
        text: 'In der Zunftlade liegen die kaiserlichen Stadtrechte und Marktprivilegien verschlossen.',
      });
    }
  }

  private getRoomTitle(id: InteriorRoomId): string {
    switch (id) {
      case 'burgsaal_palas':
        return 'Palas & Rittersaal (Burg Steinfels)';
      case 'klosterapotheke_skriptorium':
        return 'Klosterapotheke & Skriptorium (St. Benedikt)';
      case 'dorfschmiede_hufeisen':
        return 'Dorfschmiede & Rennofen (Meierhof)';
      case 'zunftstube_rathaus':
        return 'Zunftstube & Tuchhalle (Marktplatz)';
      default:
        return 'Innenraum';
    }
  }

  public update(time: number, delta: number): void {
    if (this.isExiting) return;

    let vx = 0;
    let vy = 0;
    const speed = 120;

    if (this.cursors?.left.isDown || this.wasd?.A.isDown) vx -= speed;
    if (this.cursors?.right.isDown || this.wasd?.D.isDown) vx += speed;
    if (this.cursors?.up.isDown || this.wasd?.W.isDown) vy -= speed;
    if (this.cursors?.down.isDown || this.wasd?.S.isDown) vy += speed;

    this.player.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      this.stepCooldown -= delta;
      if (this.stepCooldown <= 0) {
        sound.step('stone');
        this.stepCooldown = 280;
      }
    }

    // Check exit
    const distToExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitMat.x, this.exitMat.y);
    if (distToExit < 24) {
      if (this.wasd?.E && Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
        this.exitToOverworld();
        return;
      }
      if (vy > 0 && this.player.y >= this.exitMat.y - 4) {
        this.exitToOverworld();
        return;
      }
    }

    // Check Hotspots with [E]
    if (this.wasd?.E && Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
      for (const hs of this.hotspots) {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, hs.x, hs.y);
        if (d < 36) {
          sound.playClick();
          if (hs.action) {
            hs.action();
          } else {
            this.showDialog(hs.speaker, hs.text);
          }
          return;
        }
      }
    }

    if (this.wasd?.ESC && Phaser.Input.Keyboard.JustDown(this.wasd.ESC)) {
      this.exitToOverworld();
    }
  }

  private showDialog(speaker: string, text: string): void {
    document.getElementById('interior-dialog-bubble')?.remove();
    const b = document.createElement('div');
    b.id = 'interior-dialog-bubble';
    b.style.cssText = `
      position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
      background:rgba(20,12,6,0.96);border:2px solid #d4af37;border-radius:10px;
      padding:12px 18px;max-width:440px;color:#fef3c7;box-shadow:0 10px 30px rgba(0,0,0,0.85);
      z-index:3000;font-family:'Inter',system-ui,sans-serif;pointer-events:auto;
    `;
    b.innerHTML = `
      <div style="font-weight:bold;color:#f59e0b;font-size:13px;margin-bottom:4px;">💬 ${speaker}</div>
      <div style="font-size:13px;line-height:1.45;color:#f3f4f6;">${text}</div>
      <div style="text-align:right;margin-top:8px;">
        <button id="close-bubble-btn" style="background:#d97706;border:none;color:#fff;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:bold;cursor:pointer;">Weiter (E)</button>
      </div>
    `;
    document.body.appendChild(b);
    b.querySelector('#close-bubble-btn')?.addEventListener('click', () => b.remove());
  }

  public exitToOverworld(): void {
    if (this.isExiting) return;
    this.isExiting = true;
    document.getElementById('interior-dialog-bubble')?.remove();
    this.domOverlay?.remove();
    sound.door?.();

    gameState.playerX = this.initData.returnX;
    gameState.playerY = this.initData.returnY;

    this.cameras.main.fade(300, 16, 11, 7, false, (_cam: any, progress: number) => {
      if (progress >= 1) {
        this.scene.stop('InteriorScene');
        this.scene.resume('WorldScene');
        const world = this.scene.get('WorldScene') as any;
        if (world && world.player) {
          world.player.setPosition(this.initData.returnX, this.initData.returnY);
        }
      }
    });
  }
}
