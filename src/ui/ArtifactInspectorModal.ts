import { MedievalRelic } from '../data/relics';
import { sound } from '../audio/sound';

export class ArtifactInspectorModal {
  private overlay: HTMLElement | null = null;
  private isBackSide = false;
  private isZoomed = false;

  public open(relic: MedievalRelic, onClose?: () => void): void {
    this.isBackSide = false;
    this.isZoomed = false;

    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.id = 'artifact-inspector-modal';
      this.overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(12, 8, 6, 0.88);
        backdrop-filter: blur(6px); z-index: 3500; display: flex;
        align-items: center; justify-content: center; padding: 16px;
        font-family: 'Cinzel', Georgia, system-ui, sans-serif;
      `;
      document.body.appendChild(this.overlay);
    }

    const render = () => {
      if (!this.overlay) return;
      const displayTitle = relic.name || 'Archäologisches Relikt';
      const iconUrl = relic.icon || '/assets/icons/relic_marker_glow.png';
      const dating = relic.era || 'Hochmittelalter';
      const location = relic.location || 'Burg Steinfels';
      const descText = this.isBackSide ? relic.descriptionBack : relic.descriptionFront;
      const fact = relic.didacticFact || '';

      this.overlay.innerHTML = `
        <div style="background: linear-gradient(145deg, #24160e, #140d08); border: 2px solid #d4af37; border-radius: 12px; max-width: 660px; width: 100%; color: #fef3c7; box-shadow: 0 20px 50px rgba(0,0,0,0.85); overflow: hidden;">
          <div style="background: rgba(212, 175, 55, 0.18); padding: 14px 20px; border-bottom: 1px solid rgba(212, 175, 55, 0.4); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #f59e0b; font-weight: bold;">🔍 Archäologischer 360°-Quelleninspektor</div>
              <div style="font-size: 17px; font-weight: bold; color: #fff; margin-top: 2px;">${displayTitle}</div>
            </div>
            <button id="relic-close-btn" style="background: transparent; border: none; color: #f59e0b; font-size: 24px; cursor: pointer; padding: 0 8px;">✕</button>
          </div>

          <div style="padding: 20px; max-height: 72vh; overflow-y: auto; font-family: 'Inter', system-ui, sans-serif;">
            <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px; background: rgba(0,0,0,0.35); padding: 16px; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.25);">
              <div style="flex-shrink: 0; text-align: center;">
                <div style="width: 100px; height: 100px; background: radial-gradient(circle, rgba(212,175,55,0.3) 0%, rgba(0,0,0,0.7) 70%); border: 2px solid #d4af37; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: transform 0.4s ease; transform: ${this.isBackSide ? 'rotateY(180deg)' : 'rotateY(0)'} scale(${this.isZoomed ? '1.4' : '1.0'});">
                  <img src="${iconUrl}" alt="${displayTitle}" style="width: 70px; height: 70px; object-fit: contain; image-rendering: pixelated;" />
                </div>
                <div style="font-size: 10px; color: #fbbf24; margin-top: 6px; font-weight: 600;">
                  ${this.isBackSide ? 'Rückseite / Detail' : 'Vorderseite / Fassung'}
                </div>
              </div>

              <div style="flex-grow: 1;">
                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                  <button id="relic-flip-btn" style="background: #3b2313; border: 1px solid #d4af37; color: #fde68a; font-size: 11px; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    🔄 Relikt um 180° drehen
                  </button>
                  <button id="relic-zoom-btn" style="background: #3b2313; border: 1px solid #d4af37; color: #fde68a; font-size: 11px; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    🔎 Lupe: ${this.isZoomed ? 'Zurücksetzen' : '1.4x Makro-Detail'}
                  </button>
                </div>
                <div style="font-size: 12px; color: #cbd5e1; line-height: 1.45;">
                  <strong>Fundort:</strong> ${location}<br />
                  <strong>Datierung:</strong> ${dating}
                </div>
              </div>
            </div>

            <div style="background: rgba(0,0,0,0.25); padding: 14px; border-radius: 6px; border-left: 3px solid #f59e0b; margin-bottom: 14px; font-size: 13px; line-height: 1.55; color: #f3f4f6;">
              <strong style="color: #fbbf24;">Material & Befund:</strong><br />
              ${descText}
            </div>

            ${
              fact
                ? `<div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 6px; padding: 12px; font-size: 12px; line-height: 1.5; color: #6ee7b7; margin-bottom: 16px;">
                    ${fact}
                  </div>`
                : ''
            }

            <div style="display: flex; justify-content: flex-end;">
              <button id="relic-done-btn" style="background: linear-gradient(180deg, #d97706, #b45309); border: 1px solid #fde68a; color: #fff; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                Untersuchung abschließen ✓
              </button>
            </div>
          </div>
        </div>
      `;

      this.overlay.querySelector('#relic-close-btn')?.addEventListener('click', () => {
        this.close();
        if (onClose) onClose();
      });

      this.overlay.querySelector('#relic-done-btn')?.addEventListener('click', () => {
        this.close();
        if (onClose) onClose();
      });

      this.overlay.querySelector('#relic-flip-btn')?.addEventListener('click', () => {
        sound.playSelect?.();
        this.isBackSide = !this.isBackSide;
        render();
      });

      this.overlay.querySelector('#relic-zoom-btn')?.addEventListener('click', () => {
        sound.playSelect?.();
        this.isZoomed = !this.isZoomed;
        render();
      });
    };

    render();
  }

  public close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
