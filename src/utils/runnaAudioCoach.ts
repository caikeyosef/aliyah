/**
 * Audio Coach for Runna Guided Sessions
 * Uses Web Audio API for synthetic chimes (offline-capable, zero external dependencies)
 * and Web Speech API for vocal interval cues in Portuguese.
 */

class RunnaAudioCoach {
  private audioCtx: AudioContext | null = null;
  private voiceEnabled = true;
  private soundEnabled = true;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }

  /**
   * Play a clean synthesized tone
   */
  public playTone(freq: number, durationMs: number, type: OscillatorType = 'sine', gainVal = 0.15) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      console.warn('Audio tone error', e);
    }
  }

  /**
   * Countdown tick (3, 2, 1)
   */
  public playCountdownTick(count: number) {
    if (!this.soundEnabled) return;
    const freq = count === 1 ? 880 : 587; // higher pitch on 1
    this.playTone(freq, 120, 'triangle', 0.2);
  }

  /**
   * Start of a running or hard interval (energetic ascending 2-tone)
   */
  public playStartRunInterval() {
    if (!this.soundEnabled) return;
    this.playTone(523.25, 140, 'sine', 0.25); // C5
    setTimeout(() => {
      this.playTone(783.99, 280, 'triangle', 0.3); // G5
    }, 120);
  }

  /**
   * Start of a walk or recovery interval (relaxing descending tone)
   */
  public playStartWalkInterval() {
    if (!this.soundEnabled) return;
    this.playTone(659.25, 160, 'sine', 0.2); // E5
    setTimeout(() => {
      this.playTone(440.0, 300, 'sine', 0.2); // A4
    }, 140);
  }

  /**
   * Workout completed fanfare (triumphant 3-chord)
   */
  public playWorkoutComplete() {
    if (!this.soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 350, 'triangle', 0.25);
      }, idx * 160);
    });
  }

  /**
   * Speak instruction using Web Speech API in Portuguese
   */
  public speak(text: string) {
    if (!this.voiceEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // cancel previous queue to prevent delay
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Find pt-BR voice if available
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(
        (v) => v.lang.includes('pt-BR') || v.lang.includes('pt_BR') || v.lang.startsWith('pt')
      );
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error', e);
    }
  }

  /**
   * Combined cue: plays sound effect and speaks after a short pause
   */
  public announceBlockTransition(type: string, label: string) {
    if (type.includes('run')) {
      this.playStartRunInterval();
    } else {
      this.playStartWalkInterval();
    }

    // Voice announcement slightly delayed after tone
    setTimeout(() => {
      if (type.includes('run')) {
        this.speak(`Agora, corra: ${label}`);
      } else if (type === 'walk') {
        this.speak(`Caminhada de recuperação: ${label}`);
      } else if (type === 'warmup') {
        this.speak(`Iniciando aquecimento: ${label}`);
      } else if (type === 'cooldown') {
        this.speak(`Muito bem! Iniciando desaquecimento: ${label}`);
      } else {
        this.speak(label);
      }
    }, 280);
  }
}

export const audioCoach = new RunnaAudioCoach();
