export class TouchControls {
  public dx = 0;
  public dy = 0;
  public actionPressed = false;
  private container: HTMLDivElement | null = null;
  private knob: HTMLDivElement | null = null;
  private baseRect: DOMRect | null = null;
  private activeTouchId: number | null = null;
  private onMenuToggle?: (key: string) => void;
  private visibleWanted = true;

  constructor(onMenuToggle?: (key: string) => void) {
    this.onMenuToggle = onMenuToggle;
    this.initDOM();
  }

  public isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 900;
  }

  public setVisible(visible: boolean): void {
    this.visibleWanted = visible;
    if (!this.container) return;
    this.container.style.display = visible && this.isTouchDevice() ? 'flex' : 'none';
  }

  private initDOM() {
    this.container = document.createElement('div');
    this.container.id = 'touch-controls-overlay';
    this.container.className = 'touch-controls-overlay';
    if (!this.isTouchDevice()) {
      this.container.style.display = 'none';
    }

    // Left Joystick
    const joyBase = document.createElement('div');
    joyBase.className = 'touch-joystick-base';
    this.knob = document.createElement('div');
    this.knob.className = 'touch-joystick-knob';
    joyBase.appendChild(this.knob);

    joyBase.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this.activeTouchId = touch.identifier;
        this.baseRect = joyBase.getBoundingClientRect();
        this.updateJoystick(touch.clientX, touch.clientY);
      },
      { passive: false },
    );

    joyBase.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === this.activeTouchId) {
            this.updateJoystick(t.clientX, t.clientY);
            break;
          }
        }
      },
      { passive: false },
    );

    const resetJoy = () => {
      this.dx = 0;
      this.dy = 0;
      this.activeTouchId = null;
      if (this.knob) {
        this.knob.style.transform = 'translate(-50%, -50%)';
      }
    };

    joyBase.addEventListener('touchend', resetJoy);
    joyBase.addEventListener('touchcancel', resetJoy);

    // Right Action Buttons
    const btnGroup = document.createElement('div');
    btnGroup.className = 'touch-action-buttons';

    const createBtn = (label: string, sub: string, onClick: () => void, isBig = false) => {
      const b = document.createElement('button');
      b.className = `touch-btn ${isBig ? 'touch-btn-action' : 'touch-btn-sub'}`;
      b.innerHTML = `<span class="t-key">${label}</span><span class="t-sub">${sub}</span>`;
      b.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onClick();
      });
      return b;
    };

    const btnAction = createBtn(
      'E',
      'Aktion',
      () => {
        this.actionPressed = true;
        this.onMenuToggle?.('E');
        setTimeout(() => (this.actionPressed = false), 200);
      },
      true,
    );

    const btnInv = createBtn('I', 'Beutel', () => this.onMenuToggle?.('I'));
    const btnCraft = createBtn('C', 'Werkstatt', () => this.onMenuToggle?.('C'));
    const btnLex = createBtn('L', 'Lexikon', () => this.onMenuToggle?.('L'));
    const btnPause = createBtn('P', 'Menü', () => this.onMenuToggle?.('P'));

    const subCol = document.createElement('div');
    subCol.className = 'touch-sub-column';
    subCol.appendChild(btnInv);
    subCol.appendChild(btnCraft);
    subCol.appendChild(btnLex);
    subCol.appendChild(btnPause);

    btnGroup.appendChild(subCol);
    btnGroup.appendChild(btnAction);

    this.container.appendChild(joyBase);
    this.container.appendChild(btnGroup);
    document.body.appendChild(this.container);
  }

  private updateJoystick(cx: number, cy: number) {
    if (!this.baseRect || !this.knob) return;
    const centerX = this.baseRect.left + this.baseRect.width / 2;
    const centerY = this.baseRect.top + this.baseRect.height / 2;
    let diffX = cx - centerX;
    let diffY = cy - centerY;
    const maxRadius = this.baseRect.width / 2;
    const dist = Math.hypot(diffX, diffY);

    if (dist > maxRadius) {
      diffX = (diffX / dist) * maxRadius;
      diffY = (diffY / dist) * maxRadius;
    }

    this.knob.style.transform = `translate(calc(-50% + ${diffX}px), calc(-50% + ${diffY}px))`;
    this.dx = dist > 8 ? diffX / maxRadius : 0;
    this.dy = dist > 8 ? diffY / maxRadius : 0;
  }
}
