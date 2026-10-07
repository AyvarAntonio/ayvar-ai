import { Component, ElementRef, OnDestroy, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Conversation } from '../../../../core/services/interfaces/chat.interface';
import { PwaService } from '../../../../core/services/pwa-service';
import { ChatMode } from '../../../../core/services/preferences-service';
import { IconComponent } from '../../../../shared/icon/icon';

@Component({
  selector: 'app-sidebar-conversations',
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './sidebar-conversations.html',
  styleUrl: './sidebar-conversations.css',
})
export class SidebarConversationsComponent implements OnDestroy {
  readonly conversations = input<Conversation[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly isOpen = input(false);
  readonly mode = input<ChatMode>('general');
  readonly conversationSelected = output<Conversation>();
  readonly conversationDeleted = output<string>();
  readonly newChatClicked = output<void>();
  readonly modeSelected = output<ChatMode>();
  readonly closed = output<void>();
  readonly settingsClicked = output<void>();
  readonly pwa = inject(PwaService);
  readonly search = signal('');
  private readonly media = window.matchMedia?.('(max-width: 960px)');
  readonly mobile = signal(this.media?.matches ?? false);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('mobileSidebar');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly resized = (event: MediaQueryListEvent) => { this.mobile.set(event.matches); this.closed.emit(); };
  readonly modes: { id: ChatMode; label: string; icon: string }[] = [
    { id: 'general', label: 'Tu espacio', icon: 'sparkles' },
    { id: 'create', label: 'Ideas y creatividad', icon: 'bulb' },
    { id: 'code', label: 'Código y desarrollo', icon: 'code' },
    { id: 'learn', label: 'Aprende algo nuevo', icon: 'book' },
  ];
  readonly filtered = computed(() => {
    const search = this.search().toLocaleLowerCase().trim();
    return this.conversations().filter(conversation => !search || conversation.title.toLocaleLowerCase().includes(search) || conversation.messages.some(message => message.content.toLocaleLowerCase().includes(search)));
  });

  constructor() {
    this.media?.addEventListener('change', this.resized);
    effect(() => {
      const element = this.dialog()?.nativeElement;
      if (!element) return;
      if (this.isOpen()) {
        if (!element.open) element.showModal();
      } else if (element.open) element.close();
    });
  }

  selectConversation(conversation: Conversation) { this.conversationSelected.emit(conversation); this.closed.emit(); }
  newChat() { this.newChatClicked.emit(); this.closed.emit(); }
  selectMode(mode: ChatMode) { this.modeSelected.emit(mode); this.closed.emit(); }
  openSettings() { this.closed.emit(); this.settingsClicked.emit(); }
  focusSearch() { this.searchInput()?.nativeElement.focus(); }
  backdrop(event: MouseEvent) {
    if (event.target === this.dialog()?.nativeElement && event.clientX > this.dialog()!.nativeElement.getBoundingClientRect().right) this.closed.emit();
  }
  ngOnDestroy() { this.media?.removeEventListener('change', this.resized); }
}
