// core/services/conversation-history.service.ts
import { Injectable } from '@angular/core';
import { Conversation, Message } from './interfaces/chat.interface';

@Injectable({
  providedIn: 'root'
})
export class ConversationHistoryService {
  private readonly STORAGE_KEY = 'ayvar_conversations';

  getAll(): Conversation[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    try {
      const conversations = JSON.parse(stored);
      return conversations.map((c: any) => ({
        ...c,
        date: new Date(c.date),
        messages: c.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }));
    } catch {
      return [];
    }
  }

  saveAll(conversations: Conversation[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations));
  }

  addConversation(convo: Conversation) {
    const all = this.getAll();
    all.unshift(convo);
    this.saveAll(all);
  }

  updateConversation(convo: Conversation) {
    const all = this.getAll();
    const idx = all.findIndex(c => c.id === convo.id);
    if (idx !== -1) {
      all[idx] = convo;
      this.saveAll(all);
    }
  }

  deleteConversation(id: string) {
    const all = this.getAll();
    const filtered = all.filter(c => c.id !== id);
    this.saveAll(filtered);
  }

  clearAll() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Crear nueva conversación desde mensajes
  createFromMessages(messages: Message[], id?: string): Conversation {
    const title = messages.length > 0 
      ? messages[0].content.substring(0, 50) + (messages[0].content.length > 50 ? '...' : '')
      : 'Nueva conversación';
    
    return {
      id: id || Date.now().toString(),
      title,
      date: new Date(),
      messages: [...messages]
    };
  }
}