import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, timeout } from 'rxjs';
import { Message } from './interfaces/chat.interface';
import { ChatMode, PreferencesService } from './preferences-service';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly http = inject(HttpClient);
  private readonly preferences = inject(PreferencesService);

  sendMessage(prompt: string, history: Message[], mode: ChatMode): Observable<string> {
    return this.http.post<{ text: string }>('/.netlify/functions/chat', {
      message: prompt,
      history: history.filter(message => message.status !== 'error' && message.status !== 'sending' && message.status !== 'stopped')
        .slice(-20).map(message => ({ role: message.role, content: message.content })),
      mode,
      style: this.preferences.responseStyle(),
    }).pipe(
      timeout(90000),
      map(data => {
        if (!data.text?.trim()) throw new Error('Ayvar no recibió una respuesta. Inténtalo otra vez.');
        return data.text;
      }),
    );
  }
}
