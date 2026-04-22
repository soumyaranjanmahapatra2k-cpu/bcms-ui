import { Injectable, signal, NgZone, inject } from '@angular/core';

export interface SpeechState {
  status: 'idle' | 'listening' | 'error';
  interimTranscript: string;
}

@Injectable({ providedIn: 'root' })
export class SpeechService {
  private zone = inject(NgZone);
  private recognition: any = null;
  private silenceTimer: any = null;

  readonly supported = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  readonly state = signal<SpeechState>({ status: 'idle', interimTranscript: '' });

  private finalCallback: ((text: string) => void) | null = null;

  start(onFinal: (text: string) => void, lang = 'en-US'): void {
    if (!this.supported) return;
    this.stop();
    this.finalCallback = onFinal;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = lang;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      this.zone.run(() => this.state.set({ status: 'listening', interimTranscript: '' }));
      this.resetSilenceTimer();
    };

    this.recognition.onresult = (event: any) => {
      this.resetSilenceTimer();
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.zone.run(() => {
            this.finalCallback?.(transcript);
            this.state.update(s => ({ ...s, interimTranscript: '' }));
          });
        } else {
          interim += transcript;
        }
      }
      if (interim) {
        this.zone.run(() => this.state.update(s => ({ ...s, interimTranscript: interim })));
      }
    };

    this.recognition.onerror = (event: any) => {
      this.zone.run(() => {
        if (event.error === 'not-allowed') {
          this.state.set({ status: 'error', interimTranscript: '' });
        }
        this.cleanup();
      });
    };

    this.recognition.onend = () => {
      this.zone.run(() => {
        if (this.state().status === 'listening') {
          this.state.set({ status: 'idle', interimTranscript: '' });
        }
        this.cleanup();
      });
    };

    try {
      this.recognition.start();
    } catch {
      this.state.set({ status: 'error', interimTranscript: '' });
    }
  }

  stop(): void {
    if (this.recognition) {
      try { this.recognition.stop(); } catch { /* ignore */ }
    }
    this.cleanup();
    this.state.set({ status: 'idle', interimTranscript: '' });
  }

  private resetSilenceTimer(): void {
    clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => this.stop(), 6000);
  }

  private cleanup(): void {
    clearTimeout(this.silenceTimer);
    this.recognition = null;
    this.finalCallback = null;
  }
}
