import { gameState } from '../systems/GameState';
import { MEDIEVAL_RELICS } from '../data/relics';
import { MEDIEVAL_LEXICON } from '../data/lexicon';

export class PrintSheet {
  private el: HTMLElement;

  constructor() {
    const existing = document.getElementById('hefter-print-sheet');
    if (existing) {
      this.el = existing;
    } else {
      this.el = document.createElement('div');
      this.el.id = 'hefter-print-sheet';
      document.body.appendChild(this.el);
    }
    this.injectStyles();
  }

  public print(): void {
    gameState.storyFlags['opened_certificate'] = true;
    gameState.notify();
    this.render();
    window.print();
  }

  private render(): void {
    const now = new Date();
    const dateStr = now.toLocaleDateString('de-DE');
    const hefterCode = gameState.generateHefterCode();
    const rang = gameState.getChronistenRang();

    const discoveredRelicsList = MEDIEVAL_RELICS.filter((r) => gameState.discoveredRelics.has(r.id));
    const coreTerms = MEDIEVAL_LEXICON.filter((l) => ['grundherr', 'lehnswesen', 'dreistaendelehre'].includes(l.id));

    this.el.innerHTML = `
      <div class="print-page">
        <!-- 1. Schulkopf -->
        <div class="print-header">
          <div class="header-left">
            <h1 class="school-name">Staatliche Regelschule Heimbürgeschule Kahla</h1>
            <h2 class="lesson-topic">Fach Geschichte • Klassenstufe 6/7 • Das europäische Hochmittelalter</h2>
          </div>
          <div class="header-right">
            <div class="meta-row"><strong>Name:</strong> ${gameState.playerName}</div>
            <div class="meta-row"><strong>Datum:</strong> ${dateStr}</div>
            <div class="meta-row"><strong>Hefter-Code:</strong> <span class="code-badge">${hefterCode}</span></div>
          </div>
        </div>

        <div class="print-divider"></div>

        <div class="print-title-banner">
          <h2>Arbeits- & Hefterblatt: Ritter, Burg & Dorf – Das Feudalsystem</h2>
          <div class="rank-tag">Erreichter Rang: <strong>${rang.title} (${rang.tier}-Stufe)</strong> • ${gameState.getEpochenPunkte()} Epochenpunkte</div>
        </div>

        <!-- 2. Geborgene Relikte & Didaktische Merksätze -->
        <div class="print-section">
          <h3 class="section-heading">1. Archäologische Leitfunde & Primärquellen</h3>
          <div class="relic-grid">
            ${
              discoveredRelicsList.length > 0
                ? discoveredRelicsList
                    .map(
                      (r) => `
                <div class="relic-card">
                  <div class="relic-head">
                    <span class="relic-title">🏺 ${r.name}</span>
                    <span class="relic-era">${r.era}</span>
                  </div>
                  <div class="relic-fact">${r.didacticFact}</div>
                </div>
              `,
                    )
                    .join('')
                : `
                <div class="relic-card">
                  <div class="relic-head"><span class="relic-title">🏺 Eisernes Pflugmesser (Sech)</span></div>
                  <div class="relic-fact">📌 Merksatz: Das eiserne Pflugmesser schnitt dichte Wurzelböden senkrecht auf und ermöglichte zusammen mit der Dreifelderwirtschaft eine Verdopplung der Ernteerträge.</div>
                </div>
                <div class="relic-card">
                  <div class="relic-head"><span class="relic-title">🏺 Lehnsurkunde mit Wachssiegel</span></div>
                  <div class="relic-fact">📌 Merksatz: Die Lehnsurkunde besiegelte das gegenseitige Treueverhältnis zwischen Lehnsherr (Schutz und Land) und Vasall (Treue und Heeresfolge).</div>
                </div>
              `
            }
          </div>
        </div>

        <!-- 3. Schiedssprüche & Historische Dilemmata -->
        <div class="print-section">
          <h3 class="section-heading">2. Dokumentation der gefällten Rats- & Schiedssprüche</h3>
          <div class="dilemma-log">
            <div class="log-entry">
              <strong>Fall 1 (Kapitel 4 – Fehde-Drohung im Lehnsgericht):</strong>
              <p>${gameState.storyFlags['dilemma_ch4_frieden_gestiftet'] ? 'Urteil auf gütliche Sühne und Entschädigung in Silberpfennigen zur Wahrung des Landfriedens gefällt.' : 'Urteil auf strikten Lehnsentzug wegen Treuebruchs (Felonie) gefällt.'}</p>
            </div>
            <div class="log-entry">
              <strong>Fall 2 (Kapitel 8 – Flucht in die freie Reichsstadt):</strong>
              <p>${gameState.storyFlags['dilemma_ch8_loskauf_erfolgreich'] ? 'Kompromiss geschlossen: Freikauf durch die Zunft gegen Loskaufgeld ("Stadtluft macht frei nach Jahr und Tag").' : 'Strikte Schollenbindung durchgesetzt: Rückführung des Bauern auf den Fronhof.'}</p>
            </div>
          </div>
        </div>

        <!-- 4. Zentrale Lehrplan-Begriffe -->
        <div class="print-section">
          <h3 class="section-heading">3. Wichtige Fachbegriffe der Epoche</h3>
          <div class="terms-grid">
            ${coreTerms
              .map(
                (t) => `
              <div class="term-box">
                <div class="term-name">📌 ${t.term}</div>
                <div class="term-def">${t.definition}</div>
              </div>
            `,
              )
              .join('')}
          </div>
        </div>

        <!-- 5. Fußzeile & Geschichtsheft-Eintrag -->
        <div class="print-footer">
          <div class="footer-line">
            <span>Ordentlich eingeheftet im Fachheft Geschichte am: __________________</span>
            <span>Unterschrift des Schülers: ______________________</span>
          </div>
        </div>
      </div>
    `;
  }

  private injectStyles(): void {
    if (document.getElementById('print-sheet-styles')) return;

    const style = document.createElement('style');
    style.id = 'print-sheet-styles';
    style.textContent = `
      #hefter-print-sheet {
        display: none;
      }
      @media print {
        body * {
          visibility: hidden !important;
        }
        #hefter-print-sheet, #hefter-print-sheet * {
          visibility: visible !important;
        }
        #hefter-print-sheet {
          display: block !important;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: #fff !important;
          color: #000 !important;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          padding: 20mm;
          box-sizing: border-box;
        }
        .print-page {
          width: 100%;
          page-break-inside: avoid;
        }
        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
        }
        .school-name {
          font-size: 13pt;
          font-weight: bold;
          margin: 0;
          text-transform: uppercase;
        }
        .lesson-topic {
          font-size: 10pt;
          font-style: italic;
          margin: 2px 0 0 0;
        }
        .header-right {
          font-size: 9.5pt;
          text-align: right;
        }
        .code-badge {
          font-family: monospace;
          font-weight: bold;
          border: 1px solid #000;
          padding: 1px 4px;
        }
        .print-title-banner {
          margin: 12px 0;
          border-bottom: 1px solid #ccc;
          padding-bottom: 6px;
        }
        .print-title-banner h2 {
          font-size: 12pt;
          margin: 0;
        }
        .rank-tag {
          font-size: 9pt;
          color: #333;
        }
        .section-heading {
          font-size: 11pt;
          border-bottom: 1px solid #000;
          margin: 12px 0 6px 0;
          padding-bottom: 2px;
          text-transform: uppercase;
        }
        .relic-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
        }
        .relic-card {
          border: 1px solid #888;
          padding: 6px 8px;
          page-break-inside: avoid;
        }
        .relic-head {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 10pt;
        }
        .relic-fact {
          font-size: 9pt;
          margin-top: 3px;
        }
        .dilemma-log {
          border: 1px solid #888;
          padding: 8px;
        }
        .log-entry {
          margin-bottom: 6px;
          font-size: 9pt;
        }
        .log-entry p {
          margin: 2px 0 0 0;
          font-style: italic;
        }
        .terms-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }
        .term-box {
          border: 1px solid #888;
          padding: 6px;
          font-size: 8.5pt;
        }
        .term-name {
          font-weight: bold;
          margin-bottom: 2px;
        }
        .print-footer {
          margin-top: 20px;
          border-top: 1px solid #000;
          padding-top: 8px;
        }
        .footer-line {
          display: flex;
          justify-content: space-between;
          font-size: 8.5pt;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
