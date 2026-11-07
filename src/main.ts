import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { UIScene } from './scenes/UIScene';
import { WorldScene } from './scenes/WorldScene';
import { InteriorScene } from './scenes/InteriorScene';
import { gameState } from './systems/GameState';
import { CHAPTERS } from './data/chapters';
import { RELICS } from './data/relics';
import { STATIONS } from './data/stations';

export const GAME_W = 480;
export const GAME_H = 270;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_W,
  height: GAME_H,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#100c08',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, WorldScene, InteriorScene, UIScene],
};

const game = new Phaser.Game(config);

// Expose globally for browser verification and classroom test scripts
(window as any).__GAME__ = game;
(window as any).__MED_GAME__ = game;
(window as any).__STATE__ = gameState;
(window as any).__CHAPTERS__ = CHAPTERS;
(window as any).__RELICS__ = RELICS;
(window as any).__STATIONS__ = STATIONS;
