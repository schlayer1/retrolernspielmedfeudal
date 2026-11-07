import { InteractiveStation } from '../data/stations';
import { gameState } from '../systems/GameState';
import { sound } from '../audio/sound';

export class StationModal {
  private overlay: HTMLElement | null = null;

  public open(station: InteractiveStation, onComplete?: () => void): void {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.id = 'station-modal';
      this.overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(14, 10, 8, 0.88);
        backdrop-filter: blur(5px); z-index: 3500; display: flex;
        align-items: center; justify-content: center; padding: 16px;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      document.body.appendChild(this.overlay);
    }

    const isDone = (gameState as any).completedStations?.includes(station.id);

    let interactionHtml = '';
    if (station.type === 'crop_rotation') {
      const fields = station.config.fields || [];
      interactionHtml = fields
        .map(
          (f: any) => `
        <div style="background: rgba(0,0,0,0.35); border: 1px solid #d97706; border-radius: 6px; padding: 10px; margin-bottom: 8px;">
          <div style="font-weight: bold; color: #fde68a; font-size: 13px;">${f.name}</div>
          <div style="color: #a7f3d0; font-size: 12px; margin-top: 4px;">✓ ${f.correctCrop}</div>
        </div>
      `
        )
        .join('');
    } else if (station.type === 'mortar_crafting') {
      const ings = station.config.ingredients || [];
      interactionHtml = ings
        .map(
          (ing: any) => `
        <div style="display: flex; justify-content: space-between; background: rgba(0,0,0,0.35); border: 1px solid #d97706; border-radius: 6px; padding: 8px 12px; margin-bottom: 6px;">
          <span style="color: #fde68a; font-size: 13px;">${ing.label}</span>
          <strong style="color: #fbbf24;">${ing.targetParts} Teile</strong>
        </div>
      `
        )
        .join('');
    } else if (station.type === 'symbol_decoder') {
      const syms = station.config.symbols || [];
      interactionHtml = syms
        .map(
          (s: any) => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.35); border: 1px solid #d97706; border-radius: 6px; padding: 8px 12px; margin-bottom: 6px;">
          <strong style="color: #fbbf24; font-size: 14px;">${s.symbol}</strong>
          <span style="color: #e5e7eb; font-size: 12px; max-width: 340px; text-align: right;">${s.meaning}</span>
        </div>
      `
        )
        .join('');
    } else if (station.type === 'scale_weighing') {
      interactionHtml = `
        <div style="background: rgba(0,0,0,0.35); border: 1px solid #d97706; border-radius: 6px; padding: 12px; text-align: center;">
          <div style="font-size: 28px; margin-bottom: 6px;">⚖️</div>
          <div style="color: #fde68a; font-size: 14px;">Zielgewicht: <strong>${station.config.targetWeight} ${station.config.unit}</strong></div>
          <div style="color: #9ca3af; font-size: 12px; margin-top: 4px;">Eichgewichte: ${(station.config.availableWeights || []).join(' • ')} Denare</div>
        </div>
      `;
    } else {
      const steps = station.config.steps || [];
      interactionHtml = steps
        .map(
          (st: string, i: number) => `
        <div style="background: rgba(0,0,0,0.35); border: 1px solid #d97706; border-radius: 6px; padding: 8px 12px; margin-bottom: 6px; color: #fde68a; font-size: 13px;">
          <strong>Schicht ${i + 1}:</strong> ${st}
        </div>
      `
        )
        .join('');
    }

    this.overlay.innerHTML = `
      <div style="background: linear-gradient(145deg, #24160e, #140d08); border: 2px solid #d97706; border-radius: 10px; max-width: 580px; width: 100%; color: #fef3c7; box-shadow: 0 20px 50px rgba(0,0,0,0.85); overflow: hidden;">
        <div style="background: rgba(217, 119, 6, 0.2); padding: 12px 16px; border-bottom: 1px solid rgba(217, 119, 6, 0.4); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #f59e0b; font-weight: bold;">Mitmach-Station · Europäisches Mittelalter</div>
            <div style="font-size: 16px; font-weight: bold; color: #fff;">${station.title}</div>
          </div>
          <button id="station-close-btn" style="background: transparent; border: none; color: #d97706; font-size: 20px; cursor: pointer; padding: 4px 8px;">✕</button>
        </div>
        <div style="padding: 16px; max-height: 70vh; overflow-y: auto;">
          <div style="color: #fbbf24; font-size: 13px; font-weight: 600; margin-bottom: 8px;">${station.subtitle}</div>
          <div style="color: #e5e7eb; font-size: 13px; line-height: 1.5; margin-bottom: 14px;">${station.description}</div>
          <div style="background: rgba(217, 119, 6, 0.1); border-left: 3px solid #d97706; padding: 8px 12px; margin-bottom: 14px; font-size: 12px; color: #fed7aa;">
            <strong>Anleitung:</strong> ${station.instruction}
          </div>
          <div style="margin-bottom: 16px;">
            ${interactionHtml}
          </div>
          <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 6px; padding: 10px; font-size: 12px; color: #6ee7b7; margin-bottom: 14px;">
            ✓ <strong>Historische Erkenntnis:</strong> ${station.successMessage}
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="station-complete-btn" style="background: #d97706; border: none; color: #fff; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
              ${isDone ? 'Erledigt ✓' : 'Station abschließen (+25 Lehns-Punkte)'}
            </button>
          </div>
        </div>
      </div>
    `;

    this.overlay.querySelector('#station-close-btn')?.addEventListener('click', () => {
      this.close();
      if (onComplete) onComplete();
    });

    this.overlay.querySelector('#station-complete-btn')?.addEventListener('click', () => {
      sound.playFanfare();
      if (!(gameState as any).completedStations) (gameState as any).completedStations = [];
      if (!(gameState as any).completedStations.includes(station.id)) {
        (gameState as any).completedStations.push(station.id);
      }
      if (typeof gameState.markLexiconRead === 'function') {
        gameState.markLexiconRead(station.lexiconUnlockId);
      }
      this.close();
      if (onComplete) onComplete();
    });
  }

  public close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
