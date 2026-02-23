import { Injectable } from '@angular/core';
import { Message } from './interfaces/chat.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEY = 'ayvar_chats';

  // Guardar mensajes
  saveMessages(messages: Message[]): void {
    try {
      // Convertir fechas a string para guardar
      const messagesToSave = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Error guardando mensajes:', error);
    }
  }

  // Cargar mensajes
  loadMessages(): Message[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const messages = JSON.parse(stored);
        // Restaurar fechas como objetos Date
        return messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      return [];
    }
  }

  // Limpiar historial
  clearMessages(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}