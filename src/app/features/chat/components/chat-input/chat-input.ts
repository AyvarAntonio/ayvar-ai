import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/icon/icon';
import { ChatMode, PreferencesService } from '../../../../core/services/preferences-service';
import { NotificationService } from '../../../../core/services/notification-service';

interface RecognitionResultEvent { results: ArrayLike<ArrayLike<{ transcript: string }>>; }
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

@Component({
  selector: 'app-chat-input',
  imports: [FormsModule, IconComponent],
  templateUrl: './chat-input.html',
  styleUrl: './chat-input.css',
})
export class ChatInputComponent implements OnChanges, OnDestroy {
  @Input() busy = false;
  @Input() offline = false;
  @Input() mode: ChatMode = 'general';
  @Input() hasContext = false;
  @Output() send = new EventEmitter<string>();
  @Output() stop = new EventEmitter<void>();
  @Output() modeChanged = new EventEmitter<ChatMode>();
  @ViewChild('messageInput') messageInput?: ElementRef<HTMLTextAreaElement>;
  readonly preferences = inject(PreferencesService);
  private readonly notices = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly Recognition = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
  readonly voiceSupported = Boolean(this.Recognition);
  readonly listening = signal(false);
  private recognition?: Recognition;
  message = '';
  focused = false;
  private voiceDraft = '';

  ngOnChanges() { if (this.busy || this.offline) this.recognition?.stop(); }

  onEnter(inputEvent: Event) {
    const event = inputEvent as KeyboardEvent;
    if (event.isComposing || event.shiftKey) return;
    if (this.preferences.enterToSend() || event.ctrlKey || event.metaKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    const content = this.message.trim();
    if (!content || this.busy || this.offline || content.length > 12000) return;
    this.endDictation();
    this.message = '';
    this.autoResize();
    this.send.emit(content);
  }

  setDraft(value: string) { this.message = value; this.autoResize(); this.focus(); }
  focus() { this.messageInput?.nativeElement.focus({ preventScroll: true }); }
  autoResize() {
    const element = this.messageInput?.nativeElement;
    if (element) { element.style.height = 'auto'; element.style.height = `${Math.min(element.scrollHeight, 160)}px`; }
  }

  toggleVoice() {
    if (this.listening()) { this.recognition?.stop(); return; }
    if (!this.Recognition || this.busy || this.offline) return;
    this.voiceDraft = this.message;
    const recognition = new this.Recognition();
    this.recognition = recognition;
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = event => {
      const transcript = Array.from(event.results).map(result => result[0].transcript).join(' ');
      this.message = `${this.voiceDraft}${this.voiceDraft ? ' ' : ''}${transcript}`.slice(0, 12000);
      this.listening.set(true);
      this.autoResize();
      this.cdr.markForCheck();
    };
    recognition.onerror = event => {
      this.listening.set(false);
      if (event.error !== 'aborted') this.notices.show(event.error === 'not-allowed' ? 'Permite el acceso al micrófono para dictar tu mensaje.' : 'No se pudo reconocer tu voz. Puedes volver a intentarlo.', 'info');
    };
    recognition.onend = () => this.listening.set(false);
    try { recognition.start(); this.listening.set(true); }
    catch { this.listening.set(false); this.notices.show('El micrófono no está disponible ahora.', 'info'); }
  }

  ngOnDestroy() {
    this.endDictation();
  }

  private endDictation() {
    if (this.recognition) {
      this.recognition.onresult = null; this.recognition.onerror = null; this.recognition.onend = null;
      this.recognition.abort();
      this.recognition = undefined;
    }
    this.listening.set(false);
  }
}
