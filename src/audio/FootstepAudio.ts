/**
 * FootstepAudio - Prozeduraler WebAudio-Synthesizer für 16-Bit-Schrittgeräusche
 * Erzeugt untergrundabhängige akustische Schrittgeräusche ohne externe Audio-Assets.
 */

export type GroundSurface = 'stone' | 'dirt' | 'grass' | 'wood';

export class FootstepAudioSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled = true;

  constructor(audioCtx?: AudioContext | null) {
    if (audioCtx) this.ctx = audioCtx;
  }

  public setContext(ctx: AudioContext | null) {
    this.ctx = ctx;
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playFootstep(surface: GroundSurface = 'stone', volume = 0.04) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    switch (surface) {
      case 'stone':
        this.playStoneStep(ctx, t, volume);
        break;
      case 'dirt':
        this.playDirtStep(ctx, t, volume);
        break;
      case 'grass':
        this.playGrassStep(ctx, t, volume);
        break;
      case 'wood':
        this.playWoodStep(ctx, t, volume);
        break;
    }
  }

  /**
   * Marmor / Pflastersteine (Forum Romanum, Via Sacra):
   * Helles, trockenes Klicken mit Bandpass-Filter bei 1100-1400 Hz.
   */
  private playStoneStep(ctx: AudioContext, t: number, vol: number) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240 + Math.random() * 60, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1250 + Math.random() * 150, t);
    filter.Q.setValueAtTime(2.2, t);

    gain.gain.setValueAtTime(vol * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Sand / Lehmpfade / Schotter:
   * Weicheres, gedämpftes Rauschen/Knirschen mit Tiefpass bei 450 Hz.
   */
  private playDirtStep(ctx: AudioContext, t: number, vol: number) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140 + Math.random() * 40, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.06);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420 + Math.random() * 80, t);

    gain.gain.setValueAtTime(vol * 0.75, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  /**
   * Wiese / Gras (Palatin-Hügel, Haine):
   * Sanftes, leichtes Rascheln mit Hochpass bei 1800 Hz.
   */
  private playGrassStep(ctx: AudioContext, t: number, vol: number) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320 + Math.random() * 100, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.05);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800, t);

    gain.gain.setValueAtTime(vol * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * Holzstege / Brücken (Pons Sublicius, Pons Milvius, Hafen Ostia):
   * Resonantes, hohles Klopfen bei ca. 220 Hz mit kurzem Peak.
   */
  private playWoodStep(ctx: AudioContext, t: number, vol: number) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210 + Math.random() * 30, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.07);

    filter.type = 'peaking';
    filter.frequency.setValueAtTime(230, t);
    filter.gain.setValueAtTime(6, t);

    gain.gain.setValueAtTime(vol * 0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }
}
