// features/chat/components/message-bubble/message-bubble.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../../../core/services/interfaces/chat.interface';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bubble-wrapper" [class.user-message]="message.role === 'user'" 
         [class.error]="message.status === 'error'">
      
      <!-- Partículas de fondo específicas para cada mensaje -->
      <div class="message-particles">
        <div class="particle" *ngFor="let p of getParticlesForMessage(message.id)" 
             [style.left.%]="p.left" 
             [style.top.%]="p.top"
             [style.animation-delay]="p.delay + 's'"
             [style.width.px]="p.size"
             [style.height.px]="p.size"
             [style.background]="message.role === 'user' ? 'linear-gradient(135deg, #f093fb, #f5576c)' : 'linear-gradient(135deg, #667eea, #764ba2)'">
        </div>
      </div>

      <!-- Efecto de brillo láser -->
      <div class="laser-glow" [class.user-laser]="message.role === 'user'"></div>

      <!-- Avatar con efecto neón -->
      <div class="avatar-container">
        <div class="avatar-glow"></div>
        <div class="avatar">
          @if (message.role === 'user') {
            <svg class="avatar-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          } @else {
            <svg class="avatar-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 9H15M9 13H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          }
        </div>
      </div>
      
      <!-- Contenido del mensaje con efecto cristal -->
      <div class="message-container">
        <div class="message-glass">
          <div class="message-header">
            <span class="sender">
              {{ message.role === 'user' ? 'Tú' : 'Ayvar' }}
            </span>
            <span class="time">{{ message.timestamp | date:'HH:mm' }}</span>
            @if (message.status === 'error') {
              <span class="error-badge">!</span>
            }
          </div>
          
          <div class="message-text">
            @if (message.status === 'sending') {
              <div class="typing-container">
                <div class="typing-dots">
                  <span></span><span></span><span></span>
                </div>
                <div class="typing-glow"></div>
              </div>
            } @else {
              <p>{{ message.content }}</p>
              @if (message.role === 'ai' && message.content.length > 200) {
                <div class="read-more-glow"></div>
              }
            }
          </div>

          <!-- Efecto de onda en hover -->
          <div class="message-ripple"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Variables CSS para modo claro/oscuro */
    :host {
      --user-gradient: linear-gradient(135deg, #f093fb, #f5576c);
      --ai-gradient: linear-gradient(135deg, #667eea, #764ba2);
      --text-primary: #333333;
      --text-secondary: #666666;
      --bg-message-user: #667eea;
      --bg-message-ai: rgba(255, 255, 255, 0.9);
      --shadow-color: rgba(102, 126, 234, 0.3);
    }

    :host-context(.dark-mode) {
      --text-primary: #ffffff;
      --text-secondary: #b0b0b0;
      --bg-message-ai: rgba(45, 45, 45, 0.9);
      --shadow-color: rgba(102, 126, 234, 0.5);
    }

    .bubble-wrapper {
      position: relative;
      display: flex;
      gap: 16px;
      margin: 24px 0;
      padding: 0 20px;
      animation: slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: left;
    }

    .bubble-wrapper.user-message {
      flex-direction: row-reverse;
      transform-origin: right;
    }

    /* ===== PARTÍCULAS POR MENSAJE ===== */
    .message-particles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .particle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.15;
      animation: particleFloat 6s infinite ease-in-out;
      filter: blur(1px);
      transition: all 0.3s ease;
    }

    .bubble-wrapper:hover .particle {
      opacity: 0.3;
      animation-duration: 3s;
    }

    @keyframes particleFloat {
      0%, 100% {
        transform: translate(0, 0) rotate(0deg);
      }
      25% {
        transform: translate(10px, -15px) rotate(90deg);
      }
      50% {
        transform: translate(-5px, -25px) rotate(180deg);
      }
      75% {
        transform: translate(-15px, -10px) rotate(270deg);
      }
    }

    /* ===== EFECTO LÁSER GLOW ===== */
    .laser-glow {
      position: absolute;
      top: -10%;
      left: -10%;
      width: 120%;
      height: 120%;
      background: radial-gradient(circle at 30% 50%, rgba(102, 126, 234, 0.1), transparent 70%);
      filter: blur(20px);
      opacity: 0;
      transition: opacity 0.5s ease;
      pointer-events: none;
      z-index: 1;
    }

    .laser-glow.user-laser {
      background: radial-gradient(circle at 70% 50%, rgba(240, 147, 251, 0.1), transparent 70%);
    }

    .bubble-wrapper:hover .laser-glow {
      opacity: 0.8;
      animation: laserPulse 2s infinite;
    }

    @keyframes laserPulse {
      0%, 100% {
        transform: scale(1);
        opacity: 0.5;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.8;
      }
    }

    /* ===== AVATAR CON EFECTO NEÓN ===== */
    .avatar-container {
      position: relative;
      width: 48px;
      height: 48px;
      z-index: 3;
    }

    .avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: var(--ai-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      position: relative;
      z-index: 2;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .user-message .avatar {
      background: var(--user-gradient);
    }

    .avatar-glow {
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border-radius: 50%;
      background: inherit;
      filter: blur(8px);
      opacity: 0.3;
      z-index: 1;
      transition: all 0.3s ease;
    }

    .bubble-wrapper:hover .avatar {
      transform: scale(1.1) rotate(5deg);
    }

    .bubble-wrapper:hover .avatar-glow {
      opacity: 0.7;
      filter: blur(12px);
      animation: avatarGlow 2s infinite;
    }

    @keyframes avatarGlow {
      0%, 100% {
        transform: scale(1);
        opacity: 0.5;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.8;
      }
    }

    .avatar-icon {
      width: 24px;
      height: 24px;
      stroke: currentColor;
      filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
    }

    /* ===== CONTENEDOR DEL MENSAJE ===== */
    .message-container {
      max-width: 70%;
      position: relative;
      z-index: 2;
    }

    .user-message .message-container {
      max-width: 70%;
    }

    .message-glass {
      position: relative;
      background: var(--bg-message-ai);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      border-top-left-radius: 4px;
      padding: 16px 20px;
      box-shadow: 
        0 4px 20px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(102, 126, 234, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }

    .user-message .message-glass {
      background: var(--bg-message-user);
      border-top-right-radius: 4px;
      border-top-left-radius: 24px;
      color: white;
      box-shadow: 
        0 4px 20px rgba(240, 147, 251, 0.3),
        0 0 0 1px rgba(240, 147, 251, 0.3);
    }

    .bubble-wrapper:hover .message-glass {
      transform: translateY(-2px);
      box-shadow: 
        0 8px 30px var(--shadow-color),
        0 0 0 2px rgba(102, 126, 234, 0.3);
    }

    .user-message:hover .message-glass {
      box-shadow: 
        0 8px 30px rgba(240, 147, 251, 0.4),
        0 0 0 2px rgba(240, 147, 251, 0.4);
    }

    /* ===== HEADER DEL MENSAJE ===== */
    .message-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .user-message .message-header {
      justify-content: flex-end;
    }

    .sender {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .user-message .sender {
      background: linear-gradient(135deg, #fff, #fff);
      -webkit-text-fill-color: white;
    }

    .time {
      font-size: 11px;
      color: var(--text-secondary);
      font-weight: 300;
      letter-spacing: 0.3px;
    }

    .user-message .time {
      color: rgba(255, 255, 255, 0.7);
    }

    .error-badge {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #ef4444;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      animation: errorPulse 1.5s infinite;
    }

    @keyframes errorPulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 10px #ef4444;
      }
      50% {
        transform: scale(1.2);
        box-shadow: 0 0 20px #ef4444;
      }
    }

    /* ===== TEXTO DEL MENSAJE ===== */
    .message-text {
      position: relative;
      color: var(--text-primary);
      font-size: 15px;
      line-height: 1.6;
      word-wrap: break-word;
    }

    .user-message .message-text {
      color: white;
    }

    .message-text p {
      margin: 0;
      white-space: pre-wrap;
    }

    /* ===== TYPING ANIMATION MEJORADA ===== */
    .typing-container {
      position: relative;
      padding: 8px 0;
    }

    .typing-dots {
      display: flex;
      gap: 6px;
    }

    .typing-dots span {
      width: 10px;
      height: 10px;
      background: var(--ai-gradient);
      border-radius: 50%;
      animation: typingPro 1.5s infinite ease-in-out;
    }

    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

    .typing-glow {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, rgba(102, 126, 234, 0.3), transparent 70%);
      filter: blur(10px);
      animation: typingGlow 1.5s infinite;
    }

    @keyframes typingPro {
      0%, 60%, 100% {
        transform: translateY(0) scale(1);
        opacity: 0.5;
      }
      30% {
        transform: translateY(-10px) scale(1.2);
        opacity: 1;
      }
    }

    @keyframes typingGlow {
      0%, 100% {
        opacity: 0.3;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.1);
      }
    }

    /* ===== READ MORE GLOW ===== */
    .read-more-glow {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: linear-gradient(to top, var(--bg-message-ai), transparent);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .message-glass:hover .read-more-glow {
      opacity: 1;
    }

    /* ===== RIPPLE EFFECT ===== */
    .message-ripple {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(102, 126, 234, 0.3), transparent);
      transform: translate(-50%, -50%);
      transition: all 0.5s ease;
      pointer-events: none;
    }

    .message-glass:hover .message-ripple {
      width: 300px;
      height: 300px;
      opacity: 0;
    }

    /* ===== ANIMACIONES ===== */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* ===== ESTADO DE ERROR ===== */
    .bubble-wrapper.error .message-glass {
      border-color: #ef4444;
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .bubble-wrapper {
        margin: 12px 0;
        padding: 0 8px;
        gap: 10px;
      }

      .avatar-container {
        width: 36px;
        height: 36px;
        min-width: 36px;
      }

      .avatar-icon {
        width: 18px;
        height: 18px;
      }

      .message-container {
        max-width: 85%;
      }

      .message-glass {
        padding: 10px 12px;
        border-radius: 14px;
      }

      .message-text {
        font-size: 13px;
        line-height: 1.4;
      }

      .message-header {
        gap: 8px;
      }

      .sender {
        font-size: 11px;
        font-weight: 600;
      }

      .time {
        font-size: 9px;
      }

      .error-badge {
        font-size: 10px;
        width: 16px;
        height: 16px;
      }
    }

    @media (max-width: 640px) {
      .bubble-wrapper {
        margin: 10px 0;
        padding: 0 4px;
        gap: 8px;
      }

      .avatar-container {
        width: 32px;
        height: 32px;
        min-width: 32px;
      }

      .avatar-icon {
        width: 16px;
        height: 16px;
      }

      .message-container {
        max-width: 88%;
      }

      .message-glass {
        padding: 8px 10px;
        border-radius: 12px;
      }

      .message-text {
        font-size: 12px;
      }

      .sender {
        font-size: 10px;
      }

      .time {
        font-size: 8px;
      }
    }

    @media (max-width: 480px) {
      .bubble-wrapper {
        margin: 8px 0;
        padding: 0 2px;
        gap: 6px;
      }

      .avatar-container {
        width: 28px;
        height: 28px;
        min-width: 28px;
      }

      .avatar-icon {
        width: 14px;
        height: 14px;
      }

      .message-container {
        max-width: 90%;
      }

      .message-glass {
        padding: 6px 8px;
        border-radius: 10px;
      }

      .message-text {
        font-size: 11px;
        line-height: 1.3;
      }

      .message-header {
        gap: 6px;
      }

      .sender {
        font-size: 9px;
      }

      .time {
        font-size: 7px;
      }

      .particle {
        display: none;
      }
    }
  `]
})
export class MessageBubbleComponent implements OnInit {
  @Input({ required: true }) message!: Message;
  
  // Almacenar partículas por ID de mensaje
  private particlesMap = new Map<string, Array<{left: number, top: number, delay: number, size: number}>>();

  ngOnInit() {
    // Generar partículas solo si no existen para este mensaje
    if (!this.particlesMap.has(this.message.id)) {
      const particles = [];
      for (let i = 0; i < 15; i++) {
        particles.push({
          left: Math.random() * 100,
          top: Math.random() * 100,
          delay: Math.random() * 5,
          size: Math.random() * 3 + 1 // 1-4px
        });
      }
      this.particlesMap.set(this.message.id, particles);
    }
  }

  // Obtener partículas para un mensaje específico
  getParticlesForMessage(messageId: string) {
    return this.particlesMap.get(messageId) || [];
  }
}