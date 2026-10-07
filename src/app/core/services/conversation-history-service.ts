import { Injectable, inject } from '@angular/core';
import { Conversation, Message } from './interfaces/chat.interface';
import { StorageService, restoreMessages } from './storage-service';

@Injectable({ providedIn: 'root' })
export class ConversationHistoryService {
  private readonly storage = inject(StorageService);
  private readonly key = 'ayvar_conversations';

  getAll(): Conversation[] {
    try {
      const stored = JSON.parse(this.storage.read(this.key) || '[]');
      if (!Array.isArray(stored)) return [];
      return stored.filter(item => item && typeof item.id === 'string' && Array.isArray(item.messages)).map(item => ({
        ...item,
        title: typeof item.title === 'string' ? item.title : 'Nueva conversación',
        date: Number.isNaN(new Date(item.date).getTime()) ? new Date() : new Date(item.date),
        messages: restoreMessages(item.messages),
      })).sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch { return []; }
  }

  saveAll(conversations: Conversation[]) { this.storage.write(this.key, JSON.stringify(conversations)); }
  addConversation(conversation: Conversation) { this.saveAll([conversation, ...this.getAll().filter(item => item.id !== conversation.id)]); }
  updateConversation(conversation: Conversation) { this.addConversation(conversation); }
  deleteConversation(id: string) { this.saveAll(this.getAll().filter(item => item.id !== id)); }
  clearAll() { this.storage.write(this.key, null); }

  createFromMessages(messages: Message[], id?: string): Conversation {
    const first = messages.find(message => message.role === 'user')?.content || 'Nueva conversación';
    return {
      id: id || crypto.randomUUID(),
      title: first.slice(0, 50) + (first.length > 50 ? '…' : ''),
      date: new Date(),
      messages: messages.map(message => ({ ...message })),
    };
  }
}
