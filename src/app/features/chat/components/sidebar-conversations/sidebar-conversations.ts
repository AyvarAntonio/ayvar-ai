// features/chat/components/sidebar-conversations/sidebar-conversations.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { Conversation } from '../../../../core/services/interfaces/chat.interface';

@Component({
  selector: 'app-sidebar-conversations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar-container" [class.open]="isOpen">
      <!-- Botón para abrir/cerrar sidebar -->
      <button class="sidebar-toggle" (click)="toggleSidebar()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          @if (isOpen) {
            <path d="M18 6L6 18M6 6L18 18" stroke-width="2" stroke-linecap="round"/>
          } @else {
            <path d="M4 6H20M4 12H20M4 18H20" stroke-width="2" stroke-linecap="round"/>
          }
        </svg>
      </button>

      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>Conversaciones</h3>
          <button class="new-chat-sidebar" (click)="newChat()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5V19M5 12H19" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Nuevo chat
          </button>
        </div>

        <div class="conversations-list">
          @if (conversations.length === 0) {
            <div class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke-width="1.5"/>
                <path d="M16 8L21 3M21 8L16 3" stroke-width="1.5"/>
              </svg>
              <p>No hay conversaciones</p>
              <span>Empieza un nuevo chat</span>
            </div>
          } @else {
            @for (conv of conversations; track conv.id) {
              <div class="conversation-item" 
                   [class.selected]="conv.id === selectedId"
                   (click)="selectConversation(conv)">
                <div class="conversation-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke-width="1.5"/>
                  </svg>
                </div>
                <div class="conversation-info">
                  <div class="conversation-title">{{ conv.title || 'Nueva conversación' }}</div>
                  <div class="conversation-date">{{ conv.date | date:'dd/MM/yy HH:mm' }}</div>
                  <div class="conversation-preview">{{ getPreview(conv) }}</div>
                </div>
                <button class="delete-btn" (click)="deleteConversation(conv, $event)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 7H20M19 7L18.133 19.142C18.0971 19.6466 17.8713 20.1188 17.5011 20.4636C17.1309 20.8084 16.6455 21 16.141 21H7.859C7.3545 21 6.86908 20.8084 6.49889 20.4636C6.1287 20.1188 5.90292 19.6466 5.867 19.142L5 7H19Z" stroke-width="1.5"/>
                  </svg>
                </button>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-container {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 1000;
    }

    .sidebar-toggle {
      position: fixed;
      top: 20px;
      left: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--primary-gradient);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
    }

    .sidebar-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }

    .sidebar {
      position: fixed;
      top: 0;
      left: -320px;
      width: 320px;
      height: 100vh;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-right: 1px solid rgba(102, 126, 234, 0.2);
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000;
      box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
    }

    .sidebar-container.open .sidebar {
      left: 0;
    }

    :host-context(.dark-mode) .sidebar {
      background: rgba(30, 30, 40, 0.95);
      border-right-color: rgba(255, 255, 255, 0.1);
    }

    .sidebar-header {
      padding: 80px 20px 20px;
      border-bottom: 1px solid rgba(102, 126, 234, 0.2);
    }

    .sidebar-header h3 {
      margin: 0 0 15px 0;
      font-size: 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .new-chat-sidebar {
      width: 100%;
      padding: 12px;
      background: var(--primary-gradient);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s ease;
    }

    .new-chat-sidebar:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .conversations-list {
      height: calc(100vh - 150px);
      overflow-y: auto;
      padding: 20px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-secondary);
    }

    .empty-state svg {
      stroke: var(--text-secondary);
      margin-bottom: 15px;
    }

    .empty-state p {
      margin: 10px 0 5px;
      font-size: 16px;
      font-weight: 500;
    }

    .empty-state span {
      font-size: 14px;
      opacity: 0.7;
    }

    .conversation-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 15px;
      border-radius: 12px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      background: rgba(102, 126, 234, 0.05);
    }

    .conversation-item:hover {
      background: rgba(102, 126, 234, 0.1);
      transform: translateX(5px);
    }

    .conversation-item.selected {
      background: rgba(102, 126, 234, 0.2);
      border-left: 3px solid #667eea;
    }

    .conversation-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .conversation-info {
      flex: 1;
      min-width: 0;
    }

    .conversation-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conversation-date {
      font-size: 11px;
      color: var(--text-secondary);
      margin-bottom: 2px;
    }

    .conversation-preview {
      font-size: 12px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0.8;
    }

    .delete-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: all 0.3s ease;
    }

    .conversation-item:hover .delete-btn {
      opacity: 1;
    }

    .delete-btn:hover {
      background: #ef4444;
      color: white;
      transform: scale(1.1);
    }

    @media (max-width: 1024px) {
      .sidebar {
        width: 300px;
      }
    }

    @media (max-width: 768px) {
      .sidebar-toggle {
        top: 16px;
        left: 16px;
        width: 44px;
        height: 44px;
      }

      .sidebar {
        width: 280px;
      }

      .sidebar-header {
        padding: 70px 16px 16px;
      }

      .sidebar-header h3 {
        font-size: 18px;
        margin-bottom: 12px;
      }

      .new-chat-sidebar {
        padding: 10px;
        font-size: 13px;
      }

      .conversations-list {
        height: calc(100vh - 140px);
        padding: 16px;
      }

      .conversation-item {
        padding: 12px;
        gap: 10px;
        margin-bottom: 6px;
      }

      .conversation-icon {
        width: 32px;
        height: 32px;
        min-width: 32px;
      }

      .conversation-title {
        font-size: 13px;
      }

      .conversation-date {
        font-size: 10px;
      }

      .conversation-preview {
        font-size: 11px;
      }

      .delete-btn {
        width: 28px;
        height: 28px;
      }

      .delete-btn svg {
        width: 14px;
        height: 14px;
      }
    }

    @media (max-width: 640px) {
      .sidebar-toggle {
        top: 12px;
        left: 12px;
        width: 40px;
        height: 40px;
      }

      .sidebar {
        width: 260px;
      }

      .sidebar-header {
        padding: 60px 12px 12px;
      }

      .sidebar-header h3 {
        font-size: 16px;
      }

      .conversations-list {
        height: calc(100vh - 130px);
        padding: 12px;
      }

      .conversation-item {
        padding: 10px;
        gap: 8px;
        margin-bottom: 4px;
      }

      .new-chat-sidebar {
        padding: 8px;
        font-size: 12px;
      }
    }

    @media (max-width: 480px) {
      .sidebar-toggle {
        top: 10px;
        left: 10px;
        width: 38px;
        height: 38px;
      }

      .sidebar {
        width: 240px;
      }

      .sidebar-header {
        padding: 50px 10px 10px;
      }

      .sidebar-header h3 {
        font-size: 14px;
        margin-bottom: 8px;
      }

      .new-chat-sidebar {
        padding: 6px;
        font-size: 11px;
        gap: 6px;
      }

      .new-chat-sidebar svg {
        width: 16px;
        height: 16px;
      }

      .conversations-list {
        height: calc(100vh - 120px);
        padding: 8px;
      }

      .conversation-item {
        padding: 8px;
        gap: 6px;
        margin-bottom: 4px;
      }

      .conversation-icon {
        width: 28px;
        height: 28px;
        min-width: 28px;
      }

      .conversation-title {
        font-size: 12px;
      }

      .conversation-date {
        font-size: 9px;
      }

      .conversation-preview {
        font-size: 10px;
      }

      .delete-btn {
        width: 24px;
        height: 24px;
      }

      .delete-btn svg {
        width: 12px;
        height: 12px;
      }

      .empty-state {
        padding: 30px 12px;
      }

      .empty-state svg {
        width: 40px;
        height: 40px;
      }

      .empty-state p {
        font-size: 14px;
      }

      .empty-state span {
        font-size: 12px;
      }
    }
  `]
})
export class SidebarConversationsComponent {
  @Input() conversations: Conversation[] = [];
  @Input() selectedId: string | null = null;
  @Output() conversationSelected = new EventEmitter<Conversation>();
  @Output() conversationDeleted = new EventEmitter<string>();
  @Output() newChatClicked = new EventEmitter<void>();

  isOpen = false;

  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }

  selectConversation(convo: Conversation) {
    this.conversationSelected.emit(convo);
    this.isOpen = false; // Cerrar sidebar en móvil después de seleccionar
  }

  newChat() {
    this.newChatClicked.emit();
    this.isOpen = false;
  }

  async deleteConversation(convo: Conversation, event: Event) {
    event.stopPropagation();
    const result = await Swal.fire({
      title: '¿Eliminar esta conversación?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
      this.conversationDeleted.emit(convo.id);
      await Swal.fire('¡Conversación eliminada!', '', 'success');
    }
  }

  getPreview(convo: Conversation): string {
    if (convo.messages.length > 0) {
      const lastMsg = convo.messages[convo.messages.length - 1];
      return lastMsg.content.substring(0, 30) + (lastMsg.content.length > 30 ? '...' : '');
    }
    return '';
  }
}
