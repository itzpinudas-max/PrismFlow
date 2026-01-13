class AudioService {
  private ctx: AudioContext | null = null;
  private bgmGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;
  private nextNoteTime: number = 0;
  private timerId: number | null = null;
  
  // Liquid effect nodes
  private pourSource: AudioBufferSourceNode | null = null;
  private pourGain: GainNode | null = null;
  private pourLFO: OscillatorNode | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playTap() {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  startPouring(enabled: boolean) {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended' || !enabled) return;

    // Create noise buffer if not already present
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.pourSource = this.ctx.createBufferSource();
    this.pourSource.buffer = buffer;
    this.pourSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.Q.setValueAtTime(10, this.ctx.currentTime);

    // LFO for "sloshing" movement
    this.pourLFO = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.pourLFO.type = 'sine';
    this.pourLFO.frequency.setValueAtTime(3, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);
    
    this.pourLFO.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    this.pourLFO.start();

    this.pourGain = this.ctx.createGain();
    this.pourGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.pourGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.1);

    this.pourSource.connect(filter);
    filter.connect(this.pourGain);
    this.pourGain.connect(this.ctx.destination);

    this.pourSource.start();
  }

  stopPouring() {
    if (!this.ctx || !this.pourGain) return;

    const now = this.ctx.currentTime;
    this.pourGain.gain.cancelScheduledValues(now);
    this.pourGain.gain.setValueAtTime(this.pourGain.gain.value, now);
    this.pourGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    const sourceToStop = this.pourSource;
    const lfoToStop = this.pourLFO;
    
    setTimeout(() => {
      sourceToStop?.stop();
      lfoToStop?.stop();
      sourceToStop?.disconnect();
      lfoToStop?.disconnect();
    }, 350);

    this.pourSource = null;
    this.pourGain = null;
    this.pourLFO = null;
  }

  playWin() {
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const frequencies = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5
    const now = this.ctx.currentTime;
    
    frequencies.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.1);
      
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 1);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 1.2);
    });
  }

  private playPianoNote(freq: number, time: number) {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, time);

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 0.5, time); // Subtle sub-bass

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.25, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 2.5);

    osc.connect(gain);
    osc2.connect(gain);
    osc3.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc2.start(time);
    osc3.start(time);
    osc.stop(time + 2.5);
    osc2.stop(time + 2.5);
    osc3.stop(time + 2.5);
  }

  // New expanded 20-chord piano song (approx 40-50s loop)
  private sequence = [
    [261.63, 329.63, 392.00, 523.25], // C Major
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [220.00, 261.63, 329.63, 440.00], // A Minor
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 349.23], // F Major
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [196.00, 246.94, 293.66, 392.00], // G Major
    [196.00, 246.94, 293.66, 349.23], // G7
    [164.81, 196.00, 246.94, 329.63], // E Minor
    [220.00, 277.18, 329.63, 440.00], // A Major
    [146.83, 174.61, 220.00, 293.66], // D Minor
    [196.00, 246.94, 293.66, 392.00], // G Major
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 349.23], // F Major
    [196.00, 246.94, 293.66, 349.23], // G7
    [164.81, 207.65, 246.94, 329.63], // E Major (Bright change)
    [220.00, 261.63, 329.63, 440.00], // A Minor
    [146.83, 174.61, 220.00, 349.23], // Dm7
    [196.00, 246.94, 311.13, 392.00]  // G7#5 (Tension)
  ];
  private currentChord = 0;
  private currentNote = 0;

  private scheduler() {
    if (!this.ctx || !this.isBgmPlaying) return;

    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      const chord = this.sequence[this.currentChord];
      const freq = chord[this.currentNote];
      
      this.playPianoNote(freq, this.nextNoteTime);

      this.currentNote++;
      if (this.currentNote >= chord.length) {
        this.currentNote = 0;
        this.currentChord = (this.currentChord + 1) % this.sequence.length;
      }
      
      this.nextNoteTime += 0.55; // Slightly slower, more relaxed pacing
    }

    this.timerId = window.setTimeout(() => this.scheduler(), 25);
  }

  startBGM() {
    this.init();
    if (!this.ctx || this.isBgmPlaying) return;
    
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.bgmGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 3); // Fade in over 3 seconds
    this.bgmGain.connect(this.ctx.destination);

    this.isBgmPlaying = true;
    this.nextNoteTime = this.ctx.currentTime;
    this.currentChord = 0;
    this.currentNote = 0;
    this.scheduler();
  }

  updateBGMVolume(enabled: boolean) {
    if (!this.bgmGain || !this.ctx) return;
    const target = enabled ? 0.12 : 0;
    this.bgmGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.5);
  }

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  stopBGM() {
    this.isBgmPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

export const audioService = new AudioService();