import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../../../core/services/interfaces/chat.interface';
import { IconComponent } from '../../../../shared/icon/icon';
import { MarkdownPipe } from '../../../../shared/markdown-pipe';
import { NotificationService } from '../../../../core/services/notification-service';
import { SpeechService } from '../../../../core/services/speech-service';

@Component({
  selector: 'app-message-bubble',
  imports: [CommonModule, IconComponent, MarkdownPipe],
  templateUrl: './message-bubble.html',
  styleUrl: './message-bubble.css',
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: Message;
  @Input() canRegenerate = false;
  @Output() regenerate = new EventEmitter<string>();
  @ViewChild('answer') answer?: ElementRef<HTMLElement>;
  readonly speech = inject(SpeechService);
  private readonly notices = inject(NotificationService);

  async copy() {
    try { await navigator.clipboard.writeText(this.message.content); this.notices.show('Respuesta copiada. Lista para tus ideas.'); }
    catch { this.notices.show('No se pudo copiar. Puedes seleccionar el texto y copiarlo manualmente.', 'info'); }
  }

  speak() { this.speech.toggle(this.message.id, this.answer?.nativeElement.innerText || this.message.content); }
}
