import { Injectable, inject } from '@angular/core';
import { Message } from './interfaces/chat.interface';
import { NotificationService } from './notification-service';

export function restoreMessages(value: unknown): Message[] {
  if (!Array.isArray(value)) return [];
  return value.filter(message => message && typeof message.id === 'string' && typeof message.content === 'string' && ['user', 'ai'].includes(message.role))
    .map(message => ({
      ...message,
      timestamp: Number.isNaN(new Date(message.timestamp).getTime()) ? new Date() : new Date(message.timestamp),
      status: message.status === 'sending' || message.status === 'streaming' ? 'stopped' : message.status,
    }));
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly notices = inject(NotificationService);
  private warned = false;

  read(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  write(key: string, value: string | null): void {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
      this.warned = false;
    } catch {
      if (!this.warned) this.notices.show('No se pudo guardar el historial en este dispositivo. Exporta tu conversación para conservarla.', 'info');
      this.warned = true;
    }
  }

  saveMessages(messages: Message[]): void { this.write('ayvar_chats', JSON.stringify(messages)); }
  loadMessages(): Message[] {
    try { return restoreMessages(JSON.parse(this.read('ayvar_chats') || '[]')); } catch { return []; }
  }
  clearMessages(): void { this.write('ayvar_chats', null); }
  getActiveId(): string | null { return this.read('ayvar_active_conversation'); }
  setActiveId(id: string | null): void { this.write('ayvar_active_conversation', id); }
}
