import { DilemmaDef, DilemmaOption } from '../data/dilemmas';
import { sound } from '../audio/sound';

export class DilemmaModal {
  private el: HTMLElement;
  private currentDilemma: DilemmaDef | null = null;
  private onChosenCallback: ((opt: DilemmaOption) => void) | null = null;

  constructor() {
    const existing = document.getElementById('dilemma-modal');
    if (existing) {
      this.el = existing;
    } else {
      this.el = document.createElement('div');
      this.el.id = 'dilemma-modal';
      this.el.className = 'dilemma-overlay';
      this.el.style.display = 'none';
      document.body.appendChild(this.el);
    }
    this.injectStyles();
  }

  public open(dilemma: DilemmaDef, onChosen: (opt: DilemmaOption) => void): void {
    this.currentDilemma = dilemma;
    this.onChosenCallback = onChosen;
    this.render();
    this.el.style.display = 'flex';
  }

  public close(): void {
    this.el.style.display = 'none';
    this.currentDilemma = null;
  }

  private render(): void {
    if (!this.currentDilemma) return;
    const d = this.currentDilemma;

    this.el.innerHTML = `
      <div class="dilemma-card">
        <div class="dilemma-header">
          <span class="dilemma-badge">⚖️ ${d.councilTitle}</span>
          <span class="dilemma-speaker">Vorsitz: <strong>${d.mentorSpeaker}</strong></span>
        </div>
        <h2 class="dilemma-title">${d.conflictTitle}</h2>
        <div class="dilemma-body">
          <p class="dilemma-text">${d.conflictText}</p>
        </div>
        <div class="dilemma-prompt">📜 Dein Schiedsspruch als Chronist: Wie entscheidest du?</div>
        <div class="dilemma-options">
          ${d.options
            .map(
              (opt, i) => `
            <button class="dilemma-opt-btn" data-index="${i}">
              <div class="opt-head">
                <span class="opt-num">Option ${i + 1}</span>
                <strong class="opt-title">${opt.title}</strong>
              </div>
              <p class="opt-arg">„${opt.argumentText}“</p>
              <div class="opt-rewards">
                🎁 <strong>Ertrag für den Hof / die Burg:</strong> 
                ${Object.entries(opt.rewards)
                  .map(([k, v]) => `+${v} ${k.replace(/_/g, ' ')}`)
                  .join(', ')}
              </div>
            </button>
          `,
            )
            .join('')}
        </div>
      </div>
    `;

    this.el.querySelectorAll('.dilemma-opt-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).dataset.index || '0', 10);
        const opt = d.options[idx];
        this.selectOption(opt);
      });
    });
  }

  private selectOption(opt: DilemmaOption): void {
    try {
      sound.success();
    } catch {}

    this.el.innerHTML = `
      <div class="dilemma-card dilemma-feedback-card">
        <div class="dilemma-badge">⚖️ Schiedsspruch besiegelt!</div>
        <h2>${opt.title}</h2>
        <p class="feedback-desc">${opt.feedbackText}</p>
        <div class="reward-box">
          <h3>📦 Deinem Inventar hinzugefügt:</h3>
          <div class="reward-chips">
            ${Object.entries(opt.rewards)
              .map(
                ([k, v]) => `
              <span class="reward-chip">+${v} ${k.replace(/_/g, ' ')}</span>
            `,
              )
              .join('')}
          </div>
        </div>
        <button id="dilemma-confirm-btn" class="dilemma-btn-primary">Weiter zur Mission</button>
      </div>
    `;

    document.getElementById('dilemma-confirm-btn')?.addEventListener('click', () => {
      if (this.onChosenCallback) {
        this.onChosenCallback(opt);
      }
      this.close();
    });
  }

  private injectStyles(): void {
    if (document.getElementById('dilemma-styles')) return;

    const style = document.createElement('style');
    style.id = 'dilemma-styles';
    style.textContent = `
      .dilemma-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 12, 10, 0.85);
        backdrop-filter: blur(4px);
        z-index: 35;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .dilemma-card {
        background: #fdf6e3;
        border: 2px solid #b45309;
        border-radius: 12px;
        max-width: 680px;
        width: 100%;
        padding: 24px 28px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
        font-family: system-ui, sans-serif;
        color: #1f2937;
        animation: dilemmaPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes dilemmaPop {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .dilemma-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        border-bottom: 1px solid #d97706;
        padding-bottom: 8px;
      }
      .dilemma-badge {
        font-size: 11px;
        font-weight: 800;
        color: #92400e;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .dilemma-speaker {
        font-size: 12px;
        color: #4b5563;
      }
      .dilemma-title {
        font-size: 17px;
        font-weight: 800;
        color: #78350f;
        margin: 0 0 10px 0;
      }
      .dilemma-text {
        font-size: 13px;
        line-height: 1.55;
        color: #374151;
        margin-bottom: 14px;
        background: #fef3c7;
        padding: 12px 14px;
        border-radius: 8px;
        border-left: 3px solid #d97706;
      }
      .dilemma-prompt {
        font-size: 13px;
        font-weight: 800;
        color: #92400e;
        margin-bottom: 12px;
      }
      .dilemma-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .dilemma-opt-btn {
        background: #fff;
        border: 1.5px solid #d1d5db;
        border-radius: 8px;
        padding: 12px 14px;
        text-align: left;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .dilemma-opt-btn:hover {
        border-color: #b45309;
        background: #fefce8;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(180, 83, 9, 0.15);
      }
      .opt-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }
      .opt-num {
        font-size: 10px;
        font-weight: 800;
        background: #fde68a;
        color: #92400e;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .opt-title {
        font-size: 13px;
        color: #1f2937;
      }
      .opt-arg {
        font-size: 12px;
        color: #4b5563;
        margin: 0 0 6px 0;
        font-style: italic;
      }
      .opt-rewards {
        font-size: 11px;
        color: #15803d;
        font-weight: 600;
      }
      .feedback-desc {
        font-size: 13px;
        line-height: 1.5;
        color: #374151;
        margin: 12px 0;
      }
      .reward-box {
        background: #f0fdf4;
        border: 1px solid #86efac;
        border-radius: 8px;
        padding: 10px 14px;
        margin: 12px 0 18px 0;
      }
      .reward-box h3 {
        font-size: 12px;
        color: #166534;
        margin: 0 0 6px 0;
      }
      .reward-chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .reward-chip {
        background: #dcfce7;
        color: #15803d;
        font-size: 11px;
        font-weight: 800;
        padding: 3px 8px;
        border-radius: 999px;
      }
      .dilemma-btn-primary {
        background: #b45309;
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 8px 18px;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        width: 100%;
        transition: background 0.2s;
      }
      .dilemma-btn-primary:hover {
        background: #92400e;
      }
    `;
    document.head.appendChild(style);
  }
}
