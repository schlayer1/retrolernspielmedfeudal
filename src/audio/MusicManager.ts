import { CHAPTERS } from '../data/chapters';

export class MusicManager {
  private static instance: MusicManager;
  private currentTrackId: string | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.45;
  private synthCtx: AudioContext | null = null;
  private synthInterval: any = null;

  private constructor() {
    // Singleton
  }

  public static getInstance(): MusicManager {
    if (!MusicManager.instance) {
      MusicManager.instance = new MusicManager();
    }
    return MusicManager.instance;
  }

  public playChapterMusic(trackOrChapter: string | number | any): void {
    let trackId = 'med_k01_fronhof';
    if (typeof trackOrChapter === 'number') {
      const ch = CHAPTERS.find((c) => c.id === trackOrChapter);
      if (ch?.music?.trackId) trackId = ch.music.trackId;
    } else if (typeof trackOrChapter === 'string') {
      trackId = trackOrChapter;
    } else if (trackOrChapter && typeof trackOrChapter === 'object' && trackOrChapter.id) {
      const ch = CHAPTERS.find((c) => c.id === trackOrChapter.id);
      if (ch?.music?.trackId) trackId = ch.music.trackId;
    }

    if (this.currentTrackId === trackId && (this.audioEl || this.synthInterval)) {
      return;
    }

    this.stopCurrent();
    this.currentTrackId = trackId;

    if (this.isMuted) return;

    const mp3Path = `/assets/audio/${trackId}.mp3`;
    const audio = new Audio(mp3Path);
    audio.loop = true;
    audio.volume = this.volume;

    audio
      .play()
      .then(() => {
        this.audioEl = audio;
      })
      .catch(() => {
        // Fallback to WebAudio procedural 16-bit synth
        this.startProceduralMedievalSynth(trackId);
      });
  }

  private startProceduralMedievalSynth(trackId: string): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.synthCtx) {
        this.synthCtx = new AudioCtx();
      }
      if (this.synthCtx.state === 'suspended') {
        this.synthCtx.resume();
      }

      // Medieval modal scale: D Dorian (D, E, F, G, A, B, C, D)
      const freqs = [146.83, 164.81, 174.61, 196.0, 220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0];
      let step = 0;

      this.synthInterval = setInterval(() => {
        if (!this.synthCtx || this.isMuted) return;
        const now = this.synthCtx.currentTime;

        // Plucked lute note
        const osc = this.synthCtx.createOscillator();
        const gain = this.synthCtx.createGain();

        const fIndex = (step * 3 + (step % 5)) % freqs.length;
        osc.type = step % 4 === 0 ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(freqs[fIndex], now);

        gain.gain.setValueAtTime(this.volume * 0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

        osc.connect(gain);
        gain.connect(this.synthCtx.destination);

        osc.start(now);
        osc.stop(now + 0.6);

        // Gentle hurdy-gurdy drone on root D
        if (step % 8 === 0) {
          const droneOsc = this.synthCtx.createOscillator();
          const droneGain = this.synthCtx.createGain();
          droneOsc.type = 'sawtooth';
          droneOsc.frequency.setValueAtTime(73.42, now); // D2
          droneGain.gain.setValueAtTime(this.volume * 0.05, now);
          droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

          droneOsc.connect(droneGain);
          droneGain.connect(this.synthCtx.destination);
          droneOsc.start(now);
          droneOsc.stop(now + 2.3);
        }

        step++;
      }, 340);
    } catch (e) {
      // AudioContext blocked
    }
  }

  public stopCurrent(): void {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl = null;
    }
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopCurrent();
    } else if (this.currentTrackId) {
      const t = this.currentTrackId;
      this.currentTrackId = null;
      this.playChapterMusic(t);
    }
    return this.isMuted;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioEl) {
      this.audioEl.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public isAudioMuted(): boolean {
    return this.isMuted;
  }
}

export const music = MusicManager.getInstance();
