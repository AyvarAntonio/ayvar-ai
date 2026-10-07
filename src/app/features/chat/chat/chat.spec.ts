import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { signal } from '@angular/core';
import { ChatComponent } from './chat';
import { GeminiService } from '../../../core/services/gemini-service';
import { PwaService } from '../../../core/services/pwa-service';
import { NotificationService } from '../../../core/services/notification-service';
import { ConversationHistoryService } from '../../../core/services/conversation-history-service';

describe('Chat continuity and persistence', () => {
  let response: Subject<string>;
  const sendMessage = vi.fn();

  beforeEach(async () => {
    localStorage.clear();
    response = new Subject<string>();
    sendMessage.mockReset().mockImplementation(() => response.asObservable());
    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        { provide: GeminiService, useValue: { sendMessage } },
        { provide: PwaService, useValue: { installed: signal(false), updateAvailable: signal(false), installing: signal(false) } },
      ],
    }).overrideComponent(ChatComponent, { set: { template: '', imports: [] } }).compileComponents();
  });

  function create() {
    const fixture = TestBed.createComponent(ChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.preferences.motion.set(false);
    return fixture;
  }

  it('sends previous turns as context and restores the same conversation after a reload', () => {
    const fixture = create();
    const chat = fixture.componentInstance;
    chat.handleSendMessage('Me llamo Ana');
    response.next('Hola, Ana.'); response.complete();
    const id = chat.currentConversationId;
    response = new Subject<string>();
    chat.handleSendMessage('¿Cómo me llamo?');
    expect(sendMessage.mock.calls[1][1].map((item: { content: string }) => item.content)).toEqual(['Me llamo Ana', 'Hola, Ana.']);
    response.next('Te llamas Ana.'); response.complete();
    fixture.destroy();
    const restored = create().componentInstance;
    expect(restored.currentConversationId).toBe(id);
    expect(restored.messages).toHaveLength(4);
    expect(restored.conversations).toHaveLength(1);
  });

  it('cancels an in-flight answer before opening a new conversation', () => {
    const chat = create().componentInstance;
    chat.handleSendMessage('Primera pregunta');
    const id = chat.currentConversationId;
    chat.startNewChat();
    response.next('Respuesta tardía');
    expect(chat.messages).toEqual([]);
    expect(chat.isLoading).toBe(false);
    expect(chat.currentConversationId).toBeNull();
    const saved = TestBed.inject(ConversationHistoryService).getAll();
    expect(saved.find(item => item.id === id)?.messages.at(-1)?.status).toBe('stopped');
  });

  it('does not recreate a conversation when deleting the active chat', async () => {
    const chat = create().componentInstance;
    chat.handleSendMessage('Una conversación para borrar');
    response.next('Una respuesta'); response.complete();
    vi.spyOn(TestBed.inject(NotificationService), 'confirm').mockResolvedValue(true);
    await chat.deleteConversation(chat.currentConversationId!);
    expect(chat.messages).toEqual([]);
    expect(TestBed.inject(ConversationHistoryService).getAll()).toEqual([]);
    expect(localStorage.getItem('ayvar_active_conversation')).toBeNull();
  });

  it('retries without duplicating the user message', () => {
    const chat = create().componentInstance;
    chat.handleSendMessage('Una pregunta');
    response.error(new Error('Network unavailable'));
    const failedId = chat.messages.at(-1)!.id;
    response = new Subject<string>();
    chat.regenerate(failedId);
    response.next('Ahora sí.'); response.complete();
    expect(chat.messages.map(message => message.role)).toEqual(['user', 'ai']);
    expect(chat.messages.at(-1)?.content).toBe('Ahora sí.');
  });
});
