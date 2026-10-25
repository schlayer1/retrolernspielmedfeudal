import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { UIScene } from './scenes/UIScene';
import { WorldScene } from './scenes/WorldScene';
import { gameState } from './systems/GameState';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#100c08',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, WorldScene, UIScene],
};

const game = new Phaser.Game(config);

// Expose globally for browser verification and classroom test scripts
(window as any).__GAME__ = game;
(window as any).__STATE__ = gameState;
