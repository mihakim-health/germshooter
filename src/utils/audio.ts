import { InfectionRoute } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // 저장된 음소거 상태 복원
    const saved = localStorage.getItem('retro_sound_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('retro_sound_muted', String(this.isMuted));
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('retro_sound_muted', String(this.isMuted));
  }

  // 1. 발사음 (탄 종류에 따라 주파수 특성 변화)
  public playLaser(route: InfectionRoute) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      let startFreq = 880;
      let endFreq = 220;
      let waveType: OscillatorType = 'square';

      if (route === 'digestive') {
        startFreq = 700;
        endFreq = 180;
        waveType = 'triangle';
      } else if (route === 'respiratory') {
        startFreq = 1100;
        endFreq = 300;
        waveType = 'sawtooth';
      } else {
        startFreq = 950;
        endFreq = 250;
        waveType = 'square';
      }

      osc.type = waveType;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Audio fallback fail-safe
    }
  }

  // 2. 튕겨나감 (오답 탄 발사 시 금속성 쇳소리)
  public playClang() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.setValueAtTime(260, now + 0.04);
      osc2.frequency.setValueAtTime(480, now);
      osc2.frequency.setValueAtTime(390, now + 0.04);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.23);
      osc2.stop(now + 0.23);
    } catch {
      // ignore
    }
  }

  // 3. 세균 격파 폭발음 (노이즈 버스트 + 저음 피치 드롭)
  public playExplosion(isBoss: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const duration = isBoss ? 0.6 : 0.28;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // 화이트 노이즈 생성
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const now = this.ctx.currentTime;
      filter.frequency.setValueAtTime(isBoss ? 1200 : 800, now);
      filter.frequency.exponentialRampToValueAtTime(isBoss ? 80 : 120, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isBoss ? 0.5 : 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + duration + 0.05);
    } catch {
      // ignore
    }
  }

  // 4. 콤보 상승 차임벨
  public playCombo(comboCount: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // 도-레-미-솔-라-도 음계 기반
      const baseFreqs = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      const noteIdx = Math.min(comboCount, baseFreqs.length - 1);
      const freq = baseFreqs[noteIdx];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // ignore
    }
  }

  // 5. 플레이어 피격음
  public playPlayerHurt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.25);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.31);
    } catch {
      // ignore
    }
  }

  // 6. 세균 포자 발사음
  public playSpore() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.1);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // ignore
    }
  }

  // 7. 웨이브 클리어 승리 팡파르
  public playWaveClear() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 880];
      const now = this.ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const noteStart = now + i * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.2, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.26);
      });
    } catch {
      // ignore
    }
  }

  // 8. 보스 등장 경보 사이렌
  public playBossAlert() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.linearRampToValueAtTime(700, now + 0.2);
      osc.frequency.linearRampToValueAtTime(350, now + 0.4);
      osc.frequency.linearRampToValueAtTime(700, now + 0.6);
      osc.frequency.linearRampToValueAtTime(350, now + 0.8);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.95);
    } catch {
      // ignore
    }
  }

  // 9. 최종 승리 팡파르
  public playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
      const durations = [0.15, 0.15, 0.15, 0.25, 0.15, 0.5];
      const now = this.ctx.currentTime;
      let cur = now;

      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const dur = durations[i];

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, cur);

        gain.gain.setValueAtTime(0.18, cur);
        gain.gain.exponentialRampToValueAtTime(0.001, cur + dur);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(cur);
        osc.stop(cur + dur + 0.05);

        cur += dur * 0.9;
      });
    } catch {
      // ignore
    }
  }
}

export const sound = new SoundEngine();
