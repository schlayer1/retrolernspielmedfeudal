import { sound } from '../audio/sound';

export interface BannerInfo {
  icon?: string;
  chapterNumber?: number;
  title: string;
  subtitle?: string;
}

export class ChapterBanner {
  private el: HTMLElement;
  private timeoutId: any = null;

  constructor() {
    const existing = document.getElementById('chapter-banner-overlay');
    if (existing) {
      this.el = existing;
    } else {
      this.el = document.createElement('div');
      this.el.id = 'chapter-banner-overlay';
      this.el.className = 'chapter-banner';
      this.el.style.display = 'none';
      document.body.appendChild(this.el);
    }
    this.injectStyles();
  }

  public show(info: BannerInfo): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);

    // Strippe eventuelle Doppel-Präfixe wie "Kapitel 1: "
    const cleanTitle = info.title.replace(/^Kapitel\s*[0-9IVX]+\s*[:–-]\s*/i, '');
    const chapterPrefix = info.chapterNumber !== undefined ? `KAPITEL ${info.chapterNumber}: ` : '';

    this.el.innerHTML = `
      <div class="banner-inner">
        <div class="banner-icon">${info.icon || '⚔️'}</div>
        <div class="banner-text">
          <div class="banner-main">${chapterPrefix}${cleanTitle}</div>
          ${info.subtitle ? `<div class="banner-sub">${info.subtitle}</div>` : ''}
        </div>
      </div>
      <div class="banner-glow-line"></div>
    `;

    this.el.style.display = 'flex';
    this.el.classList.remove('banner-hide');
    this.el.classList.add('banner-show');

    try {
      sound.door();
    } catch {}

    this.timeoutId = setTimeout(() => {
      this.el.classList.remove('banner-show');
      this.el.classList.add('banner-hide');
      setTimeout(() => {
        this.el.style.display = 'none';
      }, 500);
    }, 2800);
  }

  private injectStyles(): void {
    if (document.getElementById('chapter-banner-styles')) return;

    const style = document.createElement('style');
    style.id = 'chapter-banner-styles';
    style.textContent = `
      .chapter-banner {
        position: fixed;
        top: 52px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 45;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .banner-show {
        opacity: 1;
        transform: translate(-50%, 0);
      }
      .banner-hide {
        opacity: 0;
        transform: translate(-50%, -18px);
      }
      .banner-inner {
        background: linear-gradient(180deg, rgba(26, 20, 16, 0.96) 0%, rgba(14, 10, 8, 0.98) 100%);
        border: 2px solid #d97706;
        border-radius: 8px;
        padding: 8px 22px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(217, 119, 6, 0.35);
      }
      .banner-icon {
        font-size: 26px;
      }
      .banner-text {
        display: flex;
        flex-direction: column;
      }
      .banner-main {
        font-family: system-ui, sans-serif;
        font-size: 15px;
        font-weight: 800;
        color: #fde68a;
        letter-spacing: 0.8px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.8);
      }
      .banner-sub {
        font-family: system-ui, sans-serif;
        font-size: 11px;
        color: #e5e7eb;
        opacity: 0.9;
      }
      .banner-glow-line {
        width: 140px;
        height: 2px;
        margin-top: 4px;
        background: linear-gradient(90deg, transparent, #fbbf24, transparent);
        box-shadow: 0 0 8px #fbbf24;
      }
    `;
    document.head.appendChild(style);
  }
}
