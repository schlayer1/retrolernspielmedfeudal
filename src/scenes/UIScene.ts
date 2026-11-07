import Phaser from 'phaser';
import { sound } from '../audio/sound';
import { MEDIEVAL_CHAPTERS, ChapterData } from '../data/chapters';
import { MEDIEVAL_BUILDINGS, MEDIEVAL_ITEMS, MEDIEVAL_RECIPES, MedievalItemId } from '../data/items';
import { MEDIEVAL_LEXICON, LexiconEntry } from '../data/lexicon';
import { MEDIEVAL_RELICS, MedievalRelic } from '../data/relics';
import { MEDIEVAL_STATIONS, InteractiveStation, STATIONS } from '../data/stations';
import { MEDIEVAL_DILEMMAS } from '../data/dilemmas';
import { gameState, MEDIEVAL_ROLES } from '../systems/GameState';
import { PlayerGender, PlayerRole } from '../systems/SaveManager';
import { TouchControls } from '../ui/TouchControls';
import { PrintSheet } from '../ui/PrintSheet';
import { DilemmaModal } from '../ui/DilemmaModal';
import { StationModal } from '../ui/StationModal';
import { ArtifactInspectorModal } from '../ui/ArtifactInspectorModal';
import { TimelineModal } from '../ui/TimelineModal';
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
  private stationModal = new StationModal();
  private artifactInspector = new ArtifactInspectorModal();
  private timelineModal = new TimelineModal();
  private lastActionKeyMs = 0;


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
    win.__openArtifactInspector = (rel: any) => this.openArtifactInspector(rel);
    win.__openStation = (stationId: string) => this.openStation(stationId);
    win.__showToast = (msg: string) => this.showToast(msg);
    win.__toggleModal = (mod: string) => this.handleShortcutKey(mod.toUpperCase());
    win.__closeModal = () => this.closeModal();
    win.__openTimeline = () => this.openTimelineModal();
    win.__triggerPrintSheet = () => {
      gameState.storyFlags['opened_certificate'] = true;
      gameState.notify();
      this.printSheet.print();
    };
    win.__eatFood = () => {
      const msg = gameState.eat();
      this.showToast(msg);
    };
    win.__printHefterSheet = () => {
      gameState.storyFlags['opened_certificate'] = true;
      gameState.notify();
      this.printSheet.print();
    };
    win.__openDilemma = (dilemmaId: string) => this.openDilemma(dilemmaId);
    win.__MEDIEVAL_CHAPTERS = MEDIEVAL_CHAPTERS;
    win.__MEDIEVAL_RELICS = MEDIEVAL_RELICS;
    win.__gameState = gameState;
    win.__MED_UI__ = this;
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
    this.hudHeader.className = 'hud-top';

    this.questBox = document.createElement('div');
    this.questBox.id = 'quest-tracker';
    this.questBox.className = 'hud-bottom';

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

      if (['I', 'C', 'B', 'H', 'F', 'L', 'Z', 'U', 'P', 'M', 'K'].includes(key)) {
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
      this.renderHUD();
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
    if (key === 'K') {
      if (this.activeModal === 'start') this.closeModal();
      else this.openStartScreen();
      return;
    }
  }

  public closeModal(): void {
    this.activeModal = 'none';
    this.modalOverlay.style.display = 'none';
    this.dilemmaModal.close();
    this.stationModal.close();
    this.artifactInspector.close();
    this.timelineModal.close();
    this.touchControls.setVisible(true);

    this.renderHUD();
    this.renderQuestTracker();

    const world = this.scene.get('WorldScene') as WorldScene;
    if (world && world.resetDialogFocus) {
      world.resetDialogFocus();
    }
  }

  public openDilemma(dilemmaId: string): void {
    const dilemma = MEDIEVAL_DILEMMAS.find((d) => d.id === dilemmaId);
    if (!dilemma) return;
    this.activeModal = 'dilemma';
    this.touchControls.setVisible(false);
    this.dilemmaModal.open(dilemma, (opt) => {
      for (const [k, v] of Object.entries(opt.rewards)) {
        gameState.addInventory(k as MedievalItemId, v);
      }
      gameState.storyFlags[opt.storyFlag] = true;
      gameState.dilemmaSummary = `${dilemma.conflictTitle}: ${opt.title}`;
      gameState.safety = Math.min(100, gameState.safety + 10);
      gameState.knowledge = Math.min(100, gameState.knowledge + 8);
      gameState.notify();
      this.showToast(`⚖️ Schiedsspruch besiegelt: "${opt.title}"`);
      this.closeModal();
    });
  }

  // =========================================================================
  // HUD (STEINZEIT-STATUSBALKEN + SHORTCUTS + UNTERES HOTBAR-INVENTAR)
  // =========================================================================
  public renderHUD(): void {
    this.hudHeader.style.display = this.activeModal === 'start' ? 'none' : 'flex';
    this.questBox.style.display = this.activeModal === 'start' ? 'none' : 'flex';
    if (this.touchControls) {
      this.touchControls.setVisible(this.activeModal === 'none');
    }

    const curCh = MEDIEVAL_CHAPTERS.find((c) => c.id === gameState.chapter) || MEDIEVAL_CHAPTERS[0];
    const roleDef = MEDIEVAL_ROLES.find((r) => r.id === gameState.role) || MEDIEVAL_ROLES[0];
    const steps = gameState.getQuestStepProgress(curCh.id);
    const allDone = gameState.checkQuest(curCh.id);
    const activeStepIdx = steps.findIndex((s) => !s.done);

    const taskText = allDone
      ? `Alle Aufgaben gemeistert! Sprich mit ${curCh.mentor.name} für das Lehns-Quiz (E).`
      : curCh.objective;

    const foodPct = Math.max(0, Math.min(100, Math.round(gameState.food)));
    const safetyPct = Math.max(0, Math.min(100, Math.round(gameState.safety)));
    const knowPct = Math.max(0, Math.min(100, Math.round(gameState.knowledge)));

    this.hudHeader.innerHTML = `
      <div class="hud-card" id="hud-quest-box">
        <div id="hud-chapter-title">
          ⚔️ Kap. ${curCh.number}: ${curCh.title} (${curCh.eraName || 'Hochmittelalter'}) · ${gameState.playerName} (${roleDef.name})
        </div>
        <div id="hud-quest">
          <div style="margin-bottom:4px;">📋 <strong>Aufgabe:</strong> ${taskText}</div>
          <div class="quest-steps-list" style="margin:4px 0;">
            ${steps
              .map((s, idx) => {
                if (s.done) {
                  return `
                    <div class="quest-step-item step-done" style="display:flex;align-items:center;gap:6px;font-size:11px;color:#86efac;">
                      <span>✅</span>
                      <span style="text-decoration:line-through;opacity:0.85;">${s.label}</span>
                    </div>
                  `;
                }
                if (idx === activeStepIdx) {
                  return `
                    <div class="quest-step-item step-active" style="display:flex;align-items:center;gap:6px;font-size:11px;color:#fde047;background:rgba(217,119,6,0.22);padding:2px 6px;border-radius:4px;border:1px solid #d97706;font-weight:700;">
                      <span>⏳</span>
                      <span>${s.label}</span>
                    </div>
                  `;
                }
                return `
                  <div class="quest-step-item step-locked" style="display:flex;align-items:center;gap:6px;font-size:10.5px;color:#94a3b8;opacity:0.65;">
                    <span>🔒</span>
                    <span>Aufgabe ${idx + 1}: Noch nicht freigeschaltet (Erst vorherige Aufgabe abschließen)</span>
                  </div>
                `;
              })
              .join('')}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-top:4px;">
            <span style="font-size:10.5px;color:${allDone ? '#4ade80' : '#fde68a'};">
              ${allDone ? `✨ Bereit für Lehns-Quiz bei ${curCh.mentor.name} [E]!` : `💡 Mentor: ${curCh.mentor.name} [E]`}
            </span>
            <button id="btn-open-mentor-dialog" class="hud-btn" style="padding:2px 7px;font-size:10.5px;">
              💬 ${curCh.mentor.name}
            </button>
          </div>
        </div>
        <div id="hud-compass" class="hud-compass-line">${gameState.compassText || '🧭 Wegweiser wird berechnet...'}</div>
      </div>

      <div class="hud-right">
        <div class="hud-card" id="hud-bars-card">
          <div class="bar-row" title="Vorräte & Nahrung (Taste F zum Essen)">
            <span>🍖 Vorräte</span>
            <div class="bar-track"><div class="bar-fill orange" id="bar-food" style="width:${foodPct}%"></div></div>
            <span id="val-food">${foodPct}%</span>
          </div>
          <div class="bar-row" title="Lehns-Treue & Ordnung (Burgen & Infrastruktur)">
            <span>🛡️ Lehns-Treue</span>
            <div class="bar-track"><div class="bar-fill blue" id="bar-safety" style="width:${safetyPct}%"></div></div>
            <span id="val-safety">${safetyPct}%</span>
          </div>
          <div class="bar-row" title="Bildung & Glaube (Relikte & Skriptorium)">
            <span>📜 Bildung & Glaube</span>
            <div class="bar-track"><div class="bar-fill yellow" id="bar-knowledge" style="width:${knowPct}%"></div></div>
            <span id="val-knowledge">${knowPct}%</span>
          </div>
          <div class="hud-subinfo">
            Lexikon: <b id="hud-lex-count">${gameState.unlockedLexicon.size}/27</b> ·
            🏺 Relikte: <b>${gameState.discoveredRelics.size}/5</b> ·
            <span id="hud-time-of-day">☀️ Tag</span> ·
            🎵 Musik: <b id="hud-music-state">${sound.bgmMuted ? 'Aus' : 'An'}</b>
          </div>
        </div>

        <div class="hud-btn-row">
          <button class="hud-btn ${this.activeModal === 'pause' ? 'active' : ''}" id="btn-pause" data-modal="pause" title="Pause-Dashboard [P / ESC]"><span class="key-badge">P</span> ⏸ Pause</button>
          <button class="hud-btn ${this.activeModal === 'inventory' ? 'active' : ''}" id="btn-bag" data-modal="inventory" title="Beutel & Relikte [I]"><span class="key-badge">I</span> 🎒 Beutel</button>
          <button class="hud-btn ${this.activeModal === 'craft' ? 'active' : ''}" id="btn-craft" data-modal="craft" title="Handwerk [C]"><span class="key-badge">C</span> Handwerk</button>
          <button class="hud-btn ${this.activeModal === 'trade' ? 'active' : ''}" id="btn-trade" data-modal="trade" title="Markt [H]"><span class="key-badge">H</span> Markt</button>
          <button class="hud-btn ${this.activeModal === 'lexicon' ? 'active' : ''}" id="btn-lexicon" data-modal="lexicon" title="Mittelalter-Lexikon (27 Begriffe) [L]"><span class="key-badge">L</span> Lexikon</button>
          <button class="hud-btn ${this.activeModal === 'timeline' ? 'active' : ''}" id="btn-timeline" data-modal="timeline" title="Epochen-Zeitstrahl [Z]"><span class="key-badge">Z</span> Zeitstrahl</button>
          <button class="hud-btn" id="btn-eat" data-action="eat" title="Proviant essen [F]"><span class="key-badge">F</span> Essen</button>
          <button class="hud-btn" id="btn-music" data-action="music" title="Musik an/aus [M]"><span class="key-badge">M</span> 🎵 Musik</button>
          <button class="hud-btn" id="btn-epoch" data-modal="start" title="Kapitel wählen [K]"><span class="key-badge">K</span> Epoche</button>
          <button class="hud-btn ${this.activeModal === 'certificate' ? 'active' : ''}" id="btn-cert" data-modal="certificate" title="Chronisten-Diplom [U]"><span class="key-badge">U</span> Diplom</button>
        </div>
      </div>
    `;

    const mentorBtn = this.hudHeader.querySelector('#btn-open-mentor-dialog');
    if (mentorBtn) {
      mentorBtn.addEventListener('click', () => {
        sound.click();
        this.openMentorDialog(curCh);
      });
    }

    this.hudHeader.querySelectorAll('.hud-btn').forEach((btn) => {
      if (btn.id === 'btn-open-mentor-dialog') return;
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action === 'eat') {
          this.eatFood();
          return;
        }
        if (action === 'music') {
          this.handleShortcutKey('M');
          return;
        }
        const m = btn.getAttribute('data-modal') as ModalType;
        if (m) {
          if (m === 'start') {
            this.openStartScreen();
          } else if (m === 'pause') {
            this.openPauseDashboard();
          } else if (m === 'inventory') {
            this.openInventoryModal();
          } else if (m === 'craft') {
            this.openCraftModal();
          } else if (m === 'trade') {
            this.openTradeModal();
          } else if (m === 'lexicon') {
            this.openLexiconModal();
          } else if (m === 'timeline') {
            this.openTimelineModal();
          } else if (m === 'certificate') {
            this.openCertificateModal();
          }
        }
      });
    });
  }

  public renderQuestTracker(): void {
    this.questBox.style.display = this.activeModal === 'start' ? 'none' : 'flex';
    const hotbarItems: MedievalItemId[] = [
      'roggen_saat',
      'brot_fladen',
      'holz_balken',
      'feldstein',
      'eisen_barren',
      'ritter_hufeisen',
      'pergament_bogen',
      'silber_pfennig',
    ];

    const slotsHtml = hotbarItems
      .map((itemId, idx) => {
        const def = MEDIEVAL_ITEMS[itemId];
        const qty = gameState.inventory[itemId] || 0;
        return `
          <div class="hotbar-slot ${qty > 0 ? 'has-item' : ''}" data-slot-item="${itemId}" title="${def ? def.name : itemId} (${qty} im Beutel)">
            <img src="${def ? def.icon : '/assets/icons/relic_marker_glow.png'}" alt="${def ? def.name : itemId}" style="opacity:${qty > 0 ? '1' : '0.32'}" />
            <span class="count">${qty > 0 ? qty : idx + 1}</span>
          </div>
        `;
      })
      .join('');

    const relicSlotsHtml = MEDIEVAL_RELICS.map((r) => {
      const found = gameState.discoveredRelics.has(r.id);
      return `
        <div class="hotbar-slot relic-slot ${found ? 'has-item' : ''}" data-slot-relic="${r.id}" title="${found ? r.name : `Unentdecktes Relikt`}">
          <img src="${r.icon}" alt="${r.name}" style="opacity:${found ? '1' : '0.25'}" />
          <span class="count">${found ? '★' : '🔒'}</span>
        </div>
      `;
    }).join('');

    this.questBox.innerHTML = `
      <div id="hud-hint">WASD / Pfeiltasten = Bewegen · E = Interagieren · F = Essen · C = Handwerk · I = Beutel · P = Pause</div>
      <div class="hud-bottom-row">
        <div id="hud-hotbar">
          ${slotsHtml}
          ${relicSlotsHtml}
        </div>
        <button class="hud-btn" id="btn-hotbar-bag" title="Beutel öffnen [I]">
          <span class="key-badge">I</span> 🎒 Beutel
        </button>
      </div>
    `;

    this.questBox.querySelector('#btn-hotbar-bag')?.addEventListener('click', () => {
      this.openInventoryModal();
    });

    this.questBox.querySelectorAll('[data-slot-item]').forEach((el) => {
      el.addEventListener('click', () => {
        this.openInventoryModal();
      });
    });

    this.questBox.querySelectorAll('[data-slot-relic]').forEach((el) => {
      el.addEventListener('click', () => {
        const relId = el.getAttribute('data-slot-relic');
        if (relId) this.openArtifactInspector(relId);
      });
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
                <button class="role-btn ${gameState.gender === 'male' ? 'active' : ''}" id="btn-gender-male">
                  <img src="${gameState.malePreviewUrl || '/assets/characters/keep_squire.png'}" style="width:20px;height:40px;image-rendering:pixelated;vertical-align:middle;margin-right:6px;" />
                  👦 Konrad (Knappe)
                </button>
                <button class="role-btn ${gameState.gender === 'female' ? 'active' : ''}" id="btn-gender-female">
                  <img src="${gameState.femalePreviewUrl || '/assets/characters/keep_peasant_f.png'}" style="width:20px;height:40px;image-rendering:pixelated;vertical-align:middle;margin-right:6px;" />
                  👧 Mathilda (Bäuerin)
                </button>
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
      (this.scene.get('WorldScene') as any)?.refreshCharacterAppearance?.();
    });
    btnFemale?.addEventListener('click', () => {
      gameState.gender = 'female';
      if (!nameInput.value || nameInput.value === 'Konrad') {
        nameInput.value = 'Mathilda';
        gameState.playerName = 'Mathilda';
      }
      btnFemale.classList.add('active');
      btnMale?.classList.remove('active');
      (this.scene.get('WorldScene') as any)?.refreshCharacterAppearance?.();
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
        if (ch.id === 1 && !gameState.storyFlags['meier_seeds_given']) {
          gameState.storyFlags['meier_seeds_given'] = true;
          gameState.addInventory('roggen_saat', 2);
          this.showToast('🌾 Meier Heinrich: "Nimm diese 2x Roggen-Saat! Mahle sie an der Mühle oder mit [C] zu Mehl!"');
        } else {
          this.showToast(`✅ Aufgabe 1/4 erfüllt! Erforsche nun den Hof und folge dem Kompass.`);
        }
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
    const portraitSrc = ch.mentor.portraitKey
      ? `/assets/portraits/${ch.mentor.portraitKey}_${allDone ? 'happy' : 'neutral'}.png`
      : ch.mentor.avatar;

    this.modalOverlay.innerHTML = `
      <div class="dialog-box">
        <div class="dialog-avatar-wrap">
          <div class="dialog-avatar-frame">
            <img src="${portraitSrc}" alt="${ch.mentor.name}" class="dialog-avatar-img" style="width:64px;height:64px;object-fit:cover;image-rendering:pixelated;" />
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
  public openArtifactInspector(relicIdOrObj: string | MedievalRelic): void {
    const id = typeof relicIdOrObj === 'string' ? relicIdOrObj : relicIdOrObj?.id;
    const rel = MEDIEVAL_RELICS.find((r) => r.id === id) || MEDIEVAL_RELICS[0];
    if (!rel) return;
    this.closeModal();
    this.artifactInspector.open(rel, () => {
      this.renderHUD();
    });
  }

  // =========================================================================
  // 4. HAPTISCHE MINI-STATIONEN & PROVIANT
  // =========================================================================
  public eatFood(): void {
    const msg = gameState.eat();
    this.showToast(msg);
    this.renderHUD();
  }

  public openStation(stationIdOrObj: string | InteractiveStation): void {
    const id = typeof stationIdOrObj === 'string' ? stationIdOrObj : stationIdOrObj?.id;
    const st = MEDIEVAL_STATIONS.find((s) => s.id === id) || MEDIEVAL_STATIONS[0];
    if (!st) return;
    this.closeModal();
    this.stationModal.open(st, () => {
      this.showToast(`🏛️ Station gemeistert: ${st.title}! (+100 Punkte)`);
      sound.playSuccess();
      this.renderHUD();
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
            const check = gameState.canBuildBuilding(b.id);
            const isBuilt = check.isBuilt;
            const canBuild = check.allowed;
            const isCurrentOrPast = b.chapter <= gameState.chapter;
            return `
              <div class="recipe-card ${isBuilt ? 'built' : canBuild ? '' : 'disabled'}" style="${!isCurrentOrPast ? 'opacity:0.6;' : ''}">
                <div class="recipe-info">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                    <strong>${b.title} ${isBuilt ? '✓ (Errichtet)' : ''}</strong>
                    <span style="font-size:10px;padding:1px 6px;border-radius:4px;background:#3b2416;color:#fde68a;border:1px solid #78350f;">Kapitel ${b.chapter}</span>
                  </div>
                  <p>${b.description}</p>
                  <div class="cost-row">
                    ${isBuilt ? 'Bereits in der Spielwelt verankert' : `Kosten: ${Object.entries(b.cost).map(([k, v]) => `${v}x ${MEDIEVAL_ITEMS[k as MedievalItemId]?.name || k}`).join(', ')}`}
                  </div>
                  ${!isBuilt && !canBuild ? `<div style="font-size:11px;color:#f87171;margin-top:4px;">⚠️ ${check.lockedReason}</div>` : ''}
                </div>
                ${
                  isBuilt
                    ? '<span class="badge-done">Errichtet</span>'
                    : `<button class="btn-craft ${canBuild ? '' : 'disabled'}" data-id="${b.id}" ${canBuild ? '' : 'disabled'}>${canBuild ? 'Errichten' : 'Gesperrt'}</button>`
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
        id: 't_wolle_silber',
        giveItem: 'wollballen',
        giveQty: 2,
        getItem: 'silber_pfennig',
        getQty: 3,
        desc: 'Verkaufe geschorene Schafwolle an Tuchhändler für Kölner Silberpfennige.',
      },
      {
        id: 't_stein_erz',
        giveItem: 'feldstein',
        giveQty: 2,
        getItem: 'eisenerz',
        getQty: 2,
        desc: 'Tausche groben Bruchstein bei Bergleuten gegen rohes Eisenerz.',
      },
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
          if (t.id === 't_wolle_silber') {
            gameState.storyFlags['traded_wool_silver'] = true;
          }
          gameState.notify();
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
    this.closeModal();
    this.timelineModal.open(() => {
      this.renderHUD();
    });
  }

  public openCertificateModal(): void {
    this.activeModal = 'certificate';
    gameState.storyFlags['opened_certificate'] = true;
    gameState.notify();
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
