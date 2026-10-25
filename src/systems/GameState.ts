import { MEDIEVAL_BUILDINGS, MEDIEVAL_ITEMS, MEDIEVAL_RECIPES, MedievalItemId } from '../data/items';
import { PlayerGender, PlayerRole, SaveData, SaveManager } from './SaveManager';

export interface RoleDefinition {
  id: PlayerRole;
  name: string;
  tribalTitle: string;
  description: string;
  bonusText: string;
  icon: string;
}

export const MEDIEVAL_ROLES: RoleDefinition[] = [
  {
    id: 'knappe',
    name: 'Schildknappe des Adels',
    tribalTitle: 'Knappe auf Burg Steinfels',
    description: 'Du wurdest von frühester Jugend an im Reiten, Waffendienst und höfischer Tugend geschult.',
    bonusText: '+1 Hufeisen, Rüstleder & Waffenkunde',
    icon: '/assets/icons/relic_ritterschild.png',
  },
  {
    id: 'bauer',
    name: 'Hofbauer & Meier-Gehilfe',
    tribalTitle: 'Meister der Scholle & Hufen',
    description: 'Du kennst den Rhythmus der drei Jahreszeiten, pflegst das Zugvieh und wendest den schweren Pflug.',
    bonusText: '+2 Saatgut (Roggen/Hafer) & Werkzeughandwerk',
    icon: '/assets/icons/relic_pflugmesser.png',
  },
  {
    id: 'skriptor',
    name: 'Klosterschüler & Skriptor',
    tribalTitle: 'Schreiber & Heiler des Konvents',
    description: 'Du liest und schreibst Latein, mischst Arzneien im Klostergarten und siegelst Lehnsurkunden.',
    bonusText: '+1 Pergament, Heilkräuter & Siegelwachs',
    icon: '/assets/icons/relic_lehnsurkunde.png',
  },
];

type Listener = () => void;

export class GameState {
  public chapter = 1;
  public maxUnlockedChapter = 1;
  public completedChapters = new Set<number>();
  public inventory: Partial<Record<MedievalItemId, number>> = {};
  public craftedOnce = new Set<MedievalItemId>();
  public builtBuildings = new Set<string>();
  public quizPerfect = new Set<number>();
  public discoveredRelics = new Set<string>();
  public lexiconRead = new Set<string>();
  public playerX = 22 * 16;
  public playerY = 56 * 16;
  public questCompleted = false;
  public gender: PlayerGender = 'male';
  public role: PlayerRole = 'bauer';
  public playerName = 'Konrad';
  public playTimeSeconds = 0;
  public walkedDistanceMeters = 0;
  public storyFlags: Record<string, boolean> = {};
  public dilemmaSummary = '';

  // Chapter 4-point gating criteria tracking
  public chapterObjectives: Record<number, boolean[]> = {
    1: [false, false, false, false],
    2: [false, false, false, false],
    3: [false, false, false, false],
    4: [false, false, false, false],
    5: [false, false, false, false],
    6: [false, false, false, false],
    7: [false, false, false, false],
    8: [false, false, false, false],
  };

  // Realtime Quest Compass / Radar
  public compassText = '';
  public activeObjectiveText = '';

  private listeners: Listener[] = [];

  constructor() {
    this.initDefaultInventory();
  }

  private initDefaultInventory(): void {
    this.inventory = {
      roggen_saat: 4,
      hafer_saat: 2,
      heuballen: 3,
      holz_balken: 3,
      wasser_eimer: 2,
    };
  }

  public subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public notify(): void {
    for (const fn of this.listeners) {
      fn();
    }
    this.autoSave();
  }

  public setObjectiveProgress(ch: number, index: number, done = true): void {
    if (!this.chapterObjectives[ch]) {
      this.chapterObjectives[ch] = [false, false, false, false];
    }
    if (this.chapterObjectives[ch][index] !== done) {
      this.chapterObjectives[ch][index] = done;
      this.notify();
    }
  }

  public isChapterObjectiveComplete(ch: number): boolean {
    const list = this.chapterObjectives[ch] || [];
    return list.length >= 4 && list.every((v) => v === true);
  }

  public setCompass(targetName: string, dx: number, dy: number): void {
    const distPx = Math.hypot(dx, dy);
    const meters = Math.max(2, Math.round(distPx / 8));
    if (distPx < 32) {
      this.compassText = `📍 Ziel erreicht: ${targetName} (drücke E)`;
      return;
    }
    const angle = Math.atan2(dy, dx) * (180 / Math.PI); // -180..180
    let dirStr = '→ Osten';
    if (angle >= -112.5 && angle < -67.5) dirStr = '↑ Norden';
    else if (angle >= -67.5 && angle < -22.5) dirStr = '↗ Nordosten';
    else if (angle >= -22.5 && angle < 22.5) dirStr = '→ Osten';
    else if (angle >= 22.5 && angle < 67.5) dirStr = '↘ Südosten';
    else if (angle >= 67.5 && angle < 112.5) dirStr = '↓ Süden';
    else if (angle >= 112.5 && angle < 157.5) dirStr = '↙ Südwesten';
    else if (angle >= -157.5 && angle < -112.5) dirStr = '↖ Nordwesten';
    else dirStr = '← Westen';

    this.compassText = `🧭 ${targetName}: ${dirStr} (${meters} m)`;
  }

  public addInventory(item: MedievalItemId, count = 1): void {
    this.inventory[item] = (this.inventory[item] || 0) + count;
    this.notify();
  }

  public removeInventory(item: MedievalItemId, count = 1): boolean {
    const cur = this.inventory[item] || 0;
    if (cur < count) return false;
    this.inventory[item] = cur - count;
    if (this.inventory[item]! <= 0) {
      delete this.inventory[item];
    }
    this.notify();
    return true;
  }

  public hasItems(req: Partial<Record<MedievalItemId, number>>): boolean {
    for (const [k, v] of Object.entries(req)) {
      if ((this.inventory[k as MedievalItemId] || 0) < (v || 0)) return false;
    }
    return true;
  }

  public craft(recipeId: string): boolean {
    const r = MEDIEVAL_RECIPES.find((x) => x.id === recipeId);
    if (!r) return false;
    if (!this.hasItems(r.cost)) return false;
    for (const [k, v] of Object.entries(r.cost)) {
      this.removeInventory(k as MedievalItemId, v || 0);
    }
    this.addInventory(r.result, r.resultAmount);
    this.craftedOnce.add(r.result);
    this.notify();
    return true;
  }

  public build(buildingId: string): boolean {
    const b = MEDIEVAL_BUILDINGS.find((x) => x.id === buildingId);
    if (!b) return false;
    if (this.builtBuildings.has(buildingId)) return false;
    if (!this.hasItems(b.cost)) return false;
    for (const [k, v] of Object.entries(b.cost)) {
      this.removeInventory(k as MedievalItemId, v || 0);
    }
    this.builtBuildings.add(buildingId);
    this.notify();
    return true;
  }

  public discoverRelic(id: string): void {
    if (!this.discoveredRelics.has(id)) {
      this.discoveredRelics.add(id);
      this.notify();
    }
  }

  public completeChapter(ch: number, quizScore: number): void {
    this.completedChapters.add(ch);
    if (quizScore >= 1) {
      this.quizPerfect.add(ch);
    }
    if (ch < 8) {
      this.chapter = ch + 1;
      this.maxUnlockedChapter = Math.max(this.maxUnlockedChapter, ch + 1);
    }
    this.notify();
  }

  public selectStartChapter(ch: number): void {
    this.chapter = ch;
    this.maxUnlockedChapter = Math.max(this.maxUnlockedChapter, ch);
    this.notify();
  }

  public getEpochenPunkte(): number {
    let score = this.completedChapters.size * 100;
    score += this.quizPerfect.size * 50;
    score += this.discoveredRelics.size * 40;
    score += this.builtBuildings.size * 30;
    score += this.craftedOnce.size * 20;
    return score;
  }

  public getChronistenRang(): { title: string; tier: 'Bronze' | 'Silber' | 'Gold' | 'Meister' } {
    const pts = this.getEpochenPunkte();
    if (pts >= 800) return { title: 'Großchronist des Reiches', tier: 'Meister' };
    if (pts >= 500) return { title: 'Gelehrter Burgvogt', tier: 'Gold' };
    if (pts >= 250) return { title: 'Rechtskundiger Schöffe', tier: 'Silber' };
    return { title: 'Höriger Hofgehilfe', tier: 'Bronze' };
  }

  public generateHefterCode(): string {
    const ch = String(this.chapter).padStart(2, '0');
    const roleCode = this.role === 'knappe' ? 'KN' : this.role === 'skriptor' ? 'SK' : 'BA';
    const relCount = String(this.discoveredRelics.size).padStart(2, '0');
    const pts = String(Math.min(999, this.getEpochenPunkte())).padStart(3, '0');
    return `MEDF-K${ch}-${roleCode}-${relCount}-${pts}`;
  }

  public loadFromHefterCode(code: string): boolean {
    const m = code.trim().toUpperCase().match(/^MEDF-K(\d{2})-([A-Z]{2})-(\d{2})-(\d{3})$/);
    if (!m) return false;
    const ch = parseInt(m[1], 10);
    if (ch >= 1 && ch <= 8) {
      this.chapter = ch;
      this.maxUnlockedChapter = Math.max(this.maxUnlockedChapter, ch);
      if (m[2] === 'KN') this.role = 'knappe';
      else if (m[2] === 'SK') this.role = 'skriptor';
      else this.role = 'bauer';
      this.notify();
      return true;
    }
    return false;
  }

  public autoSave(): void {
    const data: SaveData = {
      chapter: this.chapter,
      maxUnlockedChapter: this.maxUnlockedChapter,
      completedChapters: Array.from(this.completedChapters),
      inventory: this.inventory,
      craftedOnce: Array.from(this.craftedOnce),
      builtBuildings: Array.from(this.builtBuildings),
      playerX: this.playerX,
      playerY: this.playerY,
      quizPerfect: Array.from(this.quizPerfect),
      gender: this.gender,
      role: this.role,
      discoveredRelics: Array.from(this.discoveredRelics),
      lexiconRead: Array.from(this.lexiconRead),
      playerName: this.playerName,
      playTimeSeconds: this.playTimeSeconds,
      walkedDistanceMeters: this.walkedDistanceMeters,
      storyFlags: this.storyFlags,
      dilemmaSummary: this.dilemmaSummary,
    };
    SaveManager.save(data);
  }

  public loadSaved(): boolean {
    const s = SaveManager.load();
    if (!s) return false;
    this.chapter = s.chapter || 1;
    this.maxUnlockedChapter = s.maxUnlockedChapter || 1;
    this.completedChapters = new Set(s.completedChapters || []);
    this.inventory = s.inventory || {};
    this.craftedOnce = new Set(s.craftedOnce || []);
    this.builtBuildings = new Set(s.builtBuildings || []);
    this.playerX = s.playerX || 22 * 16;
    this.playerY = s.playerY || 56 * 16;
    this.quizPerfect = new Set(s.quizPerfect || []);
    this.gender = s.gender || 'male';
    this.role = s.role || 'bauer';
    this.discoveredRelics = new Set(s.discoveredRelics || []);
    this.lexiconRead = new Set(s.lexiconRead || []);
    this.playerName = s.playerName || (this.gender === 'female' ? 'Mathilda' : 'Konrad');
    this.playTimeSeconds = s.playTimeSeconds || 0;
    this.walkedDistanceMeters = s.walkedDistanceMeters || 0;
    this.storyFlags = s.storyFlags || {};
    this.dilemmaSummary = s.dilemmaSummary || '';
    return true;
  }
}

export const gameState = new GameState();
