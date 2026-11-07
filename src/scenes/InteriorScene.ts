import Phaser from 'phaser';
import { gameState } from '../systems/GameState';
import { sound } from '../audio/sound';
import { MEDIEVAL_CHAPTERS, ChapterData } from '../data/chapters';

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
  radius: number;
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
  private propSprites: Phaser.GameObjects.Sprite[] = [];
  private animProps: Phaser.GameObjects.Sprite[] = [];
  private exitMat!: { x: number; y: number; w: number; h: number };
  private isExiting = false;
  private enterCooldownMs = 800;
  private stepCooldown = 0;
  private domOverlay?: HTMLDivElement;
  private promptEl?: HTMLDivElement;

  private facing: 'down' | 'up' | 'left' | 'right' = 'down';
  private mentorSprite: Phaser.Physics.Arcade.Sprite | null = null;

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
    this.propSprites = [];
    this.animProps = [];
    this.isExiting = false;
    this.enterCooldownMs = 800;
  }

  public create(): void {
    const ROOM_W = 384;
    const ROOM_H = 224;
    const CX = 240;
    const CY = 135;
    const LEFT = CX - ROOM_W / 2;
    const TOP = CY - ROOM_H / 2;

    this.cameras.main.setBackgroundColor('#0d0805');

    // Remove any leftover overlay
    document.getElementById('interior-dom-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'interior-dom-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:25;font-family:system-ui,sans-serif;';
    document.body.appendChild(overlay);
    this.domOverlay = overlay;

    // Room Header Badge (top center)
    const headerTag = document.createElement('div');
    headerTag.style.cssText = `
      position:absolute;left:50%;top:14px;transform:translateX(-50%);
      background:rgba(20,12,6,0.96);border:1.5px solid #f59e0b;color:#fef08a;
      padding:4px 14px;border-radius:999px;font-size:12px;font-weight:800;
      white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.8);letter-spacing:0.3px;
    `;
    headerTag.textContent = `🏛️ ${this.initData.title}`;
    overlay.appendChild(headerTag);

    // Dynamic Single Proximity Prompt (hidden until near something)
    const promptEl = document.createElement('div');
    promptEl.id = 'interior-prompt';
    promptEl.style.cssText = `
      position:absolute;display:none;transform:translate(-50%,-100%);
      background:rgba(20,12,6,0.96);border:1.5px solid #d4af37;color:#fef08a;
      padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;
      white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.85);z-index:30;
      pointer-events:none;animation:pulsePrompt 1.4s infinite ease-in-out;
    `;
    overlay.appendChild(promptEl);
    this.promptEl = promptEl;

    // Controls setup
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

    // 1. Authentic SNES Room Background Texture
    const bgTex = this.getRoomBackgroundTexture(this.initData.roomId);
    if (this.textures.exists(bgTex)) {
      const bgImg = this.add.image(CX, CY, bgTex);
      bgImg.setOrigin(0.5, 0.5);
      bgImg.setDisplaySize(ROOM_W, ROOM_H);
      bgImg.setDepth(1);
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x3a2416, 1.0);
      g.fillRect(LEFT, TOP, ROOM_W, ROOM_H);
    }

    // Room gold accent border
    const shadowG = this.add.graphics();
    shadowG.lineStyle(2, 0xd4af37, 0.85);
    shadowG.strokeRect(LEFT, TOP, ROOM_W, ROOM_H);
    shadowG.setDepth(30);

    // Exit mat at bottom
    this.exitMat = { x: CX, y: TOP + ROOM_H - 12, w: 48, h: 20 };
    const exitG = this.add.graphics();
    exitG.fillStyle(0x991b1b, 0.9);
    exitG.fillRect(this.exitMat.x - 24, this.exitMat.y - 10, 48, 20);
    exitG.lineStyle(1.5, 0xfbbf24, 1.0);
    exitG.strokeRect(this.exitMat.x - 24, this.exitMat.y - 10, 48, 20);
    exitG.setDepth(5);

    // 2. Build tangible physics props, animated fires & mentor
    this.buildRoom(this.initData.roomId || 'burgsaal_palas', LEFT, TOP, ROOM_W, ROOM_H);

    // 3. Spawn Player at safe distance from exit (54px away from mat)
    const charKey =
      gameState.gender === 'female' && this.textures.exists('character_female')
        ? 'character_female'
        : 'character';
    this.player = this.physics.add.sprite(CX, TOP + ROOM_H - 54, charKey, 0);
    this.player.setOrigin(0.5, 0.9);
    this.player.setScale(1.0);
    this.player.setDepth(20);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(LEFT + 14, TOP + 32, ROOM_W - 28, ROOM_H - 44);

    this.cameras.main.setBounds(0, 0, 480, 270);
    this.cameras.main.centerOn(240, 135);
    this.cameras.main.setZoom(1.0);

    sound.door?.();
  }

  private getRoomBackgroundTexture(id?: InteriorRoomId): string {
    switch (id) {
      case 'burgsaal_palas':
        return 'interior_tavern_day';
      case 'klosterapotheke_skriptorium':
        return 'interior_alchemist_day';
      case 'dorfschmiede_hufeisen':
        return 'interior_store_smithy_day';
      case 'zunftstube_rathaus':
        return 'interior_guild_library_day';
      default:
        return 'interior_tavern_day';
    }
  }

  private spawnProp(
    x: number,
    y: number,
    key: string,
    scale = 1.0,
    depth = 10,
    originX = 0.5,
    originY = 0.9
  ): Phaser.GameObjects.Sprite | null {
    if (this.textures.exists(key)) {
      const spr = this.add.sprite(x, y, key);
      spr.setOrigin(originX, originY);
      spr.setScale(scale);
      spr.setDepth(depth);
      this.propSprites.push(spr);
      return spr;
    }
    return null;
  }

  private registerHotspot(
    id: string,
    x: number,
    y: number,
    radius: number,
    label: string,
    speaker: string,
    text: string,
    action?: () => void
  ): void {
    this.hotspots.push({ id, x, y, radius, label, speaker, text, action });
  }

  private buildRoom(roomId: InteriorRoomId, left: number, top: number, w: number, h: number): void {
    const cx = left + w / 2;

    if (roomId === 'burgsaal_palas') {
      // 1. Mentor: Graf Eberhard von Steinfels
      this.spawnInteriorMentor(cx + 42, top + 64, 'npc_eberhard', 'npc_eberhard-idle-down');
      this.registerHotspot(
        'hs_eberhard',
        cx + 42,
        top + 64,
        42,
        '💬 [E] Graf Eberhard ansprechen',
        'Graf Eberhard von Steinfels',
        'Willkommen in meinem Palas! Als Lehnsherr garantiere ich Schutz und Schirm, doch fordere ich unbedingte Lehnstreue von allen Vasallen.',
        () => {
          const ch4 = MEDIEVAL_CHAPTERS.find((c) => c.id === 4);
          if (ch4 && typeof (window as any).__openMentorDialog === 'function') {
            (window as any).__openMentorDialog(ch4);
          } else {
            this.showDialog('Graf Eberhard von Steinfels', 'Das Lehnswesen bindet Kaiser, Fürst und Vasall durch ewigen Treueid!');
          }
        }
      );

      // 2. Thron des Grafen
      this.spawnProp(cx, top + 52, 'royal_throne_gold', 1.15, 8);
      this.registerHotspot(
        'hs_thron',
        cx,
        top + 52,
        40,
        '👑 [E] Grafenthron untersuchen',
        'Grafenthron von Steinfels',
        'Von diesem geschnitzten Eichenthron leitet Graf Eberhard die Lehnsgerichte. Hier schwören die Vasallen den Lehnseid auf das Evangelienbuch.'
      );

      // 3. Kaminfeuer animiert
      this.spawnAnimatedProp(left + 54, top + 52, 'interior-hearth-fire', 12, 1.0);
      this.registerHotspot(
        'hs_kamin',
        left + 54,
        top + 52,
        40,
        '🔥 [E] Palas-Kamin betrachten',
        'Burgkamin',
        'Der Palas war das einzige dauerhaft beheizte Wohngebäude der Burg – der Sitz des Grafen und seiner Familie in kalten Wintern.'
      );

      // 4. Wandfackeln
      this.spawnAnimatedProp(left + 28, top + 36, 'interior-wall-torch', 12, 1.0);
      this.spawnAnimatedProp(left + w - 28, top + 36, 'interior-wall-torch', 12, 1.0);

      // 5. Ritterrüstung & Harnisch
      this.spawnProp(left + w - 48, top + 56, 'knight_armor_suit', 1.15, 8);
      this.registerHotspot(
        'hs_ruestung',
        left + w - 48,
        top + 56,
        42,
        '🛡️ [E] Ritterharnisch prüfen (Station)',
        'Ritter Wolfram',
        'Topfhelm, Kettenhemd und Heroldsschild: Die Ausrüstung eines Ritters wog über 25 Kilogramm und kostete ein Vermögen.',
        () => {
          if (typeof (window as any).__openStation === 'function') {
            (window as any).__openStation('station_ruestkammer');
          }
        }
      );

      // 6. Waffenständer
      this.spawnProp(left + w - 84, top + 56, 'weapon_rack_new', 1.0, 8);
      this.registerHotspot(
        'hs_waffen',
        left + w - 84,
        top + 56,
        38,
        '⚔️ [E] Waffenständer betrachten',
        'Waffenkammer',
        'Lanzen, Turnierschwerter und Schilde mit dem Wappen von Steinfels – bereit für Wehr und Turnier.'
      );

      // 7. Schatzlade / Lehnsurkunde
      this.spawnProp(left + 82, top + 56, 'castle_chest_wood', 1.0, 8);
      this.registerHotspot(
        'hs_urkunde',
        left + 82,
        top + 56,
        40,
        '📜 [E] Lehnsurkunde einsehen (Relikt)',
        'Schatzlade des Grafen',
        'Hier liegen die besiegelten Lehnsverträge und Zehntregister der Grafschaft Steinfels.',
        () => {
          if (typeof (window as any).__openArtifactInspector === 'function') {
            (window as any).__openArtifactInspector('relic_lehnsurkunde');
          }
        }
      );

      // 8. Rittersaal-Tafel
      this.spawnProp(cx - 30, top + 115, 'table_food', 1.05, 8);
      this.registerHotspot(
        'hs_tafel',
        cx - 30,
        top + 115,
        42,
        '🍷 [E] Festtafel betrachten',
        'Dame Mechthild',
        'Nach der Jagd und auf Turnieren speisen hier die Vasallen. Minnesänger tragen ihre Lieder bei Met und Braten vor.'
      );

    } else if (roomId === 'klosterapotheke_skriptorium') {
      // 1. Mentor: Bruder Anselm
      this.spawnInteriorMentor(cx - 10, top + 66, 'npc_anselm', 'npc_anselm-idle-down');
      this.registerHotspot(
        'hs_anselm',
        cx - 10,
        top + 66,
        42,
        '💬 [E] Bruder Anselm ansprechen',
        'Bruder Anselm',
        'Pax vobiscum! Nach der Benediktsregel leben wir im Kloster: "Ora et labora" – Bete und arbeite!',
        () => {
          const ch3 = MEDIEVAL_CHAPTERS.find((c) => c.id === 3);
          if (ch3 && typeof (window as any).__openMentorDialog === 'function') {
            (window as any).__openMentorDialog(ch3);
          } else {
            this.showDialog('Bruder Anselm', 'Wir bewahren das antike Heilwissen und schreiben heilige Schriften von Hand ab.');
          }
        }
      );

      // 2. Skriptorium-Pult
      this.spawnProp(cx - 54, top + 56, 'monastery_scriptorium_desk', 1.15, 8);
      this.registerHotspot(
        'hs_skriptorium',
        cx - 54,
        top + 56,
        40,
        '📜 [E] Skriptorium untersuchen',
        'Schreibpult des Skriptoriums',
        'Mit Gänsekiel und Gallustinte schreiben die Mönche Bibeln und Chroniken auf mühsam geglättetes Pergament.'
      );

      // 3. Buchpult & Klosterkodex
      this.spawnProp(cx + 28, top + 56, 'monastery_book_lectern', 1.15, 8);
      this.registerHotspot(
        'hs_kodex',
        cx + 28,
        top + 56,
        42,
        '📖 [E] Klosterkodex aufschlagen (Relikt)',
        'Illuminierter Klosterkodex',
        'Ein prachtvoll illuminiertes Evangeliar mit Blattgold-Initialen und Lapislazuli-Pigmenten.',
        () => {
          if (typeof (window as any).__openArtifactInspector === 'function') {
            (window as any).__openArtifactInspector('relic_codex');
          }
        }
      );

      // 4. Gebetsaltar
      this.spawnProp(left + 50, top + 54, 'monastery_altar_shrine', 1.0, 8);
      this.registerHotspot(
        'hs_altar',
        left + 50,
        top + 54,
        38,
        '🕯️ [E] Gebetsaltar betrachten',
        'Klosteraltar',
        'Achtmal am Tag versammeln sich die Mönche zum Stundengebet – vom Morgengebet (Laudes) bis zur Nacht (Komplet).'
      );

      // 5. Arznei-Kräuterbeet & Mörser
      this.spawnProp(left + w - 48, top + 64, 'monastery_herbal_planter', 1.05, 8);
      this.registerHotspot(
        'hs_kraeuter',
        left + w - 48,
        top + 64,
        42,
        '🌿 [E] Heilkräuter mörsern (Station)',
        'Klosterapotheke',
        'Hier zerstoßen wir Thymian, Ringelblume und Salbei zu Wundsalben nach Hildegard von Bingen.',
        () => {
          if (typeof (window as any).__openStation === 'function') {
            (window as any).__openStation('station_kraeuter');
          }
        }
      );

      // 6. Kräuterkessel
      this.spawnProp(left + w - 84, top + 68, 'cauldron', 1.0, 8);
      this.registerHotspot(
        'hs_kessel',
        left + w - 84,
        top + 68,
        38,
        '🧪 [E] Salbenkessel betrachten',
        'Salbenkessel',
        'Im Kessel wird Bienenwachs aus der Kloster-Imkerei erwärmt, um heilende Balsame abzufüllen.'
      );

      // 7. Wandfackeln
      this.spawnAnimatedProp(left + 28, top + 36, 'interior-wall-torch', 12, 1.0);
      this.spawnAnimatedProp(left + w - 28, top + 36, 'interior-wall-torch', 12, 1.0);

    } else if (roomId === 'dorfschmiede_hufeisen') {
      // 1. Mentor: Baumeister Arnold / Schmied
      this.spawnInteriorMentor(cx + 40, top + 68, 'npc_arnold', 'npc_arnold-idle-down');
      this.registerHotspot(
        'hs_arnold',
        cx + 40,
        top + 68,
        42,
        '💬 [E] Baumeister Arnold ansprechen',
        'Baumeister Arnold',
        'Eisen und Stein sind das Fundament jeder Burg und jedes Pflugs! Ohne gutes Werkzeug verkümmert das Land.',
        () => {
          const ch5 = MEDIEVAL_CHAPTERS.find((c) => c.id === 5);
          if (ch5 && typeof (window as any).__openMentorDialog === 'function') {
            (window as any).__openMentorDialog(ch5);
          } else {
            this.showDialog('Baumeister Arnold', 'Der Schmied ist der angesehenste Handwerker im Dorf – er liefert Pflugmesser und Waffen.');
          }
        }
      );

      // 2. Schmiedeesse / Rennofen animiert
      this.spawnAnimatedProp(left + 60, top + 54, 'interior-forge-fire', 12, 1.0);
      this.registerHotspot(
        'hs_esse',
        left + 60,
        top + 54,
        40,
        '🔥 [E] Schmiedeesse & Rennofen betrachten',
        'Schmiedeesse',
        'Im Holzkohlenfeuer glüht das Eisen bei über 1.000 Grad! Hier schmelzen wir Raseneisenerz zu schmiedbarem Eisen.'
      );

      // 3. Meisteramboss (Interaktives Schmieden!)
      this.spawnProp(cx - 32, top + 75, 'anvil', 1.25, 8);
      this.registerHotspot(
        'hs_amboss',
        cx - 32,
        top + 75,
        44,
        '⚒️ [E] Meisteramboss nutzen (Schmieden)',
        'Dorfamboss',
        'Schlag auf Schlag entsteht hier das Werkzeug der Bauern. Ohne das Eisen des Schmieds gäbe es keine Agrarrevolution!',
        () => {
          if (typeof (window as any).__toggleModal === 'function') {
            (window as any).__toggleModal('C');
          }
        }
      );

      // 4. Holzlager
      this.spawnProp(left + 45, top + 105, 'woodpile', 1.0, 8);
      this.registerHotspot(
        'hs_holz',
        left + 45,
        top + 105,
        38,
        '🪵 [E] Holzlager untersuchen',
        'Holzlager',
        'Trockenes Eichen- und Buchenholz für das Essefeuer und für stabile Holzgriffe der Werkzeuge.'
      );

      // 5. Waffen- & Werkzeugständer
      this.spawnProp(left + w - 50, top + 60, 'weapon_rack_new', 1.0, 8);
      this.registerHotspot(
        'hs_werkzeug',
        left + w - 50,
        top + 60,
        38,
        '⚔️ [E] Werkzeuge & Waffen prüfen',
        'Werkzeugständer',
        'Sensen, Sicheln, eiserne Hauen und Hufeisen, frisch geschmiedet für die Feldarbeit.'
      );

      // 6. Pflugmesser-Lager (Relikt)
      this.spawnProp(left + w - 50, top + 105, 'castle_chest_wood', 1.0, 8);
      this.registerHotspot(
        'hs_pflugrelic',
        left + w - 50,
        top + 105,
        42,
        '🌾 [E] Pflugsech einsehen (Relikt)',
        'Pfluglager',
        'Das eiserne Pflugmesser schnitt dichte Wurzelböden senkrecht auf – der Schlüssel zu Rekordernten im Hochmittelalter.',
        () => {
          if (typeof (window as any).__openArtifactInspector === 'function') {
            (window as any).__openArtifactInspector('relic_pflugmesser');
          }
        }
      );

    } else {
      // zunftstube_rathaus
      // 1. Mentor: Ratsherr Jakob
      this.spawnInteriorMentor(cx + 10, top + 68, 'npc_jakob', 'npc_jakob-idle-down');
      this.registerHotspot(
        'hs_jakob',
        cx + 10,
        top + 68,
        42,
        '💬 [E] Ratsherr Jakob ansprechen',
        'Ratsherr Jakob von Köln',
        'Stadtluft macht frei nach Jahr und Tag! Hinter den Stadtmauern schützt das Stadtrecht die Freiheit der Kaufleute und Handwerker.',
        () => {
          const ch8 = MEDIEVAL_CHAPTERS.find((c) => c.id === 8);
          if (ch8 && typeof (window as any).__openMentorDialog === 'function') {
            (window as any).__openMentorDialog(ch8);
          } else {
            this.showDialog('Ratsherr Jakob', 'Die Zünfte regeln Ausbildung, Preise und Meisterstücke in der Stadt streng.');
          }
        }
      );

      // 2. Ratstisch & Stadtkarte
      this.spawnProp(cx - 30, top + 62, 'table_map', 1.15, 8);
      this.registerHotspot(
        'hs_ratstisch',
        cx - 30,
        top + 62,
        40,
        '⚖️ [E] Ratstisch & Stadtplan einsehen',
        'Ratstisch der Bürger',
        'Hier tagt der Rat der freien Stadt. Sie entscheiden über Marktordnungen, Stadtmauern und das Münzrecht.'
      );

      // 3. Zunftbank & Schreibpulte
      this.spawnProp(left + w - 55, top + 65, 'chairs_and_desks', 1.0, 8);
      this.registerHotspot(
        'hs_zunftbank',
        left + w - 55,
        top + 65,
        40,
        '📜 [E] Zunftordnung studieren',
        'Zunftschreibstube',
        'In den Zunftbüchern ist festgeschrieben: Wer das Meisterstück nicht vorweist, darf keine eigene Werkstatt eröffnen!'
      );

      // 4. Stadtkasse & Silberdenare (Relikt)
      this.spawnProp(left + 50, top + 56, 'castle_chest_wood', 1.0, 8);
      this.registerHotspot(
        'hs_silber',
        left + 50,
        top + 56,
        42,
        '🪙 [E] Silberdenare zählen (Relikt)',
        'Stadtkasse (Kölner Denare)',
        '240 Silberpfennige ergeben ein ganzes Pfund Feinsilber. Münzgeld verdrängte den Naturalientausch.',
        () => {
          if (typeof (window as any).__openArtifactInspector === 'function') {
            (window as any).__openArtifactInspector('relic_silberdenar');
          }
        }
      );

      // 5. Wandfackeln
      this.spawnAnimatedProp(left + 28, top + 36, 'interior-wall-torch', 12, 1.0);
      this.spawnAnimatedProp(left + w - 28, top + 36, 'interior-wall-torch', 12, 1.0);
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

  private spawnInteriorMentor(x: number, y: number, texKey: string, idleAnim: string): void {
    if (this.textures.exists(texKey)) {
      this.mentorSprite = this.physics.add.sprite(x, y, texKey, 0);
      this.mentorSprite.setOrigin(0.5, 0.9);
      this.mentorSprite.setScale(1.0);
      this.mentorSprite.setDepth(15);
      if (this.anims.exists(idleAnim)) {
        this.mentorSprite.play(idleAnim, true);
      }
    }
  }

  private spawnAnimatedProp(x: number, y: number, animKey: string, depth = 10, scale = 1.0): void {
    if (this.anims.exists(animKey)) {
      const spr = this.add.sprite(x, y, animKey);
      spr.play(animKey, true);
      spr.setDepth(depth);
      spr.setScale(scale);
      this.animProps.push(spr);
    }
  }

  public update(time: number, delta: number): void {
    if (this.isExiting) return;

    if (this.enterCooldownMs > 0) {
      this.enterCooldownMs -= delta;
    }

    let vx = 0;
    let vy = 0;
    const speed = 120;

    if (this.cursors?.left.isDown || this.wasd?.A.isDown) vx -= speed;
    if (this.cursors?.right.isDown || this.wasd?.D.isDown) vx += speed;
    if (this.cursors?.up.isDown || this.wasd?.W.isDown) vy -= speed;
    if (this.cursors?.down.isDown || this.wasd?.S.isDown) vy += speed;

    this.player.setVelocity(vx, vy);

    this.player.setFlipX(false);
    const g = gameState.gender;
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.facing = vx > 0 ? 'right' : 'left';
      } else {
        this.facing = vy > 0 ? 'down' : 'up';
      }
      const aKey = this.anims.exists(`walk-${g}-${this.facing}`)
        ? `walk-${g}-${this.facing}`
        : `walk-${this.facing}`;
      this.player.play(aKey, true);

      this.stepCooldown -= delta;
      if (this.stepCooldown <= 0) {
        sound.step('stone');
        this.stepCooldown = 280;
      }
    } else {
      const idleKey = `idle-${g}-${this.facing}`;
      if (this.anims.exists(idleKey)) {
        this.player.play(idleKey, true);
      } else {
        this.player.stop();
        if (this.facing === 'down') this.player.setFrame(0);
        else if (this.facing === 'right') this.player.setFrame(17);
        else if (this.facing === 'up') this.player.setFrame(34);
        else if (this.facing === 'left') this.player.setFrame(51);
        else this.player.setFrame(0);
      }
    }

    // 1. Check Exit Mat Proximity & Exit Trigger
    const distToExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitMat.x, this.exitMat.y);
    const isAtExitMat = distToExit < 24 && this.player.y >= this.exitMat.y - 14;

    if (isAtExitMat && this.enterCooldownMs <= 0) {
      if (this.promptEl) {
        this.promptEl.style.display = 'block';
        this.promptEl.style.left = `${(this.exitMat.x / 480) * 100}%`;
        this.promptEl.style.top = `${((this.exitMat.y - 18) / 270) * 100}%`;
        this.promptEl.textContent = '🚪 [E / S] Raum verlassen';
      }

      if (this.wasd?.E && Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
        this.exitToOverworld();
        return;
      }
      if (vy > 0 && this.player.y >= this.exitMat.y - 4) {
        this.exitToOverworld();
        return;
      }
      return;
    }

    // 2. Check Nearest Interactive Hotspot
    let nearestHotspot: Hotspot | null = null;
    let minDistance = 999;

    for (const hs of this.hotspots) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, hs.x, hs.y);
      if (d < hs.radius && d < minDistance) {
        minDistance = d;
        nearestHotspot = hs;
      }
    }

    if (nearestHotspot) {
      if (this.promptEl) {
        this.promptEl.style.display = 'block';
        this.promptEl.style.left = `${(nearestHotspot.x / 480) * 100}%`;
        this.promptEl.style.top = `${((nearestHotspot.y - 20) / 270) * 100}%`;
        this.promptEl.textContent = nearestHotspot.label;
      }

      if (this.wasd?.E && Phaser.Input.Keyboard.JustDown(this.wasd.E)) {
        sound.click();
        if (nearestHotspot.action) {
          nearestHotspot.action();
        } else {
          this.showDialog(nearestHotspot.speaker, nearestHotspot.text);
        }
        return;
      }
    } else {
      if (this.promptEl) {
        this.promptEl.style.display = 'none';
      }
    }

    // 3. ESC exits room safely after cooldown
    if (this.wasd?.ESC && Phaser.Input.Keyboard.JustDown(this.wasd.ESC) && this.enterCooldownMs <= 0) {
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
