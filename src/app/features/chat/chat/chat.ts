// features/chat/chat.component.ts
import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { Message } from '../../../core/services/interfaces/chat.interface';
import { GeminiService } from '../../../core/services/gemini-service';
import { StorageService } from '../../../core/services/storage-service';
import { ConversationHistoryService } from '../../../core/services/conversation-history-service';
import { MessageBubbleComponent } from '../components/message-bubble/message-bubble';
import { ChatInputComponent } from '../components/chat-input/chat-input';
import { SidebarConversationsComponent } from '../components/sidebar-conversations/sidebar-conversations';
import { Conversation } from '../../../core/services/interfaces/chat.interface';

// Definir interfaz para las partículas
interface Particle {
  left: number;
  top: number;
  delay: number;
  size: number;
  color: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    MessageBubbleComponent,
    ChatInputComponent,
    SidebarConversationsComponent
  ],
  template: `
    <div class="chat-container" [class.dark-mode]="isDarkMode">
      
      <!-- Sidebar de conversaciones -->
      <app-sidebar-conversations
        [conversations]="conversations"
        [selectedId]="currentConversationId"
        (conversationSelected)="loadConversation($event)"
        (conversationDeleted)="deleteConversation($event)"
        (newChatClicked)="startNewChat()"
      />

      <!-- Fondo con partículas animadas -->
      <div class="background-particles">
        <div class="particle" *ngFor="let p of backgroundParticles" 
             [style.left.%]="p.left" 
             [style.top.%]="p.top"
             [style.animation-delay]="p.delay + 's'"
             [style.width.px]="p.size"
             [style.height.px]="p.size"
             [style.background]="p.color">
        </div>
      </div>

      <!-- Efecto de red láser -->
      <div class="grid-overlay"></div>

      <!-- Efecto de luz ambiental -->
      <div class="ambient-light"></div>

      <!-- Header con vidrio y neón -->
      <header class="header glass-effect">
        <div class="header-left">
          <div class="logo-container">
            <div class="logo-glow"></div>
            <div class="logo">
              <svg class="logo-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" 
                      stroke="url(#gradient)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 12H16M12 8V16" stroke="url(#gradient)" stroke-width="1.5" stroke-linecap="round"/>
                <defs>
                  <linearGradient id="gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#667eea"/>
                    <stop offset="1" stop-color="#764ba2"/>
                  </linearGradient>
                </defs>
              </svg>
              <h1>Ayvar<span class="ai-badge">AI</span></h1>
            </div>
          </div>
          
          <div class="status-container">
            <div class="status-indicator" [class.online]="isOnline">
              <div class="status-pulse"></div>
              <span>{{ isOnline ? 'Conectado' : 'Offline' }}</span>
            </div>
            <div class="model-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke-width="1.5"/>
              </svg>
              <span>2.5 Flash</span>
            </div>
          </div>
        </div>
        
        <div class="header-right">
          <button class="action-btn" (click)="toggleTheme()" [title]="isDarkMode ? 'Modo claro' : 'Modo oscuro'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              @if (isDarkMode) {
                <path d="M12 3V4M12 20V21M4 12H3M6.31412 6.31412L5.5 5.5M17.6859 6.31412L18.5 5.5M6.31412 17.6859L5.5 18.5M17.6859 17.6859L18.5 18.5M21 12H20M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke-width="1.5"/>
              } @else {
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-width="1.5"/>
              }
            </svg>
          </button>
          
          <button class="action-btn" (click)="exportChat()" [disabled]="messages.length === 0" title="Exportar chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          
          <button class="new-chat-btn" (click)="clearChat()" [disabled]="messages.length === 0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 7H20M19 7L18.133 19.142C18.0971 19.6466 17.8713 20.1188 17.5011 20.4636C17.1309 20.8084 16.6455 21 16.141 21H7.859C7.3545 21 6.86908 20.8084 6.49889 20.4636C6.1287 20.1188 5.90292 19.6466 5.867 19.142L5 7H19ZM15 4V2H9V4H15Z" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>Nuevo Chat</span>
          </button>
        </div>

        <!-- Efecto de brillo en header -->
        <div class="header-shine"></div>
      </header>

      <!-- Área de mensajes con scroll personalizado -->
      <div class="messages-area" #messagesArea id="messages-area">
        @if (messages.length === 0) {
          <div class="welcome-container">
            <div class="welcome-glow"></div>
            
            <div class="welcome-content">
              <div class="welcome-avatar">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="url(#welcomeGradient)" stroke-width="1.5"/>
                  <path d="M8 12H16M12 8V16" stroke="url(#welcomeGradient)" stroke-width="2" stroke-linecap="round"/>
                  <defs>
                    <linearGradient id="welcomeGradient" x1="2" y1="2" x2="22" y2="22">
                      <stop stop-color="#667eea"/>
                      <stop offset="1" stop-color="#764ba2"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div class="avatar-particles">
                  <div class="particle-ring"></div>
                </div>
              </div>
              
              <h2 class="welcome-title">¡Hola! Soy <span class="gradient-text">Ayvar</span></h2>
              <p class="welcome-subtitle">Tu asistente personal con IA. ¿En qué puedo ayudarte hoy?</p>

              <div class="features-grid">
                <div class="feature-card glass-card">
                  <div class="feature-icon-wrapper">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M13 10V3L4 14H12L11 21L20 10H13Z" stroke-width="1.5"/>
                    </svg>
                  </div>
                  <h3>Respuestas Rápidas</h3>
                  <p>Optimizado para máxima velocidad</p>
                </div>
                
                <div class="feature-card glass-card">
                  <div class="feature-icon-wrapper">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9L11 7H19C19.5304 7 20.0391 7.21071 20.4142 7.58579C20.7893 7.96086 21 8.46957 21 9V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke-width="1.5"/>
                    </svg>
                  </div>
                  <h3>Chat Persistente</h3>
                  <p>Tus conversaciones se guardan</p>
                </div>
                
                <div class="feature-card glass-card">
                  <div class="feature-icon-wrapper">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-width="1.5"/>
                    </svg>
                  </div>
                  <h3>Modo Oscuro</h3>
                  <p>Para tus ojos cansados</p>
                </div>
              </div>

              <div class="suggestions-section">
                <h4>Sugerencias rápidas</h4>
                <div class="suggestions-grid">
                  @for (sug of suggestions; track sug) {
                    <button class="suggestion-chip glass-card" 
                            (click)="useSuggestion(sug)"
                            [class.loading]="isLoading">
                      <span>{{ sug }}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        } @else {
          <div class="messages-list">
            @for (message of messages; track message.id) {
              <app-message-bubble [message]="message" />
            }
          </div>
          
          @if (isLoading && messages.length > 0) {
            <div class="global-typing">
              <div class="typing-dots">
                <span></span><span></span><span></span>
              </div>
              <span>Ayvar está escribiendo</span>
            </div>
          }
        }
      </div>

      <!-- Input con diseño mejorado -->
      <div class="input-section">
        <app-chat-input 
          #chatInput 
          (send)="handleSendMessage($event)" 
          [disabled]="isLoading"
        />
      </div>

      <!-- Efecto de onda inferior -->
      <div class="bottom-wave"></div>
    </div>
  `,
  styles: [`
    /* ===== VARIABLES CSS ===== */
    :host {
      --primary-gradient: linear-gradient(135deg, #667eea, #764ba2);
      --primary-color: #667eea;
      --secondary-color: #764ba2;
      --bg-dark: #0a0a0f;
      --bg-darker: #050508;
      --bg-light: #f5f7fa;
      --bg-lighter: #ffffff;
      --text-dark: #1a1a2e;
      --text-light: #f0f0f0;
      --glass-bg: rgba(255, 255, 255, 0.1);
      --glass-border: rgba(255, 255, 255, 0.05);
      --shadow-neon: 0 0 20px rgba(102, 126, 234, 0.3);
      --shadow-neon-hover: 0 0 30px rgba(102, 126, 234, 0.5);
    }

    /* ===== MODO CLARO / OSCURO ===== */
    :host {
      --bg-primary: var(--bg-light);
      --bg-secondary: var(--bg-lighter);
      --text-primary: var(--text-dark);
      --text-secondary: #4a5568;
      --border-color: #e2e8f0;
      --glass-opacity: 0.7;
    }

    :host-context(.dark-mode) {
      --bg-primary: var(--bg-dark);
      --bg-secondary: var(--bg-darker);
      --text-primary: var(--text-light);
      --text-secondary: #a0aec0;
      --border-color: #2d3748;
      --glass-opacity: 0.2;
    }

    .chat-container {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--bg-primary);
      color: var(--text-primary);
      overflow: hidden;
    }

    /* ===== FONDO CON PARTÍCULAS ===== */
    .background-particles {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }

    .particle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.15;
      animation: floatParticle 15s infinite linear;
      filter: blur(3px);
    }

    @keyframes floatParticle {
      0% {
        transform: translate(0, 0) rotate(0deg);
      }
      33% {
        transform: translate(30px, -30px) rotate(120deg);
      }
      66% {
        transform: translate(-20px, 20px) rotate(240deg);
      }
      100% {
        transform: translate(0, 0) rotate(360deg);
      }
    }

    /* ===== GRID LÁSER ===== */
    .grid-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
      z-index: 0;
      animation: gridMove 20s linear infinite;
    }

    @keyframes gridMove {
      0% {
        transform: translate(0, 0);
      }
      100% {
        transform: translate(50px, 50px);
      }
    }

    /* ===== LUZ AMBIENTAL ===== */
    .ambient-light {
      position: fixed;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 30% 50%, rgba(102, 126, 234, 0.1), transparent 70%);
      animation: ambientRotate 30s linear infinite;
      pointer-events: none;
      z-index: 0;
    }

    @keyframes ambientRotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* ===== HEADER CON EFECTO VIDRIO ===== */
    .header {
      position: relative;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      padding: 16px 32px;
      background: rgba(255, 255, 255, var(--glass-opacity));
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border-color);
      z-index: 10;
      overflow: hidden;
    }

    .glass-effect {
      background: rgba(255, 255, 255, var(--glass-opacity));
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    }

    .header-shine {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      animation: shine 8s infinite;
      pointer-events: none;
    }

    @keyframes shine {
      0% {
        transform: translateX(-100%) translateY(-100%) rotate(45deg);
      }
      20% {
        transform: translateX(100%) translateY(100%) rotate(45deg);
      }
      100% {
        transform: translateX(100%) translateY(100%) rotate(45deg);
      }
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 24px;
      justify-content: center;
      grid-column: 2;
    }

    .logo-container {
      position: relative;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
      z-index: 2;
    }

    .logo-glow {
      position: absolute;
      top: -5px;
      left: -5px;
      right: -5px;
      bottom: -5px;
      background: var(--primary-gradient);
      border-radius: 50%;
      filter: blur(15px);
      opacity: 0.3;
      animation: logoGlow 3s infinite;
    }

    @keyframes logoGlow {
      0%, 100% {
        opacity: 0.3;
        transform: scale(1);
      }
      50% {
        opacity: 0.6;
        transform: scale(1.2);
      }
    }

    .logo-icon {
      width: 32px;
      height: 32px;
      filter: drop-shadow(0 0 10px rgba(102, 126, 234, 0.5));
    }

    .logo h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }

    .ai-badge {
      font-size: 12px;
      margin-left: 4px;
      padding: 2px 6px;
      background: var(--primary-gradient);
      border-radius: 12px;
      color: white;
      vertical-align: super;
    }

    .status-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 20px;
      font-size: 12px;
    }

    .status-indicator.online {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .status-pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.7;
      }
    }

    .model-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: var(--primary-gradient);
      border-radius: 20px;
      color: white;
      font-size: 12px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-self: end;
      grid-column: 3;
    }

    .action-btn {
      width: 40px;
      height: 40px;
      border: 1px solid var(--border-color);
      background: transparent;
      border-radius: 50%;
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .action-btn:hover:not(:disabled) {
      background: var(--primary-gradient);
      border-color: transparent;
      color: white;
      transform: scale(1.1);
      box-shadow: var(--shadow-neon);
    }

    .new-chat-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border: 1px solid var(--border-color);
      background: transparent;
      border-radius: 24px;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .new-chat-btn:hover:not(:disabled) {
      background: #ef4444;
      border-color: #ef4444;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
    }

    /* ===== ÁREA DE MENSAJES ===== */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px;
      scroll-behavior: smooth;
      position: relative;
      z-index: 1;
    }

    /* Scrollbar personalizado */
    .messages-area::-webkit-scrollbar {
      width: 8px;
    }

    .messages-area::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages-area::-webkit-scrollbar-thumb {
      background: var(--primary-gradient);
      border-radius: 4px;
    }

    .messages-area::-webkit-scrollbar-thumb:hover {
      box-shadow: var(--shadow-neon);
    }

    /* ===== WELCOME SCREEN ===== */
    .welcome-container {
      position: relative;
      min-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }

    .welcome-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(102, 126, 234, 0.15), transparent 70%);
      border-radius: 50%;
      animation: welcomeGlow 8s infinite;
    }

    @keyframes welcomeGlow {
      0%, 100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0.5;
      }
      50% {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 0.8;
      }
    }

    .welcome-content {
      position: relative;
      max-width: 900px;
      width: 100%;
      text-align: center;
      z-index: 2;
    }

    .welcome-avatar {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto 30px;
    }

    .welcome-avatar svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 0 20px rgba(102, 126, 234, 0.5));
    }

    .avatar-particles {
      position: absolute;
      top: -20px;
      left: -20px;
      right: -20px;
      bottom: -20px;
      pointer-events: none;
    }

    .particle-ring {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 2px solid transparent;
      border-radius: 50%;
      border-top-color: #667eea;
      border-right-color: #764ba2;
      animation: ringRotate 3s linear infinite;
    }

    @keyframes ringRotate {
      to {
        transform: rotate(360deg);
      }
    }

    .welcome-title {
      font-size: 48px;
      margin-bottom: 15px;
      color: var(--text-primary);
    }

    .gradient-text {
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .welcome-subtitle {
      font-size: 18px;
      color: var(--text-secondary);
      margin-bottom: 50px;
    }

    /* ===== FEATURE CARDS ===== */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 50px;
    }

    .glass-card {
      background: rgba(255, 255, 255, var(--glass-opacity));
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      transition: all 0.3s ease;
    }

    .feature-card {
      padding: 25px 20px;
      text-align: center;
    }

    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-neon);
      border-color: transparent;
    }

    .feature-icon-wrapper {
      width: 60px;
      height: 60px;
      margin: 0 auto 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-gradient);
      border-radius: 15px;
      color: white;
    }

    .feature-card h3 {
      font-size: 16px;
      margin-bottom: 8px;
      color: var(--text-primary);
    }

    .feature-card p {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
    }

    /* ===== SUGGESTIONS ===== */
    .suggestions-section {
      margin-top: 30px;
    }

    .suggestions-section h4 {
      font-size: 16px;
      margin-bottom: 15px;
      color: var(--text-secondary);
    }

    .suggestions-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    }

    .suggestion-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: rgba(255, 255, 255, var(--glass-opacity));
      backdrop-filter: blur(5px);
      border: 1px solid var(--border-color);
      border-radius: 30px;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
    }

    .suggestion-chip:hover:not(.loading) {
      background: var(--primary-gradient);
      color: white;
      border-color: transparent;
      transform: translateY(-2px);
      box-shadow: var(--shadow-neon);
    }

    .suggestion-chip svg {
      opacity: 0;
      transform: translateX(-5px);
      transition: all 0.3s ease;
    }

    .suggestion-chip:hover svg {
      opacity: 1;
      transform: translateX(0);
    }

    /* ===== TYPING INDICATOR ===== */
    .global-typing {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      margin: 10px 0;
      background: rgba(102, 126, 234, 0.1);
      backdrop-filter: blur(5px);
      border-radius: 30px;
      width: fit-content;
    }

    .typing-dots {
      display: flex;
      gap: 4px;
    }

    .typing-dots span {
      width: 8px;
      height: 8px;
      background: var(--primary-gradient);
      border-radius: 50%;
      animation: typingBounce 1.4s infinite;
    }

    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typingBounce {
      0%, 60%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-10px);
      }
    }

    /* ===== INPUT SECTION ===== */
    .input-section {
      position: relative;
      z-index: 10;
      margin-top: auto;
    }

    /* ===== BOTTOM WAVE ===== */
    .bottom-wave {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 60px;
      background: linear-gradient(to top, rgba(102, 126, 234, 0.1), transparent);
      pointer-events: none;
      z-index: 0;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1024px) {
      .header {
        padding: 12px 16px;
      }

      .logo h1 {
        font-size: 20px;
      }

      .new-chat-btn span {
        display: none;
      }

      .new-chat-btn {
        padding: 8px;
      }
    }

    @media (max-width: 768px) {
      .header {
        padding: 10px 12px;
        grid-template-columns: auto 1fr auto;
        gap: 8px;
      }

      .header-left {
        gap: 16px;
      }

      .logo h1 {
        font-size: 18px;
      }

      .ai-badge {
        font-size: 10px;
        margin-left: 6px;
      }

      .logo-icon {
        width: 28px;
        height: 28px;
      }

      .status-container {
        display: none;
      }

      .action-btn {
        width: 36px;
        height: 36px;
      }

      .action-btn svg {
        width: 18px;
        height: 18px;
      }

      .messages-area {
        padding: 12px 8px;
      }

      .welcome-title {
        font-size: 28px;
      }

      .welcome-subtitle {
        font-size: 14px;
      }

      .welcome-avatar {
        width: 100px;
        height: 100px;
      }

      .features-grid {
        grid-template-columns: 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }

      .feature-card {
        padding: 12px;
      }

      .feature-icon-wrapper {
        width: 40px;
        height: 40px;
      }

      .feature-icon-wrapper svg {
        width: 22px;
        height: 22px;
      }

      .feature-card h3 {
        font-size: 14px;
      }

      .feature-card p {
        font-size: 12px;
      }

      .suggestions-grid {
        flex-direction: column;
        padding: 0 12px;
        gap: 8px;
      }

      .suggestion-chip {
        width: 100%;
        padding: 10px 12px;
        font-size: 13px;
      }

      .input-section {
        padding: 0;
      }
    }

    @media (max-width: 640px) {
      .header {
        padding: 8px 10px;
      }

      .logo h1 {
        font-size: 16px;
      }

      .logo {
        gap: 8px;
      }

      .logo-icon {
        width: 24px;
        height: 24px;
      }

      .welcome-avatar {
        width: 80px;
        height: 80px;
      }

      .welcome-title {
        font-size: 24px;
      }

      .welcome-subtitle {
        font-size: 13px;
        padding: 0 12px;
      }

      .suggestions-grid {
        padding: 0;
      }

      .suggestion-chip {
        font-size: 12px;
        padding: 8px 10px;
      }

      .features-grid {
        padding: 0 12px;
      }
    }

    @media (max-width: 480px) {
      .header {
        padding: 6px 8px;
        grid-template-columns: auto 1fr auto;
      }

      .logo h1 {
        font-size: 15px;
      }

      .logo {
        gap: 6px;
      }

      .logo-icon {
        width: 22px;
        height: 22px;
      }

      .ai-badge {
        font-size: 9px;
        padding: 1px 4px;
        margin-left: 4px;
      }

      .action-btn {
        width: 32px;
        height: 32px;
      }

      .action-btn svg {
        width: 16px;
        height: 16px;
      }

      .messages-area {
        padding: 8px 4px;
      }

      .welcome-avatar {
        width: 70px;
        height: 70px;
      }

      .welcome-title {
        font-size: 20px;
        margin-bottom: 8px;
      }

      .welcome-subtitle {
        font-size: 12px;
        margin-bottom: 12px;
      }

      .suggestions-grid {
        flex-direction: column;
        padding: 0;
        gap: 6px;
      }

      .suggestion-chip {
        font-size: 11px;
        padding: 6px 8px;
        gap: 4px;
      }

      .feature-card {
        padding: 10px;
        gap: 8px;
      }

      .feature-icon-wrapper {
        width: 36px;
        height: 36px;
      }

      .feature-icon-wrapper svg {
        width: 20px;
        height: 20px;
      }

      .feature-card h3 {
        font-size: 13px;
      }

      .feature-card p {
        font-size: 11px;
      }

      .input-section {
        padding: 0;
      }
    }
  `]
})
export class ChatComponent implements OnInit {
  @ViewChild('chatInput') chatInput!: ChatInputComponent;
  @ViewChild('messagesArea') messagesArea: any;
  
  messages: Message[] = [];
  isLoading = false;
  isOnline = navigator.onLine;
  isDarkMode = false;
  
  // Propiedades para el sidebar
  conversations: Conversation[] = [];
  currentConversationId: string | null = null;
  
  suggestions = [
    'Hola',
    '¿Quién eres?',
    '¿Qué puedes hacer?',
    'Explícame la teoría de la relatividad',
    'Ayúdame con un email profesional',
    'Dame ideas para un proyecto',
    'Consejos para ser productivo',
    'Cuéntame un dato curioso'
  ];

  // Partículas de fondo
  backgroundParticles: Particle[] = [];

  constructor(
    private geminiService: GeminiService,
    private storageService: StorageService,
    private conversationHistory: ConversationHistoryService,
    private cdr: ChangeDetectorRef
  ) {
    // Generar partículas
    for (let i = 0; i < 50; i++) {
      this.backgroundParticles.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        size: Math.random() * 4 + 2,
        color: i % 2 === 0 ? '#667eea' : '#764ba2'
      });
    }

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.cdr.detectChanges();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {
    this.messages = this.storageService.loadMessages();
    this.loadTheme();
    
    // Cargar historial de conversaciones
    this.loadConversations();
    
    // Si hay mensajes, crear/actualizar conversación actual
    if (this.messages.length > 0) {
      this.saveCurrentConversation();
    }
    
    setTimeout(() => this.scrollToBottom(), 200);
  }

  // ============ MÉTODOS DEL SIDEBAR ============

  loadConversations() {
    this.conversations = this.conversationHistory.getAll();
  }

  saveCurrentConversation() {
    if (this.messages.length === 0) return;

    if (!this.currentConversationId) {
      // Crear nueva conversación
      const newConvo = this.conversationHistory.createFromMessages(this.messages);
      this.currentConversationId = newConvo.id;
      this.conversationHistory.addConversation(newConvo);
    } else {
      // Actualizar conversación existente
      const existing = this.conversations.find(c => c.id === this.currentConversationId);
      if (existing) {
        existing.messages = [...this.messages];
        existing.date = new Date();
        if (this.messages.length > 0) {
          existing.title = this.messages[0].content.substring(0, 50) + 
                          (this.messages[0].content.length > 50 ? '...' : '');
        }
        this.conversationHistory.updateConversation(existing);
      }
    }
    
    // Recargar lista
    this.loadConversations();
  }

  loadConversation(convo: Conversation) {
    this.messages = convo.messages.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp)
    }));
    this.currentConversationId = convo.id;
    this.storageService.saveMessages(this.messages);
    this.scrollToBottom();
    this.cdr.detectChanges();
  }

  startNewChat() {
    if (this.messages.length > 0) {
      this.saveCurrentConversation();
    }
    this.messages = [];
    this.currentConversationId = null;
    this.storageService.clearMessages();
    this.cdr.detectChanges();
  }

  deleteConversation(id: string) {
    this.conversationHistory.deleteConversation(id);
    this.loadConversations();
    
    if (this.currentConversationId === id) {
      this.startNewChat();
    }
  }

  // ============ MANEJO DE MENSAJES ============

  handleSendMessage(content: string) {
    if (this.isLoading) return;

    const isContinuation = content.toLowerCase().includes('continua') || 
                           content.toLowerCase().includes('sigue') ||
                           content.toLowerCase().includes('continúe') ||
                           content.toLowerCase().includes('continúa');

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    this.messages = [...this.messages, userMessage];
    this.scrollToBottom();
    this.storageService.saveMessages(this.messages);
    this.cdr.detectChanges();

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: isContinuation ? '✏️ Continuando...' : '⚡',
      role: 'ai',
      timestamp: new Date(),
      status: 'sending'
    };

    this.messages = [...this.messages, aiMessage];
    this.isLoading = true;
    this.chatInput.setSending(true);
    this.scrollToBottom();
    this.cdr.detectChanges();

    let observable;
    
    if (isContinuation && this.messages.length > 2) {
      const lastAiMessages = [...this.messages]
        .reverse()
        .find(m => m.role === 'ai' && m.status === 'sent' && m.id !== aiMessage.id);
      
      if (lastAiMessages) {
        const context = `La última respuesta fue: "${lastAiMessages.content}"`;
        observable = this.geminiService.continueConversation(context, content);
      } else {
        observable = this.geminiService.sendMessageFast(content);
      }
    } else {
      observable = this.geminiService.sendMessageFast(content);
    }

    observable.subscribe({
      next: (response: string) => {
        const index = this.messages.findIndex(m => m.id === aiMessage.id);
        
        if (index !== -1) {
          const updatedMessages = [...this.messages];
          updatedMessages[index] = {
            ...updatedMessages[index],
            content: response,
            status: 'sent'
          };
          
          this.messages = updatedMessages;
        }

        this.isLoading = false;
        this.chatInput.setSending(false);
        this.storageService.saveMessages(this.messages);
        
        // Guardar conversación después de recibir respuesta
        this.saveCurrentConversation();
        
        this.scrollToBottom();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error:', error);
        
        const index = this.messages.findIndex(m => m.id === aiMessage.id);
        
        if (index !== -1) {
          const updatedMessages = [...this.messages];
          updatedMessages[index] = {
            ...updatedMessages[index],
            content: 'Error al obtener respuesta. Intenta de nuevo.',
            status: 'error'
          };
          
          this.messages = updatedMessages;
        }

        this.isLoading = false;
        this.chatInput.setSending(false);
        this.storageService.saveMessages(this.messages);
        
        // Guardar conversación incluso si hay error
        this.saveCurrentConversation();
        
        this.scrollToBottom();
        this.cdr.detectChanges();
      }
    });
  }

  // ============ FUNCIONALIDADES EXISTENTES ============

  useSuggestion(suggestion: string) {
    if (!this.isLoading) {
      this.handleSendMessage(suggestion);
    }
  }

  async clearChat() {
    const result = await Swal.fire({
      title: '¿Seguro que quieres empezar un nuevo chat?',
      text: 'Se perderá la conversación actual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, nuevo chat',
      cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
      if (this.messages.length > 0) {
        this.saveCurrentConversation();
      }
      this.messages = [];
      this.currentConversationId = null;
      this.storageService.clearMessages();
      this.geminiService.clearCache();
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      this.scrollToBottom();
      this.cdr.detectChanges();
      await Swal.fire('¡Chat reiniciado!', '', 'success');
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
    this.cdr.detectChanges();
  }

  exportChat() {
    if (this.messages.length === 0) return;

    const chatText = this.messages.map(m => {
      const role = m.role === 'user' ? '👤 Tú' : '🤖 Ayvar';
      const time = m.timestamp.toLocaleTimeString();
      return `${role} (${time}):\n${m.content}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ayvar-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    }
    this.cdr.detectChanges();
  }

  private scrollToBottom() {
    setTimeout(() => {
      try {
        if (this.messagesArea) {
          const element = this.messagesArea.nativeElement || this.messagesArea;
          element.scrollTop = element.scrollHeight;
        } else {
          const area = document.querySelector('.messages-area');
          if (area) {
            area.scrollTop = area.scrollHeight;
          }
        }
      } catch (err) {
        console.error('Error al hacer scroll:', err);
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.messages.length > 0) {
      this.saveCurrentConversation();
    }
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  }
}