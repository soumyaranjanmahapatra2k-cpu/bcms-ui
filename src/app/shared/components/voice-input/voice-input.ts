import { Component, inject, output, signal, ElementRef, ViewChild, OnDestroy, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { SpeechService } from '../../../core/services/speech.service';
import { ToastService } from '../../../core/services/toast.service';
import { TooltipDirective } from '../../directives/tooltip.directive';

/**
 * Voice input button with real-time audio waveform visualisation.
 * Shows a 16-bar live spectrum + heartbeat pulse while listening so the
 * user gets immediate visual confirmation that the mic is active.
 */
@Component({
  selector: 'app-voice-input',
  standalone: true,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (speech.supported) {
      <div class="voice-wrap">
        <button
          #btn
          type="button"
          class="voice-btn"
          [class.listening]="listening()"
          (click)="toggle()"
          [appTooltip]="listening() ? 'Listening â€” click to stop' : 'Click to dictate'"
        >
          <span class="material-icons-outlined voice-icon">{{ listening() ? 'mic' : 'mic_none' }}</span>
          @if (listening()) {
            <span class="pulse-ring"></span>
            <span class="pulse-ring delay-1"></span>
          }
        </button>

        @if (listening()) {
          <div class="waveform" aria-hidden="true">
            @for (h of bars(); track $index) {
              <span class="bar" [style.height.%]="h"></span>
            }
          </div>
          <div class="status-pill">
            <span class="dot"></span>
            <span>Listeningâ€¦</span>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: inline-flex; }
    .voice-wrap {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .voice-btn {
      position: relative;
      width: 36px; height: 36px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center; justify-content: center;
      cursor: pointer;
      border: 1px solid var(--border-color);
      background: var(--bg-input);
      color: var(--text-muted);
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    .voice-btn:hover {
      color: var(--color-primary);
      border-color: var(--color-primary);
      background: var(--color-primary-subtle);
      transform: scale(1.05);
    }
    .voice-btn.listening {
      color: white;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border-color: transparent;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.18);
    }
    .voice-icon { font-size: 20px; position: relative; z-index: 2; }

    .pulse-ring {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 2px solid #ef4444;
      opacity: 0.6;
      animation: voicePulse 1.4s ease-out infinite;
      pointer-events: none;
    }
    .pulse-ring.delay-1 { animation-delay: 0.7s; }
    @keyframes voicePulse {
      0% { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    .waveform {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      height: 28px;
      padding: 4px 10px;
      background: var(--color-primary-subtle, rgba(59, 130, 246, 0.08));
      border-radius: var(--radius-full);
      animation: fadeIn 0.25s ease;
    }
    .bar {
      display: inline-block;
      width: 3px;
      min-height: 4px;
      background: linear-gradient(180deg, #ef4444, #dc2626);
      border-radius: 2px;
      transition: height 80ms ease-out;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      border-radius: var(--radius-full);
      font-size: 0.714rem;
      font-weight: 700;
      letter-spacing: 0.3px;
      animation: fadeIn 0.25s ease;
    }
    .status-pill .dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #ef4444;
      animation: heartbeat 1s ease-in-out infinite;
    }
    @keyframes heartbeat {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.4); opacity: 0.7; }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class VoiceInputComponent implements AfterViewInit, OnDestroy {
  speech = inject(SpeechService);
  private toast = inject(ToastService);

  transcribed = output<string>();
  listening = signal(false);
  bars = signal<number[]>(Array(16).fill(8));

  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private rafId: number | null = null;

  ngAfterViewInit() { /* placeholder for future tooltip wiring */ }

  ngOnDestroy() { this.stopVisualizer(); }

  async toggle(): Promise<void> {
    if (this.listening()) {
      this.speech.stop();
      this.stopVisualizer();
      this.listening.set(false);
      return;
    }

    try {
      this.speech.start((text) => this.transcribed.emit(text));
      this.listening.set(true);
      await this.startVisualizer();

      // Detect permission denial / errors after a short delay
      setTimeout(() => {
        if (this.speech.state().status === 'error') {
          this.toast.error('Microphone access required for voice input', { title: 'Voice Input Failed' });
          this.stopVisualizer();
          this.listening.set(false);
        }
      }, 500);
    } catch {
      this.toast.error('Could not start voice recognition', { title: 'Voice Input Failed' });
      this.listening.set(false);
    }
  }

  private async startVisualizer(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new Ctx();
      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.7;
      source.connect(this.analyser);
      this.tick();
    } catch {
      // Mic blocked â€” keep speech going but skip visualisation
    }
  }

  private tick = (): void => {
    if (!this.analyser) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const slice = Array.from(data.slice(0, 16));
    // Normalise 0-255 â†’ 8-100 for height %
    const next = slice.map(v => Math.max(8, Math.min(100, Math.round((v / 255) * 100))));
    this.bars.set(next);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private stopVisualizer() {
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
    }
    this.audioCtx = null;
    this.analyser = null;
    this.bars.set(Array(16).fill(8));
  }
}