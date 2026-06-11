/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Procedural Web Audio engine for the terminal HUD.
 * Exports a singleton `synth` used for UI blips, boot SFX, and an ambient drone.
 * AudioContext must be unlocked via a user gesture (BootSequence calls enable()).
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoDepth: GainNode | null = null;
  private humFilter: BiquadFilterNode | null = null;
  private humGain: GainNode | null = null;
  private isEnabled = false;
  // Global overdrive flag. When on, every cue gets more urgent: the ambient
  // drone throbs faster and brighter, and UI blips are punchier + higher.
  private overdrive = false;

  public enable(): boolean {
    if (this.ctx) {
      // Safari sometimes leaves the context suspended after navigation; resume defensively.
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.isEnabled;
    }
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // If the context lands suspended (Safari, some autoplay edge cases), try to resume immediately.
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      this.isEnabled = true;
      this.startHum();
      return true;
    } catch (e) {
      console.warn("Web Audio API not supported", e);
      return false;
    }
  }

  public disable(): void {
    this.stopHum();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.isEnabled = false;
  }

  public isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  // Toggle the urgent "overdrive" voicing. Adjusts the live drone in place and
  // flips the flag the one-shot cues read. Safe to call before audio is on.
  public setOverdrive(on: boolean): void {
    this.overdrive = on;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const ramp = 0.3;
    try {
      if (this.humGain) {
        this.humGain.gain.cancelScheduledValues(now);
        this.humGain.gain.linearRampToValueAtTime(on ? 0.075 : 0.045, now + ramp);
      }
      if (this.humFilter) {
        this.humFilter.frequency.cancelScheduledValues(now);
        this.humFilter.frequency.linearRampToValueAtTime(on ? 480 : 150, now + ramp);
        this.humFilter.Q.linearRampToValueAtTime(on ? 10 : 4, now + ramp);
      }
      if (this.lfo) {
        this.lfo.frequency.cancelScheduledValues(now);
        // Slow 12.5s breathing turns into a tense ~1Hz throb.
        this.lfo.frequency.linearRampToValueAtTime(on ? 1.1 : 0.08, now + ramp);
      }
      if (this.lfoDepth) {
        this.lfoDepth.gain.linearRampToValueAtTime(on ? 180 : 80, now + ramp);
      }
      if (this.osc1) this.osc1.detune.linearRampToValueAtTime(on ? -22 : -8, now + ramp);
      if (this.osc2) this.osc2.detune.linearRampToValueAtTime(on ? 22 : 8, now + ramp);
    } catch (e) {
      // Ignored
    }
  }

  public playClick(pitch = 1200, duration = 0.05): void {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Overdrive sharpens the blip: higher, shorter, squarer, and louder.
      const od = this.overdrive;
      const p = od ? pitch * 1.5 : pitch;
      const d = od ? duration * 0.8 : duration;

      osc.type = od ? "square" : "sine";
      osc.frequency.setValueAtTime(p, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(p * 0.4, this.ctx.currentTime + d);

      gain.gain.setValueAtTime(od ? 0.07 : 0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + d);
    } catch (e) {
      // Ignored
    }
  }

  public playStartup(): void {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Synthesize an ascending arpeggio sweep
      const freqs = [300, 600, 900, 1200, 1800, 2400];
      freqs.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = now + i * 0.1;
        const duration = 0.25;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, startTime);
        osc.frequency.exponentialRampToValueAtTime(f * 1.5, startTime + duration);

        gain.gain.setValueAtTime(0.0, startTime);
        gain.gain.linearRampToValueAtTime(0.04, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      // Ignored
    }
  }

  public playOverclock(freq: number): void {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq / 2, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.8, now + 0.4);

      // Lowpass resonant sweep
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 0.4);
      filter.Q.setValueAtTime(8, now);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      // Ignored
    }
  }

  public playAlert(): void {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.setValueAtTime(180, now + 0.1);
      osc.frequency.setValueAtTime(120, now + 0.2);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      // Ignored
    }
  }

  private startHum(): void {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const od = this.overdrive;

      // Dual-Oscillator Harmony (The Bass Base)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sawtooth";
      this.osc1.frequency.setValueAtTime(55, now);
      this.osc1.detune.setValueAtTime(od ? -22 : -8, now); // slightly flat

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "triangle";
      this.osc2.frequency.setValueAtTime(82.4, now);
      this.osc2.detune.setValueAtTime(od ? 22 : 8, now); // slightly sharp

      // Low-Pass Resonant Filter (The Sub-Bass Focus)
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(od ? 480 : 150, now);
      filter.Q.setValueAtTime(od ? 10 : 4, now);
      this.humFilter = filter;

      // LFO Modulation (The "Breathing" Effect). Fast + deep under overdrive.
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = "sine";
      this.lfo.frequency.setValueAtTime(od ? 1.1 : 0.08, now);

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(od ? 180 : 80, now); // modulation depth
      this.lfoDepth = lfoGain;

      this.lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      // Main server room gain node to make it ambient and non-offensive
      this.humGain = this.ctx.createGain();
      this.humGain.gain.setValueAtTime(od ? 0.075 : 0.045, now);

      // Connections
      this.osc1.connect(filter);
      this.osc2.connect(filter);
      filter.connect(this.humGain);
      this.humGain.connect(this.ctx.destination);

      // Start voices
      this.osc1.start(now);
      this.osc2.start(now);
      this.lfo.start(now);
    } catch (e) {
      console.warn("Could not start procedural drone generator:", e);
    }
  }

  private stopHum(): void {
    try {
      if (this.osc1) {
        this.osc1.stop();
        this.osc1.disconnect();
        this.osc1 = null;
      }
      if (this.osc2) {
        this.osc2.stop();
        this.osc2.disconnect();
        this.osc2 = null;
      }
      if (this.lfo) {
        this.lfo.stop();
        this.lfo.disconnect();
        this.lfo = null;
      }
      if (this.lfoDepth) {
        this.lfoDepth.disconnect();
        this.lfoDepth = null;
      }
      if (this.humFilter) {
        this.humFilter.disconnect();
        this.humFilter = null;
      }
      if (this.humGain) {
        this.humGain.disconnect();
        this.humGain = null;
      }
    } catch (e) {
      // Ignored
    }
  }
}

// Single shared instance; imported by BootSequence, HUD widgets, and OverdriveContext.
export const synth = new AudioSynthesizer();
