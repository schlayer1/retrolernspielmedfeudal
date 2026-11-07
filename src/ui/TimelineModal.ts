import { sound } from '../audio/sound';

export interface TimelinePhase {
  epoch: string;
  century: string;
  title: string;
  focus: string;
  techInnovation: string;
}

export class TimelineModal {
  private overlay: HTMLElement | null = null;

  private phases: TimelinePhase[] = [
    {
      epoch: 'Frühmittelalter (ca. 500–1000 n. Chr.)',
      century: '6.–10. Jahrhundert',
      title: 'Fränkische Reichsteilung, Lehnsentstehung & Klostergründungen',
      focus: 'Zerfall des Römischen Reiches, Entstehung der Grundherrschaft, Christianisierung Mitteleuropas und fränkische Krönung Karls des Großen (800 n. Chr.).',
      techInnovation: 'Hölzerne Hakenpflüge, Rodung von Urwäldern, Pergament-Handschriften der Klöster & frühe Salfrondienste.',
    },
    {
      epoch: 'Hochmittelalter (ca. 1000–1250 n. Chr.)',
      century: '11.–13. Jahrhundert (Hauptspiel)',
      title: 'Blütezeit des Rittertums, Burgenbau & Aufblühen der Städte',
      focus: 'Die Dreiständelehre (oratores, bellatores, laboratores), Investiturstreit, Kreuzzüge, Entstehung freier Städte ("Stadtluft macht frei") und Marktordnungen.',
      techInnovation: 'Dreifelderwirtschaft, eiserner Wendepflug, Kummet für Zugpferde, Wassermühlen, romanische und gotische Sakralbauten.',
    },
    {
      epoch: 'Spätmittelalter (ca. 1250–1500 n. Chr.)',
      century: '14.–15. Jahrhundert',
      title: 'Krise, Goldene Bulle, Große Pest & Vorabend der Neuzeit',
      focus: 'Klimawandel (Kleine Eiszeit), Pestepidemie von 1348, Aufstieg des Bürgertums und Niedergang des klassischen Raubrittertums.',
      techInnovation: 'Schießpulver & Feuerwaffen, Buchdruck mit beweglichen Lettern, doppelte Buchführung der Handelsdynastien.',
    },
  ];

  public open(onClose?: () => void): void {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.id = 'timeline-modal';
      this.overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(12, 8, 6, 0.88);
        backdrop-filter: blur(6px); z-index: 3500; display: flex;
        align-items: center; justify-content: center; padding: 16px;
        font-family: 'Cinzel', Georgia, system-ui, sans-serif;
      `;
      document.body.appendChild(this.overlay);
    }

    const phasesHtml = this.phases
      .map(
        (p, idx) => `
      <div style="background: rgba(0, 0, 0, 0.35); border: 1.5px solid ${idx === 1 ? '#f59e0b' : 'rgba(212, 175, 55, 0.35)'}; border-radius: 8px; padding: 14px; margin-bottom: 12px; ${idx === 1 ? 'box-shadow: 0 0 14px rgba(245, 158, 11, 0.25);' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
          <span style="font-size: 13px; font-weight: 800; color: #fde68a;">${p.epoch}</span>
          <span style="font-size: 11px; color: #9ca3af; font-weight: bold;">${p.century}</span>
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px;">${p.title}</div>
        <div style="font-size: 12px; color: #cbd5e1; line-height: 1.45; margin-bottom: 6px;">
          <strong>Historischer Kontext:</strong> ${p.focus}
        </div>
        <div style="font-size: 11px; color: #86efac; font-weight: 600;">
          💡 <strong>Technologie & Lebenswelt:</strong> ${p.techInnovation}
        </div>
      </div>
    `
      )
      .join('');

    this.overlay.innerHTML = `
      <div style="background: linear-gradient(145deg, #24160e, #140d08); border: 2px solid #d4af37; border-radius: 12px; max-width: 680px; width: 100%; color: #fef3c7; box-shadow: 0 20px 50px rgba(0,0,0,0.85); overflow: hidden;">
        <div style="background: rgba(212, 175, 55, 0.18); padding: 14px 20px; border-bottom: 1px solid rgba(212, 175, 55, 0.4); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #f59e0b; font-weight: bold;">⏳ Epochen-Zeitstrahl & Phasenvergleich</div>
            <div style="font-size: 17px; font-weight: bold; color: #fff; margin-top: 2px;">Das Europäische Mittelalter (500–1500 n. Chr.)</div>
          </div>
          <button id="timeline-close-btn" style="background: transparent; border: none; color: #f59e0b; font-size: 24px; cursor: pointer; padding: 0 8px;">✕</button>
        </div>

        <div style="padding: 20px; max-height: 72vh; overflow-y: auto; font-family: 'Inter', system-ui, sans-serif;">
          ${phasesHtml}
          <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
            <button id="timeline-done-btn" style="background: linear-gradient(180deg, #d97706, #b45309); border: 1px solid #fde68a; color: #fff; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer;">
              Schließen (Esc / Z)
            </button>
          </div>
        </div>
      </div>
    `;

    this.overlay.querySelector('#timeline-close-btn')?.addEventListener('click', () => {
      this.close();
      if (onClose) onClose();
    });

    this.overlay.querySelector('#timeline-done-btn')?.addEventListener('click', () => {
      this.close();
      if (onClose) onClose();
    });
  }

  public close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
