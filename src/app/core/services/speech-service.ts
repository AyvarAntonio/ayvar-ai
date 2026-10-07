import { Injectable, inject, signal } from '@angular/core';
import { NotificationService } from './notification-service';

@Injectable({ providedIn: 'root' })
export class SpeechService {
  readonly supported = 'speechSynthesis' in window;
  readonly speakingId = signal<string | null>(null);
  private readonly notices = inject(NotificationService);

  toggle(id: string, text: string) {
    if (!this.supported) return;
    const wasSpeaking = this.speakingId() === id;
    this.stop();
    if (wasSpeaking) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1;
    const voice = window.speechSynthesis.getVoices().find(item => item.lang.startsWith('es'));
    if (voice) utterance.voice = voice;
    utterance.onend = () => { if (this.speakingId() === id) this.speakingId.set(null); };
    utterance.onerror = event => {
      if (this.speakingId() === id) this.speakingId.set(null);
      if (event.error !== 'interrupted' && event.error !== 'canceled') this.notices.show('No se pudo leer la respuesta en este navegador.', 'info');
    };
    this.speakingId.set(id);
    window.speechSynthesis.speak(utterance);
  }

  stop() {
    this.speakingId.set(null);
    if (this.supported) window.speechSynthesis.cancel();
  }
}
