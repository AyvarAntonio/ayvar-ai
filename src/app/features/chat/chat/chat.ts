import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Conversation, Message } from '../../../core/services/interfaces/chat.interface';
import { GeminiService } from '../../../core/services/gemini-service';
import { StorageService } from '../../../core/services/storage-service';
import { ConversationHistoryService } from '../../../core/services/conversation-history-service';
import { NotificationService } from '../../../core/services/notification-service';
import { ChatMode, PreferencesService, ResponseStyle } from '../../../core/services/preferences-service';
import { PwaService } from '../../../core/services/pwa-service';
import { SpeechService } from '../../../core/services/speech-service';
import { MessageBubbleComponent } from '../components/message-bubble/message-bubble';
import { ChatInputComponent } from '../components/chat-input/chat-input';
import { SidebarConversationsComponent } from '../components/sidebar-conversations/sidebar-conversations';
import { IconComponent } from '../../../shared/icon/icon';
import { NeuralOrbComponent } from '../../../shared/neural-orb/neural-orb';
import { NotificationsComponent } from '../../../shared/notifications/notifications';

interface Suggestion { icon: string; title: string; description: string; prompt: string; color: string; }

@Component({
  selector: 'app-chat',
  imports: [CommonModule, MessageBubbleComponent, ChatInputComponent, SidebarConversationsComponent, IconComponent, NeuralOrbComponent, NotificationsComponent],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatInput') chatInput?: ChatInputComponent;
  @ViewChild('messagesArea') messagesArea?: ElementRef<HTMLElement>;
  @ViewChild('sidebar') sidebar?: SidebarConversationsComponent;
  @ViewChild('settingsDialog') settingsDialog?: ElementRef<HTMLDialogElement>;
  readonly preferences = inject(PreferencesService);
  readonly pwa = inject(PwaService);
  private readonly gemini = inject(GeminiService);
  private readonly storage = inject(StorageService);
  private readonly history = inject(ConversationHistoryService);
  private readonly notices = inject(NotificationService);
  private readonly speech = inject(SpeechService);
  private readonly cdr = inject(ChangeDetectorRef);

  messages: Message[] = [];
  conversations: Conversation[] = [];
  currentConversationId: string | null = null;
  isLoading = false;
  isOnline = navigator.onLine;
  sidebarOpen = false;
  mode: ChatMode = 'general';
  showScrollButton = false;
  announcement = '';
  private request?: Subscription;
  private revealTimer?: ReturnType<typeof setInterval>;
  private scrollTimer?: ReturnType<typeof setTimeout>;
  private generation = 0;
  private followMessages = true;
  private activeReplyId: string | null = null;
  private readonly reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');

  readonly particles = Array.from({ length: 22 }, (_, index) => ({
    x: (index * 37 + 11) % 100, y: (index * 23 + 7) % 100,
    delay: -(index * 1.7), duration: 14 + index % 9,
  }));
  readonly responseStyles: { id: ResponseStyle; title: string; text: string }[] = [
    { id: 'concise', title: 'Breve', text: 'Directo al punto' },
    { id: 'balanced', title: 'Equilibrado', text: 'El detalle justo' },
    { id: 'detailed', title: 'Detallado', text: 'Un paso más allá' },
  ];
  readonly modeNames: Record<ChatMode, string> = { general: 'Tu espacio', create: 'Estudio creativo', code: 'Laboratorio de código', learn: 'Espacio de aprendizaje' };
  readonly suggestionsByMode: Record<ChatMode, Suggestion[]> = {
    general: [
      { icon: 'pen', title: 'Dale forma a una idea', description: 'Un poco de inspiración, un gran comienzo.', prompt: 'Ayúdame a convertir una idea en un proyecto. Hazme preguntas para descubrir qué quiero crear y propón un plan.', color: 'lime' },
      { icon: 'code', title: 'Construye algo increíble', description: 'De la primera línea al siguiente nivel.', prompt: 'Quiero crear un proyecto de programación original. Dame tres ideas para empezar y ayúdame a elegir según mi nivel.', color: 'cyan' },
      { icon: 'book', title: 'Aprende algo nuevo', description: 'Lo complejo, un poco más simple.', prompt: 'Enséñame algo fascinante sobre inteligencia artificial con una explicación sencilla y un ejemplo práctico.', color: 'purple' },
      { icon: 'bulb', title: 'Encuentra otra perspectiva', description: 'Nuevos caminos para tus preguntas.', prompt: 'Ayúdame a pensar de forma diferente sobre un reto. Primero pregúntame qué quiero resolver y después exploremos nuevas perspectivas.', color: 'peach' },
    ],
    create: [
      { icon: 'pen', title: 'Escribe con tu voz', description: 'Textos que conectan de verdad.', prompt: 'Ayúdame a escribir un texto que conecte con mi audiencia. Pregúntame por el tema, el público y el tono que busco.', color: 'lime' },
      { icon: 'sparkles', title: 'Rompe el bloqueo creativo', description: 'Una chispa para tu próxima idea.', prompt: 'Dame cinco ejercicios originales y breves para superar un bloqueo creativo.', color: 'cyan' },
      { icon: 'chat', title: 'Cuenta una buena historia', description: 'Personajes, mundos y posibilidades.', prompt: 'Creemos una historia original juntos. Propón tres premisas muy diferentes y luego elegimos una.', color: 'purple' },
      { icon: 'bulb', title: 'Imagina tu próxima marca', description: 'Una identidad con personalidad.', prompt: 'Ayúdame a idear una marca para un proyecto. Pregúntame sobre el producto, los valores y el público antes de sugerir nombres.', color: 'peach' },
    ],
    code: [
      { icon: 'code', title: 'De idea a código', description: 'Construye tu siguiente proyecto.', prompt: 'Ayúdame a planificar una aplicación desde cero. Pregúntame qué problema quiero resolver y qué tecnologías conozco.', color: 'lime' },
      { icon: 'search', title: 'Encuentra ese bug', description: 'Entiende qué pasa y cómo resolverlo.', prompt: 'Necesito ayuda para depurar un error. Dime qué información y código necesitas para encontrar la causa.', color: 'cyan' },
      { icon: 'book', title: 'Entiende el concepto', description: 'Explicaciones con código real.', prompt: 'Explícame cómo funcionan async y await en JavaScript con ejemplos sencillos y un ejercicio para practicar.', color: 'purple' },
      { icon: 'zap', title: 'Mejora tu código', description: 'Más claro, más rápido, más tuyo.', prompt: 'Quiero mejorar la calidad de mi código. Guíame para compartir un fragmento y revisarlo en legibilidad, rendimiento y buenas prácticas.', color: 'peach' },
    ],
    learn: [
      { icon: 'book', title: 'Explícamelo fácil', description: 'Todo se entiende, paso a paso.', prompt: 'Explícame la computación cuántica como si fuera principiante, usando analogías y un ejemplo sencillo.', color: 'lime' },
      { icon: 'globe', title: 'Practica otro idioma', description: 'Una conversación, un nuevo mundo.', prompt: 'Quiero practicar inglés contigo. Pregúntame mi nivel y comienza una conversación con correcciones amables.', color: 'cyan' },
      { icon: 'bulb', title: 'Pon a prueba tu mente', description: 'Un pequeño reto, un gran aprendizaje.', prompt: 'Propón un acertijo de lógica interesante. No me des la respuesta todavía; ayúdame con pistas si las necesito.', color: 'purple' },
      { icon: 'clock', title: 'Traza tu ruta de estudio', description: 'Aprender con un plan cambia todo.', prompt: 'Ayúdame a crear un plan de estudio realista. Pregúntame qué quiero aprender, cuánto tiempo tengo y mi nivel actual.', color: 'peach' },
    ],
  };

  get suggestions() { return this.suggestionsByMode[this.mode]; }
  get currentTitle() { return this.conversations.find(item => item.id === this.currentConversationId)?.title || 'Nueva conversación'; }

  ngOnInit() {
    this.conversations = this.history.getAll();
    this.messages = this.storage.loadMessages();
    const savedId = this.storage.getActiveId();
    const existing = this.conversations.find(item => item.id === savedId) || this.conversations.find(item => item.messages[0]?.id === this.messages[0]?.id && this.messages.length > 0);
    this.currentConversationId = existing?.id || null;
    if (existing && !this.messages.length) this.messages = existing.messages;
    if (this.messages.length) this.persist();
    if (new URLSearchParams(window.location.search).get('new') === '1') {
      this.startNewChat();
      window.history.replaceState({}, '', window.location.pathname);
    }
    this.scrollToBottom();
  }

  @HostListener('window:online') onOnline() { this.isOnline = true; this.notices.show('Conexión recuperada. Sigamos creando.'); }
  @HostListener('window:offline') onOffline() { this.isOnline = false; }
  @HostListener('window:keydown', ['$event']) keyboard(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      if (document.querySelector('dialog[open]')) return;
      event.preventDefault();
      this.sidebarOpen = true;
      setTimeout(() => this.sidebar?.focusSearch());
    }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'o') {
      if (document.querySelector('dialog[open]')) return;
      event.preventDefault(); this.startNewChat();
    }
  }

  handleSendMessage(content: string) {
    const prompt = content.trim();
    if (!prompt || this.isLoading || prompt.length > 12000) return;
    if (!this.isOnline) { this.notices.show('Necesitas conexión para enviar mensajes. Tu historial sigue disponible.', 'info'); return; }
    this.speech.stop();
    const history = [...this.messages];
    this.messages = [...this.messages, { id: crypto.randomUUID(), content: prompt, role: 'user', timestamp: new Date(), status: 'sent' }];
    this.persist();
    this.requestReply(prompt, history);
  }

  private requestReply(prompt: string, history: Message[]) {
    const id = crypto.randomUUID();
    const generation = ++this.generation;
    const started = performance.now();
    this.activeReplyId = id;
    this.isLoading = true;
    this.followMessages = true;
    this.announcement = 'Ayvar está preparando tu respuesta.';
    this.messages = [...this.messages, { id, content: '', role: 'ai', timestamp: new Date(), status: 'sending' }];
    this.scrollToBottom();
    this.request = this.gemini.sendMessage(prompt, history, this.mode).subscribe({
      next: text => {
        if (generation !== this.generation) return;
        const responseTime = (performance.now() - started) / 1000;
        if (!this.preferences.motion() || this.reducedMotion?.matches || document.hidden) {
          this.updateMessage(id, { content: text, status: 'sent', responseTime });
          this.finishReply();
          return;
        }
        let position = 0;
        const step = Math.max(14, Math.ceil(text.length / 45));
        this.revealTimer = setInterval(() => {
          position = Math.min(position + step, text.length);
          this.updateMessage(id, { content: text.slice(0, position), status: position === text.length ? 'sent' : 'streaming', responseTime });
          if (this.followMessages) this.scrollToBottom(false);
          if (position === text.length) this.finishReply();
        }, 22);
      },
      error: (error: unknown) => {
        if (generation !== this.generation) return;
        const description = error instanceof HttpErrorResponse
          ? (typeof error.error?.error === 'string' ? error.error.error : error.status === 0 ? 'Se interrumpió la conexión. Revisa tu internet y vuelve a intentarlo.' : 'No se pudo obtener una respuesta. Vuelve a intentarlo.')
          : error instanceof Error && error.name === 'TimeoutError' ? 'La respuesta está tardando demasiado. Puedes volver a intentarlo.' : 'No se pudo completar la respuesta. Inténtalo otra vez.';
        this.updateMessage(id, { content: description, status: 'error' });
        this.finishReply();
      },
    });
  }

  private updateMessage(id: string, patch: Partial<Message>) {
    this.messages = this.messages.map(message => message.id === id ? { ...message, ...patch } : message);
    this.cdr.markForCheck();
  }

  private finishReply() {
    clearInterval(this.revealTimer);
    this.isLoading = false;
    this.activeReplyId = null;
    this.announcement = this.messages.at(-1)?.status === 'error' ? 'No se pudo completar la respuesta. Puedes volver a intentarlo.' : 'La respuesta de Ayvar está lista.';
    this.persist();
    if (this.followMessages) this.scrollToBottom(false);
    this.cdr.markForCheck();
  }

  stopReply() {
    if (!this.isLoading) return;
    ++this.generation;
    this.request?.unsubscribe();
    clearInterval(this.revealTimer);
    if (this.activeReplyId) this.updateMessage(this.activeReplyId, { status: 'stopped' });
    this.isLoading = false;
    this.activeReplyId = null;
    this.announcement = 'Respuesta detenida.';
    this.persist();
  }

  regenerate(id: string) {
    if (this.isLoading || !this.isOnline) {
      if (!this.isOnline) this.notices.show('Recupera tu conexión para volver a intentarlo.', 'info');
      return;
    }
    const index = this.messages.findIndex(message => message.id === id);
    if (index !== this.messages.length - 1 || index < 1) return;
    const user = this.messages[index - 1];
    if (user.role !== 'user') return;
    this.speech.stop();
    this.messages = this.messages.slice(0, index);
    this.requestReply(user.content, this.messages.slice(0, -1));
  }

  private persist() {
    this.storage.saveMessages(this.messages);
    if (!this.messages.length) return;
    const conversation = this.history.createFromMessages(this.messages, this.currentConversationId || undefined);
    this.currentConversationId = conversation.id;
    this.history.updateConversation(conversation);
    this.storage.setActiveId(conversation.id);
    this.conversations = this.history.getAll();
  }

  startNewChat() {
    this.stopReply();
    this.speech.stop();
    this.messages = [];
    this.currentConversationId = null;
    this.storage.clearMessages();
    this.storage.setActiveId(null);
    this.sidebarOpen = false;
    this.showScrollButton = false;
    this.followMessages = true;
    this.announcement = 'Nueva conversación. ¿Qué vamos a crear?';
    this.chatInput?.setDraft('');
    this.messagesArea?.nativeElement.scrollTo({ top: 0 });
  }

  loadConversation(conversation: Conversation) {
    if (conversation.id === this.currentConversationId) { this.sidebarOpen = false; return; }
    this.stopReply();
    this.speech.stop();
    this.messages = conversation.messages.map(message => ({ ...message }));
    this.currentConversationId = conversation.id;
    this.storage.setActiveId(conversation.id);
    this.storage.saveMessages(this.messages);
    this.sidebarOpen = false;
    this.chatInput?.setDraft('');
    this.scrollToBottom();
  }

  async deleteConversation(id: string) {
    const confirmed = await this.notices.confirm({
      title: '¿Eliminar esta conversación?',
      description: 'Este chat se eliminará del historial de este dispositivo. Esta acción no se puede deshacer.',
      confirmLabel: 'Sí, eliminar', cancelLabel: 'Conservar chat', danger: true,
    });
    if (!confirmed) return;
    if (id === this.currentConversationId) this.startNewChat();
    this.history.deleteConversation(id);
    this.conversations = this.history.getAll();
    this.notices.show('Conversación eliminada. Espacio para nuevas ideas.');
    this.cdr.markForCheck();
  }

  setMode(mode: ChatMode) {
    this.mode = mode;
    this.sidebarOpen = false;
    if (this.messages.length) this.notices.show(`Modo ${this.modeNames[mode].toLocaleLowerCase()} activado.`, 'info');
    this.chatInput?.focus();
  }

  useSuggestion(suggestion: Suggestion) {
    if (this.isOnline) this.handleSendMessage(suggestion.prompt);
    else { this.chatInput?.setDraft(suggestion.prompt); this.notices.show('Tu idea está lista. Conéctate para enviarla.', 'info'); }
  }

  exportChat() {
    if (!this.messages.length) return;
    const text = `# Ayvar AI · ${this.currentTitle}\n\n` + this.messages.filter(message => message.status !== 'sending').map(message => `## ${message.role === 'user' ? 'Tú' : 'Ayvar'} · ${message.timestamp.toLocaleString('es')}\n\n${message.content}\n`).join('\n---\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `ayvar-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.notices.show('Conversación exportada. Tus ideas van contigo.');
  }

  openSettings() { this.settingsDialog?.nativeElement.showModal(); }
  closeSettings() { this.settingsDialog?.nativeElement.close(); }
  settingsBackdrop(event: MouseEvent) {
    const element = this.settingsDialog?.nativeElement;
    if (event.target !== element || !element) return;
    const rect = element.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.closeSettings();
  }

  onScroll() {
    const element = this.messagesArea?.nativeElement;
    if (!element) return;
    this.followMessages = element.scrollHeight - element.clientHeight - element.scrollTop < 100;
    this.showScrollButton = !this.followMessages && this.messages.length > 0;
  }

  scrollToBottom(force = true) {
    if (force) { this.followMessages = true; this.showScrollButton = false; }
    clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      const element = this.messagesArea?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
    }, 0);
  }

  ngOnDestroy() {
    this.stopReply();
    this.request?.unsubscribe();
    clearInterval(this.revealTimer);
    clearTimeout(this.scrollTimer);
    this.speech.stop();
  }
}
