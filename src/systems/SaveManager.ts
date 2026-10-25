import { MedievalItemId } from '../data/items';

export type PlayerRole = 'knappe' | 'bauer' | 'skriptor';
export type PlayerGender = 'male' | 'female';

export interface SaveData {
  chapter: number;
  maxUnlockedChapter: number;
  completedChapters: number[];
  inventory: Partial<Record<MedievalItemId, number>>;
  craftedOnce: MedievalItemId[];
  builtBuildings: string[];
  playerX: number;
  playerY: number;
  quizPerfect: number[];
  gender: PlayerGender;
  role: PlayerRole;
  discoveredRelics: string[];
  lexiconRead: string[];
  playerName: string;
  playTimeSeconds: number;
  walkedDistanceMeters?: number;
  storyFlags?: Record<string, boolean>;
  dilemmaSummary?: string;
}

const STORAGE_KEY = 'retro_save_medieval_feudal';

export class SaveManager {
  static save(data: SaveData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
  }

  static load(): SaveData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
