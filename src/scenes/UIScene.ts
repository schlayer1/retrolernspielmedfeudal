import Phaser from 'phaser';
import { sound } from '../audio/sound';
import { MEDIEVAL_CHAPTERS, ChapterData } from '../data/chapters';
import { MEDIEVAL_BUILDINGS, MEDIEVAL_ITEMS, MEDIEVAL_RECIPES, MedievalItemId } from '../data/items';
import { MEDIEVAL_LEXICON, LexiconEntry } from '../data/lexicon';
import { MEDIEVAL_RELICS, MedievalRelic } from '../data/relics';
import { MEDIEVAL_STATIONS, StationDef } from '../data/stations';
import { MEDIEVAL_DILEMMAS } from '../data/dilemmas';
import { gameState, MEDIEVAL_ROLES } from '../systems/GameState';
import { PlayerGender, PlayerRole } from '../systems/SaveManager';
import { TouchControls } from '../ui/TouchControls';
import { PrintSheet } from '../ui/PrintSheet';
import { DilemmaModal } from '../ui/DilemmaModal';
import { WorldScene } from './WorldScene';

export type ModalType =
  | 'none'
  | 'start'
  | 'dialog'
  | 'quiz'
  | 'inspector'
  | 'station'
  | 'inventory'
  | 'craft'
  | 'build'
  | 'trade'
  | 'lexicon'
  | 'timeline'
  | 'certificate'
  | 'pause'
  | 'dilemma';

export class UIScene extends Phaser.Scene {
  public touchControls!: TouchControls;
  private activeModal: ModalType = 'start';
  private uiRoot!: HTMLDivElement;
  private hudHeader!: HTMLDivElement;
  private questBox!: HTMLDivElement;
  private hotbarEl!: HTMLDivElement;
  private modalOverlay!: HTMLDivElement;
  private toastContainer!: HTMLDivElement;
  private dilemmaModal = new DilemmaModal();
  private printSheet = new PrintSheet();
  private lastActionKeyMs = 0;

  private activeRelic: MedievalRelic | null = null;
  private isRelicFlipped = false;
  private activeStation: StationDef | null = null;
  private selectedStationItems: string[] = [];
  private stationArmoryStep = 1;

  private selectedLexiconId: string = MEDIEVAL_LEXICON[0].id;
  private lexiconFilterTag: string = 'Alle';
  private questCollapsed = false;

  // Dialog State
  private dialogLines: string[] = [];
  private dialogIndex = 0;
  private activeChapterDialog: ChapterData | null = null;

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.initDOMStructure();
    this.touchControls = new TouchControls((key) => this.handleShortcutKey(key));
    (window as any).__touchControls = this.touchControls;

    this.registerGlobalHooks();
    this.registerKeyboardShortcuts();

    gameState.subscribe(() => {
      this.renderHUD();
      this.renderQuestTracker();
    });

    this.renderHUD();
    this.renderQuestTracker();
    this.openStartScreen();
  }

  update(): void {
    const comp = document.getElementById('hud-compass');
    if (comp && comp.textContent !== gameState.compassText) {
      comp.textContent = gameState.compassText || '🧭 Wegweiser wird berechnet...';
    }
  }

  private registerGlobalHooks(): void {
    const win = window as any;
    win.__isModalOpen = () => this.activeModal !== 'none';
    win.__openMentorDialog = (ch: ChapterData) => this.openMentorDialog(ch);
    win.__openMentorDialogForCurrent = () => {
      const cur = MEDIEVAL_CHAPTERS.find((c) => c.id === gameState.chapter);
      if (cur) this.openMentorDialog(cur);
    };
    win.__advanceDialog = () => this.advanceDialog();
    win.__openArtifactInspector = (rel: MedievalRelic) => this.openArtifactInspector(rel);
    win.__openStation = (stationId: string) => this.openStation(stationId);
    win.__showToast = (msg: string) => this.showToast(msg);
    win.__toggleModal = (mod: string) => this.handleShortcutKey(mod.toUpperCase());
    win.__closeModal = () => this.closeModal();
    win.__eatFood = () => {
      const msg = gameState.eat();
      this.showToast(msg);
    };
    win.__printHefterSheet = () => this.printSheet.print();
    win.__MEDIEVAL_CHAPTERS = MEDIEVAL_CHAPTERS;
    win.__MEDIEVAL_RELICS = MEDIEVAL_RELICS;
    win.__gameState = gameState;
  }

  private initDOMStructure(): void {
    let root = document.getElementById('ui-layer') as HTMLDivElement | null;
    if (!root) {
      root = document.createElement('div');
      root.id = 'ui-layer';
      document.body.appendChild(root);
    }
    this.uiRoot = root;
    this.uiRoot.innerHTML = '';

    this.hudHeader = document.createElement('div');
    this.hudHeader.className = 'hud-top-bar';

    this.questBox = document.createElement('div');
    this.questBox.id = 'quest-tracker';
    this.questBox.className = 'quest-tracker-box';

    this.hotbarEl = document.createElement('div');
    this.hotbarEl.id = 'hud-hotbar';
    this.hotbarEl.className = 'hud-hotbar';

    this.modalOverlay = document.createElement('div');
    this.modalOverlay.id = 'modal-overlay';
    this.modalOverlay.className = 'modal-backdrop';
    this.modalOverlay.style.display = 'none';

    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'toast-container';
    this.toastContainer.className = 'toast-container';

    this.uiRoot.appendChild(this.hudHeader);
    this.uiRoot.appendChild(this.questBox);
    this.uiRoot.appendChild(this.hotbarEl);
    this.uiRoot.appendChild(this.modalOverlay);
    this.uiRoot.appendChild(this.toastContainer);
  }

  private registerKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const key = e.key.toUpperCase();

      if (e.key === 'Escape') {
        if (this.activeModal !== 'none' && this.activeModal !== 'start') {
          this.closeModal();
        } else if (this.activeModal === 'none') {
          this.openPauseDashboard();
        }
        return;
      }

      if (this.activeModal === 'start') return;

      // Single source of truth for [E], [Space], [Enter]
      if (key === 'E' || e.code === 'Space' || e.key === 'Enter') {
        const now = Date.now();
        if (now - this.lastActionKeyMs < 160) return;
        this.lastActionKeyMs = now;

        if (this.activeModal === 'dialog') {
          e.preventDefault();
          this.advanceDialog();
          return;
        }
        if (this.activeModal === 'inspector') {
          e.preventDefault();
          this.closeModal();
          this.showToast('🏺 Fundstück im Beutel verstaut!');
          return;
        }
        if (this.activeModal === 'none') {
          e.preventDefault();
          const win = window as any;
          if (win.__triggerInteraction) {
            win.__triggerInteraction();
          }
          return;
        }
      }

      if (['I', 'C', 'B', 'H', 'F', 'L', 'Z', 'U', 'P', 'M'].includes(key)) {
        this.handleShortcutKey(key);
      }
    });
  }

  private handleShortcutKey(key: string): void {
    if (key === 'ESC' || key === 'ESCAPE') {
      this.closeModal();
      return;
    }
    sound.click();
    if (key === 'M') {
      const isMuted = sound.toggleMute();
      this.showToast(isMuted ? '🔇 Musik stummgeschaltet' : '🔊 Musik aktiv');
      this.renderHUD();
      return;
    }
    if (key === 'F') {
      const msg = gameState.eat();
      this.showToast(msg);
      return;
    }
    if (key === 'P') {
      if (this.activeModal === 'pause') this.closeModal();
      else this.openPauseDashboard();
      return;
    }
    if (key === 'I') {
      if (this.activeModal === 'inventory') this.closeModal();
      else this.openInventoryModal();
      return;
    }
    if (key === 'C') {
      if (this.activeModal === 'craft') this.closeModal();
      else this.openCraftModal();
      return;
    }
    if (key === 'B') {
      if (this.activeModal === 'build') this.closeModal();
      else this.openBuildModal();
      return;
    }
    if (key === 'H') {
      if (this.activeModal === 'trade') this.closeModal();
      else this.openTradeModal();
      return;
    }
    if (key === 'L') {
      if (this.activeModal === 'lexicon') this.closeModal();
      else this.openLexiconModal();
      return;
    }
    if (key === 'Z') {
      if (this.activeModal === 'timeline') this.closeModal();
      else this.openTimelineModal();
      return;
    }
    if (key === 'U') {
      if (this.activeModal === 'certificate') this.closeModal();
      else this.openCertificateModal();
      return;
    }
  }

  public closeModal(): void {
    this.activeModal = 'none';
    this.modalOverlay.style.display = 'none';
    this.touchControls.setVisible(true);

    const world = this.scene.get('WorldScene') as WorldScene;
    if (world && world.resetDialogFocus) {
      world.resetDialogFocus();
    }
  }

  // =========================================================================
  // HUD (STEINZEIT-STATUSBALKEN + SHORTCUTS + UNTERES HOTBAR-INVENTAR)
  // =========================================================================
  public renderHUD(): void {
    const curCh = MEDIEVAL_CHAPTERS.find((c) => c.id === gameState.chapter);
    const relCount = gameState.discoveredRelics.size;
    const roleLabel =
      gameState.role === 'knappe'
        ? 'Schildknappe'
        : gameState.role === 'skriptor'
        ? 'Klosterskriptor'
        : 'Hofbauer';

    const foodPct = Math.max(0, Math.min(100, Math.round(gameState.food)));
    const safetyPct = Math.max(0, Math.min(100, Math.round(gameState.safety)));
    const knowPct = Math.max(0, Math.min(100, Math.round(gameState.knowledge)));

    this.hudHeader.innerHTML = `
      <div class="hud-left">
        <span class="hud-ch-badge">⚔️ Kapitel ${curCh?.number || 1}: ${curCh?.title || 'Das Mittelalter'}</span>
        <span class="hud-player-badge">👤 ${gameState.playerName} (${roleLabel})</span>
        <div class="hud-status-bars" style="display:flex;align-items:center;gap:10px;background:rgba(15,10,6,0.75);padding:3px 10px;border-radius:6px;border:1px solid rgba(217,119,6,0.45);">
          <div class="hud-stat-pill" title="Nahrung & Versorgung (Taste F zum Essen)" style="display:flex;align-items:center;gap:5px;font-size:11px;color:#fde68a;">
            <span>🍞 Nahrung</span>
            <div style="width:52px;height:7px;background:#291d12;border-radius:4px;overflow:hidden;border:1px solid rgba(251,191,36,0.35);">
              <div style="width:${foodPct}%;height:100%;background:linear-gradient(90deg,#d97706,#fbbf24);"></div>
            </div>
            <strong style="font-size:10px;">${foodPct}%</strong>
          </div>
          <div class="hud-stat-pill" title="Schutz & Ordnung (steigt durch Burgbau & Infrastruktur)" style="display:flex;align-items:center;gap:5px;font-size:11px;color:#86efac;">
            <span>🛡️ Schutz</span>
            <div style="width:52px;height:7px;background:#11261b;border-radius:4px;overflow:hidden;border:1px solid rgba(74,222,128,0.35);">
              <div style="width:${safetyPct}%;height:100%;background:linear-gradient(90deg,#16a34a,#4ade80);"></div>
            </div>
            <strong style="font-size:10px;">${safetyPct}%</strong>
          </div>
          <div class="hud-stat-pill" title="Wissen & Gelehrsamkeit (steigt durch Relikte, Lexikon & Handwerk)" style="display:flex;align-items:center;gap:5px;font-size:11px;color:#93c5fd;">
            <span>📖 Wissen</span>
            <div style="width:52px;height:7px;background:#111d33;border-radius:4px;overflow:hidden;border:1px solid rgba(96,165,250,0.35);">
              <div style="width:${knowPct}%;height:100%;background:linear-gradient(90deg,#2563eb,#60a5fa);"></div>
            </div>
            <strong style="font-size:10px;">${knowPct}%</strong>
          </div>
        </div>
        <span class="hud-relic-badge">🏺 ${relCount}/5 Relikte</span>
      </div>
      <div class="hud-right">
        <button class="hud-btn" onclick="window.__toggleModal('I')">🎒 Beutel [I]</button>
        <button class="hud-btn" onclick="window.__toggleModal('C')">🔨 Handwerk [C]</button>
        <button class="hud-btn" onclick="window.__toggleModal('B')">🏰 Bauen [B]</button>
        <button class="hud-btn" onclick="window.__toggleModal('H')">⚖️ Markt [H]</button>
        <button class="hud-btn" onclick="window.__eatFood()">🍞 Essen [F]</button>
        <button class="hud-btn" onclick="window.__toggleModal('L')">📖 Lexikon [L]</button>
        <button class="hud-btn" onclick="window.__toggleModal('Z')">⏳ Zeit [Z]</button>
        <button class="hud-btn" onclick="window.__toggleModal('U')">📜 Urkunde [U]</button>
        <button class="hud-btn" onclick="window.__toggleModal('M')">${sound.isMuted() ? '🔇' : '🔊'}</button>
        <button class="hud-btn hud-btn-accent" onclick="window.__toggleModal('P')">⏸️ Menü [P]</button>
      </div>
    `;

    // Render Bottom Inventory Hotbar (Steinzeit / Griechenland Standard)
    if (this.hotbarEl) {
      const shortNames: Record<string, string> = {
        brot_fladen: 'Dorfbrot',
        mehl_sack: 'Mehl',
        roggen_saat: 'Roggen',
        hafer_saat: 'Hafer',
        heuballen: 'Wiesenheu',
        holz_balken: 'Bauholz',
        feldstein: 'Bruchstein',
        eisen_barren: 'Eisen',
        wasser_eimer: 'Wasser',
        wollballen: 'Wolle',
        pergament_bogen: 'Pergament',
        lehnssiegel_wachs: 'Siegelwachs',
        heilsalbe_kraeuter: 'Heilsalbe',
        pflugmesser_eisen: 'Pflugmesser',
        ritter_hufeisen: 'Hufeisen',
        wappenschild_rohling: 'Schild',
        silber_pfennig: 'Silberdenar',
      };
      const entries = Object.entries(gameState.inventory).filter(([, count]) => (count || 0) > 0);
      const slotsHtml = entries
        .map(([k, count]) => {
          const def = MEDIEVAL_ITEMS[k as MedievalItemId];
          if (!def) return '';
          const label = shortNames[k] || def.name.split(' ')[0];
          return `
            <div class="hotbar-slot" title="${def.name} (${count}x)" onclick="window.__toggleModal('I')">
              <img src="${def.icon}" alt="${def.name}" class="hotbar-icon" />
              <span class="hotbar-label">${label}</span>
              <span class="hotbar-qty">x${count}</span>
            </div>
          `;
        })
        .join('');

      this.hotbarEl.innerHTML = `
        <div class="hotbar-items-row">
          ${slotsHtml || '<span style="font-size:11px;color:#d6d3d1;padding:0 8px;">Beutel leer – sammle Holz, Steine oder Getreide mit [E]!</span>'}
          <button class="hotbar-bag-btn" onclick="window.__toggleModal('I')">🎒 Beutel [I]</button>
        </div>
      `;
    }
  }

  public renderQuestTracker(): void {
    const curCh = MEDIEVAL_CHAPTERS.find((c) => c.id === gameState.chapter);
    if (!curCh) return;

    const steps = gameState.getQuestStepProgress(curCh.id);
    const allDone = gameState.checkQuest(curCh.id);
    const nextPending = steps.find((s) => !s.done);

    this.questBox.innerHTML = `
      <div class="qt-header" id="qt-toggle-btn" style="cursor:pointer;" title="Auftrag ein-/ausklappen">
        <span class="qt-title">⚔️ KAPITEL ${curCh.number}: ${curCh.title.toUpperCase()}</span>
        <button class="qt-collapse-btn" style="background:none;border:none;color:#fde047;cursor:pointer;font-size:12px;">${this.questCollapsed ? '➕' : '➖'}</button>
      </div>
      ${
        this.questCollapsed
          ? ''
          : `
        <div class="qt-body">
          <div class="qt-mentor-row" style="font-size:11px;color:#fef08a;margin-bottom:4px;">Mentor: <strong>${curCh.mentor.name}</strong> (${curCh.mentor.role})</div>
          <div class="qt-objective" style="font-size:11px;color:#fef3c7;margin-bottom:6px;">
            <strong>Ziel:</strong> ${curCh.objective}
          </div>
          <div class="qt-steps-list" style="display:flex;flex-direction:column;gap:3px;margin:6px 0;">
            ${steps
              .map(
                (s) => `
              <div class="qt-step-item ${s.done ? 'step-done' : ''}" style="display:flex;align-items:flex-start;gap:6px;font-size:11px;color:${s.done ? '#86efac' : '#e2e8f0'};">
                <span class="qt-step-icon" style="font-size:11px;">${s.done ? '✅' : '⬜'}</span>
                <span class="qt-step-text" style="${s.done ? 'text-decoration:line-through;opacity:0.85;' : ''}">${s.label}</span>
              </div>
            `,
              )
              .join('')}
          </div>
          <div class="qt-divider" style="height:1px;background:rgba(217,119,6,0.35);margin:6px 0;"></div>
          <div class="qt-compass" id="hud-compass" style="font-size:12px;font-weight:700;color:#facc15;">
            ${gameState.compassText || '🧭 Wegweiser wird berechnet...'}
          </div>
          <div class="qt-status-banner ${allDone ? 'ready' : ''}" style="margin-top:6px;font-size:11px;padding:4px 6px;border-radius:4px;background:${allDone ? 'rgba(34,197,94,0.2)' : 'rgba(217,119,6,0.15)'};border:1px solid ${allDone ? '#22c55e' : 'rgba(217,119,6,0.4)'};color:${allDone ? '#86efac' : '#fde047'};">
            ${
              allDone
                ? `✨ Alle 4 Aufgaben erfüllt! Sprich jetzt mit <strong>${curCh.mentor.name}</strong> [E] für das Geschichts-Quiz!`
                : nextPending
                ? `💡 Nächster Schritt: ${nextPending.label}`
                : `💡 Untersuche den Fronhof und folge dem Kompass.`
            }
          </div>
          <div class="qt-action-row" style="margin-top:8px;">
            <button class="qt-action-btn" onclick="window.__openMentorDialogForCurrent()" style="width:100%;padding:4px 8px;font-size:11px;font-weight:700;background:#d97706;border:1px solid #f59e0b;color:#1a1006;border-radius:4px;cursor:pointer;">
              💬 Mit ${curCh.mentor.name} sprechen [E]
            </button>
          </div>
        </div>
      `
      }
    `;

    document.getElementById('qt-toggle-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.questCollapsed = !this.questCollapsed;
      this.renderQuestTracker();
    });
  }

  // =========================================================================
  // TOAST FEEDBACK
  // =========================================================================
  public showToast(msg: string): void {
    const toast = document.createElement('div');
    toast.className = 'retro-toast';
    toast.innerHTML = msg;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }

  // =========================================================================
  // 1. DOKUMENTEN- & PERGAMENT-STARTSCREEN
  // =========================================================================
  public openStartScreen(): void {
    this.activeModal = 'start';
    this.touchControls.setVisible(false);
    this.modalOverlay.style.display = 'flex';

    this.modalOverlay.innerHTML = `
      <div class="startscreen-container">
        <!-- Header -->
        <div class="startscreen-header">
          <div class="st-title-line">
            <span class="st-icon">🏰</span>
            <h1>DAS MITTELALTER: RITTER, BURG & DORF</h1>
            <span class="st-era-tag">Klasse 6 / 7 · ca. 1050 – 1250 n. Chr.</span>
          </div>
          <p class="st-subtitle">Das Feudalsystem: Erkunde das Beziehungsgeflecht aus Grundherrschaft, Lehnswesen, Rittertugenden und Klosterleben</p>
        </div>

        <!-- Hero Showcase Box (Alle 8 Kapitel) -->
        <div class="hero-showcase-box">
          <div class="showcase-title">✨ 8 ABENTEUER-KAPITEL IM HOCHMITTELALTER</div>
          <div class="showcase-grid-8">
            ${MEDIEVAL_CHAPTERS.map(
              (c) => `
              <div class="sc-card ${c.id === gameState.chapter ? 'active' : ''}" onclick="window.__startSelectCh(${c.id})">
                <div class="sc-badge">K${c.number}</div>
                <div class="sc-name">${c.title}</div>
                <div class="sc-mentor">${c.mentor.role}</div>
              </div>
            `,
            ).join('')}
          </div>
        </div>

        <!-- Setup Form -->
        <div class="startscreen-form">
          <div class="form-row">
            <div class="form-group flex-1">
              <label>1. Dein Name:</label>
              <input type="text" id="start-player-name" value="${gameState.playerName}" maxlength="18" />
            </div>
            <div class="form-group">
              <label>2. Figur wählen:</label>
              <div class="gender-btn-group">
                <button class="role-btn ${gameState.gender === 'male' ? 'active' : ''}" id="btn-gender-male">👦 Konrad (Knappe)</button>
                <button class="role-btn ${gameState.gender === 'female' ? 'active' : ''}" id="btn-gender-female">👧 Mathilda (Bäuerin)</button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>3. Deine historische Herkunft & Begabung (Rolle wählen):</label>
            <div class="roles-selection-grid">
              ${MEDIEVAL_ROLES.map(
                (r) => `
                <div class="role-card ${gameState.role === r.id ? 'active' : ''}" data-role="${r.id}">
                  <div class="role-head">
                    <img src="${r.icon}" class="role-icon" />
                    <strong>${r.name}</strong>
                  </div>
                  <p class="role-desc">${r.description}</p>
                  <div class="role-bonus">${r.bonusText}</div>
                </div>
              `,
              ).join('')}
            </div>
          </div>

          <div class="form-row code-restore-row">
            <div class="form-group flex-1">
              <label>📝 Hefter-Kurzcode vorhanden? (Stunde fortsetzen):</label>
              <div class="code-input-wrap">
                <input type="text" id="start-hefter-code" placeholder="z. B. MEDF-K01-BA-00-000" />
                <button class="btn-sub" id="btn-load-hefter-code">Code laden</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="startscreen-footer">
          <div class="controls-hint">
            🎮 <strong>Steuerung:</strong> WASD / Pfeiltasten = Bewegen · [E] = Interagieren · [I] = Beutel · [C] = Schmiede · [P] = Menü
          </div>
          <button class="start-btn-launch" id="btn-start-game">🚀 Abenteuer starten!</button>
        </div>
      </div>
    `;

    // Event Bindings
    const nameInput = document.getElementById('start-player-name') as HTMLInputElement;
    nameInput?.addEventListener('input', () => {
      gameState.playerName = nameInput.value.trim() || 'Konrad';
    });

    const btnMale = document.getElementById('btn-gender-male');
    const btnFemale = document.getElementById('btn-gender-female');
    btnMale?.addEventListener('click', () => {
      gameState.gender = 'male';
      if (!nameInput.value || nameInput.value === 'Mathilda') {
        nameInput.value = 'Konrad';
        gameState.playerName = 'Konrad';
      }
      btnMale.classList.add('active');
      btnFemale?.classList.remove('active');
    });
    btnFemale?.addEventListener('click', () => {
      gameState.gender = 'female';
      if (!nameInput.value || nameInput.value === 'Konrad') {
        nameInput.value = 'Mathilda';
        gameState.playerName = 'Mathilda';
      }
      btnFemale.classList.add('active');
      btnMale?.classList.remove('active');
    });

    // Roles selection
    this.modalOverlay.querySelectorAll('.role-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        const role = (e.currentTarget as HTMLElement).dataset.role as PlayerRole;
        gameState.role = role;
        this.modalOverlay.querySelectorAll('.role-card').forEach((c) => c.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
      });
    });

    // Hefter Code Load
    document.getElementById('btn-load-hefter-code')?.addEventListener('click', () => {
      const codeInput = document.getElementById('start-hefter-code') as HTMLInputElement;
      if (codeInput && gameState.loadFromHefterCode(codeInput.value)) {
        sound.success();
        this.showToast('✅ Hefter-Code erfolgreich geladen!');
        this.openStartScreen();
      } else {
        sound.click();
        this.showToast('❌ Ungültiger Hefter-Code. Bitte prüfen!');
      }
    });

    // Chapter Direct Select Helper
    (window as any).__startSelectCh = (chId: number) => {
      gameState.selectStartChapter(chId);
      this.openStartScreen();
    };

    // Launch Game
    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      sound.door();
      this.closeModal();
      sound.startBGM(gameState.chapter);
    });
  }

  // =========================================================================
  // 2. MENTOREN-DIALOG & QUIZ
  // =========================================================================
  public openMentorDialog(ch: ChapterData): void {
    this.activeModal = 'dialog';
    this.activeChapterDialog = ch;
    this.touchControls.setVisible(false);
    this.modalOverlay.style.display = 'flex';

    const allDone = gameState.checkQuest(ch.id);
    if (allDone) {
      this.dialogLines = ch.outroDialog && ch.outroDialog.length > 0 ? ch.outroDialog : [
        'Gar trefflich gearbeitet! Alle Aufgaben sind meisterhaft erfüllt.',
        'Nun beweise dein erworbenes Wissen in der Geschichtsprüfung!'
      ];
    } else {
      const step0Done = gameState.chapterObjectives[ch.id]?.[0];
      if (step0Done) {
        const steps = gameState.getQuestStepProgress(ch.id);
        const pending = steps.filter((s) => !s.done).map((s) => s.label);
        this.dialogLines = [
          `Gott zum Gruße, junger Wanderer! Deine Aufgaben für dieses Kapitel sind noch im Gange:`,
          `Verbleibend: ${pending.join(' • ')}`,
          `Befolge den goldenen Wegweiser unten im Kompass, um dein nächstes Ziel zu finden!`
        ];
      } else {
        this.dialogLines = ch.introDialog;
      }
    }
    this.dialogIndex = 0;
    this.renderDialogLine();
  }

  private advanceDialog(): void {
    if (!this.activeChapterDialog) return;
    const ch = this.activeChapterDialog;
    sound.click();
    if (this.dialogIndex < this.dialogLines.length - 1) {
      this.dialogIndex++;
      this.renderDialogLine();
    } else {
      const allDone = gameState.checkQuest(ch.id);
      if (allDone) {
        this.openChapterQuiz(ch);
      } else {
        // Mark Step 0 complete!
        gameState.setObjectiveProgress(ch.id, 0, true);
        this.showToast(`✅ Aufgabe 1/4 erfüllt! Erforsche nun den Hof und folge dem Kompass.`);
        this.closeModal();
      }
    }
  }

  private speakCurrentDialog(): void {
    if (!this.activeChapterDialog) return;
    const line = this.dialogLines[this.dialogIndex];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(line);
      u.lang = 'de-DE';
      u.rate = 0.96;
      window.speechSynthesis.speak(u);
    }
  }

  private renderDialogLine(): void {
    if (!this.activeChapterDialog) return;
    const ch = this.activeChapterDialog;
    const line = this.dialogLines[this.dialogIndex];
    const allDone = gameState.checkQuest(ch.id);

    this.modalOverlay.innerHTML = `
      <div class="dialog-box">
        <div class="dialog-avatar-wrap">
          <div class="dialog-avatar-frame">
            <div class="dialog-avatar-crop" style="background-image: url('${ch.mentor.avatar}');"></div>
          </div>
          <div class="dialog-speaker-name">${ch.mentor.name}</div>
          <div class="dialog-speaker-role">${ch.mentor.role}</div>
        </div>
        <div class="dialog-content">
          <div class="dialog-chapter-tag">📜 KAPITEL ${ch.number}: ${ch.title.toUpperCase()}</div>
          <p class="dialog-text">${line}</p>
          <div class="dialog-footer">
            <span class="dialog-step-info">Abschnitt ${this.dialogIndex + 1} von ${this.dialogLines.length}</span>
            <div style="display:flex;gap:8px;">
              <button class="retro-btn" id="btn-dialog-speak" style="padding:4px 10px;font-size:12px;cursor:pointer;">🔊 Vorlesen</button>
              <button class="dialog-next-btn" id="btn-dialog-next">
                ${
                  this.dialogIndex < this.dialogLines.length - 1
                    ? 'Weiter (E) ▶'
                    : allDone
                    ? 'Zur Prüfung ▶'
                    : 'Aufgaben beginnen (E) ▶'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-dialog-speak')?.addEventListener('click', () => {
      this.speakCurrentDialog();
    });
    document.getElementById('btn-dialog-next')?.addEventListener('click', () => {
      this.advanceDialog();
    });
  }

  private openChapterQuiz(ch: ChapterData): void {
    this.activeModal = 'quiz';
    const q = ch.quiz;

    this.modalOverlay.innerHTML = `
      <div class="modal-card quiz-card">
        <div class="modal-header">
          <span class="modal-tag">❓ Geschichts-Prüfung</span>
          <h2>Kapitel ${ch.number}: ${ch.title}</h2>
        </div>
        <div class="quiz-question-text">${q.question}</div>
        <div class="quiz-options-list">
          ${q.options
            .map(
              (opt, i) => `
            <button class="quiz-btn" data-index="${i}">
              <span class="quiz-num">${String.fromCharCode(65 + i)}</span>
              <span>${opt}</span>
            </button>
          `,
            )
            .join('')}
        </div>
        <div id="quiz-feedback-box" class="quiz-feedback" style="display:none"></div>
      </div>
    `;

    this.modalOverlay.querySelectorAll('.quiz-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const choiceIdx = parseInt((e.currentTarget as HTMLElement).dataset.index || '0', 10);
        this.handleQuizAnswer(ch, choiceIdx);
      });
    });
  }

  private handleQuizAnswer(ch: ChapterData, choice: number): void {
    const q = ch.quiz;
    const isCorrect = choice === q.answerIndex;
    const box = document.getElementById('quiz-feedback-box');
    if (!box) return;

    box.style.display = 'block';
    if (isCorrect) {
      sound.success();
      box.className = 'quiz-feedback success';
      box.innerHTML = `
        <div class="fb-title">✅ Hervorragend beantwortet!</div>
        <p>${q.explanation}</p>
        <button class="btn-primary mt-3" id="btn-quiz-continue">Kapitel abschließen & Vorräte sichern</button>
      `;

      document.getElementById('btn-quiz-continue')?.addEventListener('click', () => {
        gameState.completeChapter(ch.id, 1);
        if (ch.rewards.items) {
          for (const [k, v] of Object.entries(ch.rewards.items)) {
            gameState.addInventory(k as MedievalItemId, v);
          }
        }
        this.showToast(`🎉 Kapitel ${ch.number} gemeistert! +${ch.rewards.epochenpunkte || 100} Pkt.`);
        this.closeModal();
      });
    } else {
      sound.click();
      box.className = 'quiz-feedback error';
      box.innerHTML = `
        <div class="fb-title">❌ Das war noch nicht ganz historisch zutreffend.</div>
        <p>Lies dir die Frage noch einmal genau durch oder sprich erneut mit ${ch.mentor.name}!</p>
      `;
    }
  }

  // =========================================================================
  // 3. 360° ARTIFACT INSPECTOR
  // =========================================================================
  public openArtifactInspector(rel: MedievalRelic): void {
    this.activeModal = 'inspector';
    this.activeRelic = rel;
    this.isRelicFlipped = false;
    this.touchControls.setVisible(false);
    this.modalOverlay.style.display = 'flex';
    this.renderInspector();
  }

  private renderInspector(): void {
    if (!this.activeRelic) return;
    const r = this.activeRelic;

    this.modalOverlay.innerHTML = `
      <div class="modal-card inspector-card">
        <div class="inspector-header">
          <span class="inspector-badge">🏺 360° ARCHÄOLOGIE- & PRIMÄRQUELLEN-INSPEKTOR</span>
          <button class="modal-close-btn" onclick="window.__toggleModal('ESC')">✕ Schließen</button>
        </div>
        <div class="inspector-body">
          <div class="inspector-visual">
            <div class="artifact-flip-wrap ${this.isRelicFlipped ? 'flipped' : ''}">
              <img src="${r.icon}" class="artifact-img-large" />
            </div>
            <button class="btn-flip" id="btn-flip-artifact">🔄 Fundstück wenden (360°)</button>
            <div class="artifact-side-tag">${this.isRelicFlipped ? 'Revers / Rückseite' : 'Avers / Vorderseite'}</div>
          </div>
          <div class="inspector-details">
            <div class="artifact-meta">
              <h2>${r.titleDe}</h2>
              <div class="meta-tags">
                <span class="tag-pill">⏳ ${r.era}</span>
                <span class="tag-pill">📍 ${r.location}</span>
              </div>
            </div>
            <div class="artifact-description-box">
              <h3>Wissenschaftlicher Befund:</h3>
              <p>${this.isRelicFlipped ? r.descriptionBack : r.descriptionFront}</p>
            </div>
            <div class="didactic-fact-box">
              ${r.didacticFact}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-flip-artifact')?.addEventListener('click', () => {
      sound.click();
      this.isRelicFlipped = !this.isRelicFlipped;
      this.renderInspector();
    });
  }

  // =========================================================================
  // 4. HAPTISCHE MINI-STATIONEN (Kräutermörser & Rüstkammer)
  // =========================================================================
  public openStation(stationId: string): void {
    const st = MEDIEVAL_STATIONS.find((s) => s.id === stationId);
    if (!st) return;
    this.activeModal = 'station';
    this.activeStation = st;
    this.selectedStationItems = [];
    this.stationArmoryStep = 1;
    this.touchControls.setVisible(false);
    this.modalOverlay.style.display = 'flex';
    this.renderStation();
  }

  private renderStation(): void {
    if (!this.activeStation) return;
    const st = this.activeStation;

    if (st.type === 'mortar') {
      this.renderMortarStation(st);
    } else {
      this.renderArmoryStation(st);
    }
  }

  private renderMortarStation(st: StationDef): void {
    const ings = st.config.allIngredients || [];

    this.modalOverlay.innerHTML = `
      <div class="modal-card station-card">
        <div class="modal-header">
          <span class="modal-tag">🌿 Klostermedizin</span>
          <h2>${st.title}</h2>
          <div class="station-sub">${st.instructionText}</div>
        </div>
        <p class="station-context">${st.historicalContext}</p>
        <div class="mortar-interface">
          <div class="mortar-pot">
            <div class="pot-circle">🥣 Steinmörser</div>
            <div class="pot-contents">
              ${
                this.selectedStationItems.length === 0
                  ? '<span class="empty-tip">Noch keine Kräuter im Mörser</span>'
                  : this.selectedStationItems
                      .map((id) => {
                        const item = ings.find((x: any) => x.id === id);
                        return `<span class="ing-chip">🍃 ${item?.name || id}</span>`;
                      })
                      .join(' ')
              }
            </div>
          </div>
          <div class="mortar-ingredients">
            <h3>Verfügbare Arzneipflanzen im Klostergarten:</h3>
            <div class="ingredients-list">
              ${ings
                .map((ing: any) => {
                  const isSelected = this.selectedStationItems.includes(ing.id);
                  return `
                  <button class="ing-btn ${isSelected ? 'selected' : ''}" data-id="${ing.id}">
                    <strong>${ing.name}</strong>
                    <span>${ing.role}</span>
                  </button>
                `;
                })
                .join('')}
            </div>
          </div>
        </div>
        <div class="station-actions">
          <button class="btn-sub" id="btn-mortar-reset">Mörser leeren</button>
          <button class="btn-primary" id="btn-mortar-mix">🌿 Salbe zerstoßen & rühren</button>
        </div>
      </div>
    `;

    this.modalOverlay.querySelectorAll('.ing-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        sound.click();
        const id = (e.currentTarget as HTMLElement).dataset.id || '';
        if (this.selectedStationItems.includes(id)) {
          this.selectedStationItems = this.selectedStationItems.filter((x) => x !== id);
        } else {
          if (this.selectedStationItems.length < 3) {
            this.selectedStationItems.push(id);
          }
        }
        this.renderMortarStation(st);
      });
    });

    document.getElementById('btn-mortar-reset')?.addEventListener('click', () => {
      sound.click();
      this.selectedStationItems = [];
      this.renderMortarStation(st);
    });

    document.getElementById('btn-mortar-mix')?.addEventListener('click', () => {
      const correct = st.config.requiredIngredients || [];
      const isComplete =
        this.selectedStationItems.length === 3 &&
        correct.every((x: string) => this.selectedStationItems.includes(x));

      if (isComplete) {
        sound.success();
        gameState.addInventory(st.rewardItem, st.rewardQty);
        this.showToast(`✅ Wundsalbe perfekt zubereitet! +${st.rewardQty} ${MEDIEVAL_ITEMS[st.rewardItem].name}`);
        this.closeModal();
      } else {
        sound.click();
        this.showToast('❌ Diese Mischung heilt noch nicht. Wähle die 3 richtigen Kräuter!');
      }
    });
  }

  private renderArmoryStation(st: StationDef): void {
    const steps = st.config.steps || [];
    const currentStepDef = steps.find((s: any) => s.step === this.stationArmoryStep);

    this.modalOverlay.innerHTML = `
      <div class="modal-card station-card">
        <div class="modal-header">
          <span class="modal-tag">🛡️ Waffenkammer</span>
          <h2>${st.title}</h2>
          <div class="station-sub">${st.instructionText}</div>
        </div>
        <p class="station-context">${st.historicalContext}</p>
        <div class="armory-interface">
          <div class="knight-silhouette">
            <div class="silhouette-title">Ritter-Rüstungsstand (${this.stationArmoryStep}/4):</div>
            <div class="armored-layers">
              ${steps
                .filter((s: any) => s.step < this.stationArmoryStep)
                .map((s: any) => `<div class="layer-item done">✓ ${s.name}</div>`)
                .join('')}
              ${currentStepDef ? `<div class="layer-item current">👉 ${currentStepDef.name} (ausstehend)</div>` : '<div class="layer-item all-done">🎉 Vollständig gerüstet!</div>'}
            </div>
          </div>
          <div class="armory-choices">
            <h3>Welches Teil legst du als Nächstes an?</h3>
            <div class="choices-list">
              ${steps
                .map(
                  (s: any) => `
                <button class="choice-btn ${s.step < this.stationArmoryStep ? 'done' : ''}" data-step="${s.step}">
                  <strong>${s.name}</strong>
                  <span>${s.desc}</span>
                </button>
              `,
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.modalOverlay.querySelectorAll('.choice-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const stepNum = parseInt((e.currentTarget as HTMLElement).dataset.step || '0', 10);
        if (stepNum === this.stationArmoryStep) {
          sound.questStep();
          this.stationArmoryStep++;
          if (this.stationArmoryStep > 4) {
            sound.success();
            gameState.addInventory(st.rewardItem, st.rewardQty);
            this.showToast(`✅ Ritterrüstung vollendet! +${st.rewardQty} ${MEDIEVAL_ITEMS[st.rewardItem].name}`);
            this.closeModal();
          } else {
            this.renderArmoryStation(st);
          }
        } else if (stepNum < this.stationArmoryStep) {
          sound.click();
          this.showToast('Das hast du bereits angelegt!');
        } else {
          sound.click();
          this.showToast('❌ Falsche Reihenfolge! Eine Rüstung wird schichtweise von innen nach außen angelegt.');
        }
      });
    });
  }

  // =========================================================================
  // 5. PROGRESSIVES HISTORISCHES FACHLEXIKON (2-Spalten-Layout)
  // =========================================================================
  public openLexiconModal(): void {
    this.activeModal = 'lexicon';
    this.touchControls.setVisible(false);
    this.modalOverlay.style.display = 'flex';
    this.renderLexicon();
  }

  private renderLexicon(): void {
    const curEntry =
      MEDIEVAL_LEXICON.find((l) => l.id === this.selectedLexiconId) || MEDIEVAL_LEXICON[0];
    const isUnlocked = curEntry.minChapter <= gameState.chapter;
    const unlockedCount = MEDIEVAL_LEXICON.filter((l) => l.minChapter <= gameState.chapter).length;

    this.modalOverlay.innerHTML = `
      <div class="modal-card lexicon-card">
        <div class="modal-header">
          <span class="modal-tag">📖 HISTORISCHES LEHRPLAN-LEXIKON (${unlockedCount} / 27 entdeckt)</span>
          <button class="modal-close-btn" onclick="window.__toggleModal('ESC')">✕ Schließen</button>
        </div>
        <div class="lexicon-layout-2col">
          <!-- Linke Liste -->
          <div class="lex-list">
            ${MEDIEVAL_LEXICON.map((l) => {
              const u = l.minChapter <= gameState.chapter;
              const isSel = l.id === this.selectedLexiconId;
              return `
                <button class="lex-item ${isSel ? 'selected' : ''} ${u ? '' : 'locked'}" data-id="${l.id}">
                  <span class="lex-icon">${u ? '📜' : '🔒'}</span>
                  <span class="lex-term">${u ? l.term : 'Noch gesperrt...'}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Rechte Detailkarte -->
          <div class="lex-detail-card">
            ${
              isUnlocked
                ? `
              <div class="lex-head">
                <span class="lex-epoch-tag">${curEntry.tag}</span>
                <h2>${curEntry.term}</h2>
              </div>
              <div class="lex-definition-box">
                <p>${curEntry.definition}</p>
              </div>
              <div class="lex-merksatz-box">
                📌 <strong>Geschichts-Merksatz:</strong>
                <p>${curEntry.merksatz}</p>
              </div>
              <button class="btn-tts" id="btn-tts-lexicon">🔊 Eintrag vorlesen</button>
            `
                : `
              <div class="lex-locked-placeholder">
                <div class="locked-icon">🔒</div>
                <h2>Noch nicht entdeckt</h2>
                <div class="unlock-hint-box">
                  💡 <strong>Such-Tipp – Wie schalte ich diesen Eintrag frei?</strong>
                  <p>${curEntry.unlockHint}</p>
                </div>
              </div>
            `
            }
          </div>
        </div>
      </div>
    `;

    this.modalOverlay.querySelectorAll('.lex-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        sound.click();
        this.selectedLexiconId = (e.currentTarget as HTMLElement).dataset.id || '';
        this.renderLexicon();
      });
    });

    document.getElementById('btn-tts-lexicon')?.addEventListener('click', () => {
      if ('speechSynthesis' in window && isUnlocked) {
        const u = new SpeechSynthesisUtterance(`${curEntry.term}. ${curEntry.definition}. Merksatz: ${curEntry.merksatz}`);
        u.lang = 'de-DE';
        window.speechSynthesis.speak(u);
      }
    });
  }

  // =========================================================================
  // 6. INVENTAR, SCHMIEDE & BAUEN
  // =========================================================================
  public openInventoryModal(): void {
    this.activeModal = 'inventory';
    this.touchControls.setVisible(false);
    this.modalOverlay.style.display = 'flex';

    const items = Object.entries(gameState.inventory);

    this.modalOverlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-tag">🎒 RUCKSACK & VORRATSKAMMER</span>
          <button class="modal-close-btn" onclick="window.__toggleModal('ESC')">✕ Schließen</button>
        </div>
        <div class="inv-grid">
          ${
            items.length > 0
              ? items
                  .map(([id, qty]) => {
                    const item = MEDIEVAL_ITEMS[id as MedievalItemId];
                    return `
                <div class="inv-item-card">
                  <img src="${item?.icon || '/assets/icons/holz.png'}" class="inv-item-icon" />
                  <div class="inv-item-info">
                    <strong>${item?.name || id}</strong>
                    <span>Anzahl: ${qty}</span>
                    <p>${item?.description || ''}</p>
                  </div>
                </div>
              `;
                  })
                  .join('')
              : '<div class="empty-msg">Dein Rucksack ist leer. Ernte Getreide oder sammle Holz!</div>'
          }
        </div>
      </div>
    `;
  }

  public openCraftModal(): void {
    this.activeModal = 'craft';
    this.touchControls.setVisible(false);
    this.modalOverlay.style.display = 'flex';

    this.modalOverlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-tag">🔨 DORFSCHMIEDE & WERKSTATT</span>
          <button class="modal-close-btn" onclick="window.__toggleModal('ESC')">✕ Schließen</button>
        </div>
        <div class="craft-list">
          ${MEDIEVAL_RECIPES.map((r) => {
            const canCraft = gameState.hasItems(r.cost) && r.minChapter <= gameState.chapter;
            const resItem = MEDIEVAL_ITEMS[r.result];
            return `
              <div class="recipe-card ${canCraft ? '' : 'disabled'}">
                <img src="${resItem?.icon || '/assets/icons/schmiede_hammer.png'}" class="recipe-icon" />
                <div class="recipe-info">
                  <strong>${r.name}</strong>
                  <p>${r.description}</p>
                  <div class="cost-row">
                    Kosten: ${Object.entries(r.cost)
                      .map(([k, v]) => `${v}x ${MEDIEVAL_ITEMS[k as MedievalItemId]?.name || k}`)
                      .join(', ')}
                  </div>
                </div>
                <button class="btn-craft ${canCraft ? '' : 'disabled'}" data-id="${r.id}">
                  Herstellen
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.modalOverlay.querySelectorAll('.btn-craft').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id || '';
        if (gameState.craft(id)) {
          sound.questStep();
          gameState.setObjectiveProgress(gameState.chapter, 2, true);
          this.showToast('✅ Erfolgreich geschmiedet / hergestellt!');
          this.openCraftModal();
        } else {
          sound.click();
          this.showToast('❌ Es fehlen Rohstoffe oder das nötige Kapitel!');
        }
      });
    });
  }

  public openBuildModal(): void {
    this.activeModal = 'build';
    this.touchControls.setVisible(false);
    this.modalOverlay.style.display = 'flex';

    this.modalOverlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-tag">🏰 BURG- & DORFAUSBAU</span>
          <button class="modal-close-btn" onclick="window.__toggleModal('ESC')">✕ Schließen</button>
        </div>
        <div class="craft-list">
          ${MEDIEVAL_BUILDINGS.map((b) => {
            const isBuilt = gameState.builtBuildings.has(b.id);
            const canBuild = !isBuilt && gameState.hasItems(b.cost) && b.chapter <= gameState.chapter;
            return `
              <div class="recipe-card ${isBuilt ? 'built' : canBuild ? '' : 'disabled'}">
                <div class="recipe-info">
                  <strong>${b.title} ${isBuilt ? '✓ (Errichtet)' : ''}</strong>
                  <p>${b.description}</p>
                  <div class="cost-row">
                    ${isBuilt ? 'Bereits in der Spielwelt verankert' : `Kosten: ${Object.entries(b.cost).map(([k, v]) => `${v}x ${MEDIEVAL_ITEMS[k as MedievalItemId]?.name || k}`).join(', ')}`}
                  </div>
                </div>
                ${
                  isBuilt
                    ? '<span class="badge-done">Errichtet</span>'
                    : `<button class="btn-craft ${canBuild ? '' : 'disabled'}" data-id="${b.id}">Errichten</button>`
                }
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.modalOverlay.querySelectorAll('.btn-craft').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id || '';
        const bDef = MEDIEVAL_BUILDINGS.find((b) => b.id === id);
        if (gameState.build(id)) {
          sound.success();
          gameState.setObjectiveProgress(gameState.chapter, 3, true);
          this.showToast(`🏰 ${bDef?.title || 'Bauwerk'} in der Spielwelt errichtet!`);
          this.openBuildModal();
        } else {
          sound.click();
          this.showToast('❌ Fehlende Baustoffe oder Vorbedingungen!');
        }
      });
    });
  }

  public openTradeModal(): void {
    this.activeModal = 'trade';
    this.touchControls.setVisible(false);
    this.modalOverlay.style.display = 'flex';

    const trades: Array<{
      id: string;
      giveItem: MedievalItemId;
      giveQty: number;
      getItem: MedievalItemId;
      getQty: number;
      desc: string;
    }> = [
      {
        id: 't_stein_holz',
        giveItem: 'feldstein',
        giveQty: 2,
        getItem: 'holz_balken',
        getQty: 2,
        desc: 'Tausche behauenen Bruchstein beim Zimmermann gegen Eichen-Bauholz.',
      },
      {
        id: 't_holz_eisen',
        giveItem: 'holz_balken',
        giveQty: 3,
        getItem: 'eisen_barren',
        getQty: 2,
        desc: 'Tausche Brennholz & Balken beim Schmied gegen geschmiedetes Eisen.',
      },
      {
        id: 't_roggen_mehl',
        giveItem: 'roggen_saat',
        giveQty: 2,
        getItem: 'mehl_sack',
        getQty: 2,
        desc: 'Lass beim Müller Roggenkorn direkt gegen feines Roggenmehl tauschen.',
      },
      {
        id: 't_heu_brot',
        giveItem: 'heuballen',
        giveQty: 2,
        getItem: 'brot_fladen',
        getQty: 2,
        desc: 'Tausche Wiesenheu am Marktstand gegen frisches Dorfbrot.',
      },
      {
        id: 't_stein_wachs',
        giveItem: 'feldstein',
        giveQty: 2,
        getItem: 'lehnssiegel_wachs',
        getQty: 1,
        desc: 'Tausche Mauersteine beim Klosterboten gegen rotes Siegelwachs.',
      },
    ];

    this.modalOverlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-tag">⚖️ BURGMARKT & TAUSCHHANDEL [H]</span>
          <button class="modal-close-btn" onclick="window.__toggleModal('ESC')">✕ Schließen</button>
        </div>
        <div class="craft-list">
          ${trades
            .map((t) => {
              const canTrade = (gameState.inventory[t.giveItem] || 0) >= t.giveQty;
              const giveDef = MEDIEVAL_ITEMS[t.giveItem];
              const getDef = MEDIEVAL_ITEMS[t.getItem];
              return `
              <div class="recipe-card ${canTrade ? '' : 'disabled'}">
                <img src="${getDef?.icon || '/assets/icons/holz.png'}" class="recipe-icon" />
                <div class="recipe-info">
                  <strong>${t.getQty}x ${getDef?.name || t.getItem} ertauschen</strong>
                  <p>${t.desc}</p>
                  <div class="cost-row">
                    Einsatz: ${t.giveQty}x ${giveDef?.name || t.giveItem} (im Beutel: ${gameState.inventory[t.giveItem] || 0})
                  </div>
                </div>
                <button class="btn-craft ${canTrade ? '' : 'disabled'}" data-id="${t.id}">
                  Tauschen
                </button>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;

    this.modalOverlay.querySelectorAll('.btn-craft').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id || '';
        const t = trades.find((x) => x.id === id);
        if (t && gameState.removeInventory(t.giveItem, t.giveQty)) {
          gameState.addInventory(t.getItem, t.getQty);
          sound.questStep();
          this.showToast(`⚖️ Getauscht: +${t.getQty} ${MEDIEVAL_ITEMS[t.getItem]?.name}!`);
          this.openTradeModal();
        } else {
          sound.click();
          this.showToast('❌ Nicht genügend Tauschware im Beutel!');
        }
      });
    });
  }

  // =========================================================================
  // 7. HISTORISCHER PHASEN-ZEITSTRAHL (Z) & URKUNDE (U)
  // =========================================================================
  public openTimelineModal(): void {
    this.activeModal = 'timeline';
    this.touchControls.setVisible(false);
    this.modalOverlay.style.display = 'flex';

    this.modalOverlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-tag">⏳ THEMENINTERNER PHASEN-ZEITSTRAHL</span>
          <button class="modal-close-btn" onclick="window.__toggleModal('ESC')">✕ Schließen</button>
        </div>
        <div class="timeline-container">
          <div class="timeline-line"></div>
          <div class="timeline-nodes">
            ${MEDIEVAL_CHAPTERS.map((c) => {
              const done = gameState.completedChapters.has(c.id);
              const isCur = c.id === gameState.chapter;
              return `
                <div class="tl-node ${done ? 'done' : isCur ? 'current' : ''}">
                  <div class="tl-circle">${c.roman}</div>
                  <div class="tl-body">
                    <strong>${c.title}</strong>
                    <span>${c.eraName}</span>
                    <p>${c.sub}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  public openCertificateModal(): void {
    this.activeModal = 'certificate';
    this.touchControls.setVisible(false);
    this.modalOverlay.style.display = 'flex';

    const rang = gameState.getChronistenRang();

    this.modalOverlay.innerHTML = `
      <div class="modal-card certificate-card">
        <div class="cert-border">
          <div class="cert-seal">⚜️</div>
          <h1>CHRONISTEN-DIPLOM</h1>
          <h2>DES REICHES BURG STEINFELS</h2>
          <p class="cert-salute">Hiermit wird feierlich beurkundet, dass</p>
          <div class="cert-name">${gameState.playerName}</div>
          <p class="cert-text">
            die Geheimnisse des Feudalsystems, die schwere Last der Grundherrschaft und die ritterlichen Tugenden
            erforscht und mit Weisheit im Schiedsgericht gerichtet hat.
          </p>
          <div class="cert-rank-box">
            <span>Verliehener Rang:</span>
            <strong>${rang.title} (${rang.tier}-Stufe)</strong>
          </div>
          <div class="cert-footer">
            <span>Hefter-Code: <strong>${gameState.generateHefterCode()}</strong></span>
            <span>Gez. Kaiserlicher Notar Notker</span>
          </div>
        </div>
        <button class="btn-primary mt-3" onclick="window.__printHefterSheet()">🖨️ A4-Hefterblatt drucken</button>
      </div>
    `;
  }

  // =========================================================================
  // 8. 7-KACHEL-PAUSE-DASHBOARD (P)
  // =========================================================================
  public openPauseDashboard(): void {
    this.activeModal = 'pause';
    this.touchControls.setVisible(false);
    this.modalOverlay.style.display = 'flex';

    const rang = gameState.getChronistenRang();
    const min = Math.floor(gameState.playTimeSeconds / 60);
    const sec = Math.floor(gameState.playTimeSeconds % 60);
    const timeStr = `${min}:${sec < 10 ? '0' : ''}${sec} Min.`;

    this.modalOverlay.innerHTML = `
      <div class="modal-card pause-card">
        <div class="modal-header">
          <span class="modal-tag">⏸️ CHRONISTEN-ZENTRALE & PAUSE-MENÜ</span>
          <button class="modal-close-btn" onclick="window.__toggleModal('ESC')">✕ Schließen (Esc)</button>
        </div>
        <div class="pause-7-grid">
          <!-- Kachel 1: Hefter-Code -->
          <div class="pause-tile">
            <div class="pt-icon">📝</div>
            <div class="pt-label">Hefter-Speichercode</div>
            <div class="pt-val font-mono">${gameState.generateHefterCode()}</div>
            <span class="pt-sub">Im Geschichtsheft notieren!</span>
          </div>

          <!-- Kachel 2: Rang -->
          <div class="pause-tile">
            <div class="pt-icon">🏆</div>
            <div class="pt-label">Chronisten-Rang</div>
            <div class="pt-val">${rang.title}</div>
            <span class="pt-sub">${gameState.getEpochenPunkte()} Epochenpunkte (${rang.tier})</span>
          </div>

          <!-- Kachel 3: Audio -->
          <div class="pause-tile">
            <div class="pt-icon">🎵</div>
            <div class="pt-label">Audiokulisse</div>
            <div class="pt-val">${sound.isMuted() ? 'Stumm' : 'Aktiv (MP3 + Chiptune)'}</div>
            <button class="pt-btn" onclick="window.__toggleModal('M')">Mute umschalten [M]</button>
          </div>

          <!-- Kachel 4: Relikte -->
          <div class="pause-tile">
            <div class="pt-icon">🏺</div>
            <div class="pt-label">Archäologische Leitfunde</div>
            <div class="pt-val">${gameState.discoveredRelics.size} von 5 geborgen</div>
            <button class="pt-btn" onclick="window.__toggleModal('U')">Urkunde öffnen [U]</button>
          </div>

          <!-- Kachel 5: Lexikon -->
          <div class="pause-tile">
            <div class="pt-icon">📖</div>
            <div class="pt-label">Fachlexikon</div>
            <div class="pt-val">${gameState.chapter * 3} von 27 Begriffen</div>
            <button class="pt-btn" onclick="window.__toggleModal('L')">Lexikon öffnen [L]</button>
          </div>

          <!-- Kachel 6: Bauten -->
          <div class="pause-tile">
            <div class="pt-icon">🏰</div>
            <div class="pt-label">Infrastruktur & Bauten</div>
            <div class="pt-val">${gameState.builtBuildings.size} von 8 Projekten</div>
            <button class="pt-btn" onclick="window.__toggleModal('B')">Bauübersicht [B]</button>
          </div>

          <!-- Kachel 7: Erkundung & Zeit -->
          <div class="pause-tile">
            <div class="pt-icon">⏱️</div>
            <div class="pt-label">Erkundungsstatistik</div>
            <div class="pt-val">${timeStr}</div>
            <span class="pt-sub">👣 ${gameState.walkedDistanceMeters} Meter zurückgelegt</span>
          </div>
        </div>

        <!-- Dashboard Action Bar -->
        <div class="pause-actions-bar">
          <button class="btn-print-hefter" onclick="window.__printHefterSheet()">🖨️ Hefterblatt drucken (DIN A4)</button>
          <button class="btn-primary" onclick="window.__toggleModal('ESC')">▶ Weiter im Abenteuer</button>
        </div>

        <div class="pause-footer-keys">
          WASD / Pfeiltasten: Bewegen · [E] Interagieren · [I] Beutel · [C] Schmiede · [B] Bauen · [L] Lexikon · [Z] Zeitstrahl · [U] Urkunde · [M] Musik · [P/ESC] Pause
        </div>
      </div>
    `;
  }
}
