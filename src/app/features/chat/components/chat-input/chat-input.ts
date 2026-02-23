// features/chat/components/chat-input/chat-input.component.ts
import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="input-wrapper">
      <!-- Partículas de fondo -->
      <div class="particles">
        <div class="particle" *ngFor="let p of particles" 
             [style.left.%]="p.left" 
             [style.top.%]="p.top"
             [style.animation-delay]="p.delay + 's'"
             [style.width.px]="p.size"
             [style.height.px]="p.size">
        </div>
      </div>

      <!-- Efecto de luz láser -->
      <div class="laser-effect"></div>

      <div class="input-container" [class.focused]="isFocused" [class.sending]="sending">
        <!-- Icono decorativo izquierdo -->
        <div class="input-icon left">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 11.5C21 16.1944 17.1944 20 12.5 20C7.80558 20 4 16.1944 4 11.5C4 6.80558 7.80558 3 12.5 3C17.1944 3 21 6.80558 21 11.5Z" 
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 21L7 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- Textarea -->
        <textarea
          #messageInput
          [(ngModel)]="message"
          (keydown.enter)="onEnter($event)"
          (focus)="isFocused = true"
          (blur)="isFocused = false"
          placeholder="Escribe tu mensaje..."
          rows="1"
          [disabled]="disabled"
        ></textarea>

        <!-- Botón de enviar con animación -->
        <button 
          class="send-btn" 
          (click)="sendMessage()"
          [disabled]="!message.trim() || disabled"
          [class.pulse]="message.trim() && !sending"
        >
          <div class="btn-content">
            @if (sending) {
              <div class="spinner-container">
                <div class="spinner"></div>
                <div class="spinner-glow"></div>
              </div>
            } @else {
              <svg class="send-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" 
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            }
          </div>
          <div class="btn-glow"></div>
        </button>
      </div>

      <!-- Efecto de onda al enviar -->
      <div class="ripple" *ngIf="showRipple"></div>
    </div>
  `,
  styles: [`
    .input-wrapper {
      position: relative;
      width: 100%;
      background: transparent;
      overflow: hidden;
    }

    /* ===== PARTÍCULAS DE FONDO ===== */
    .particles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
    }

    .particle {
      position: absolute;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50%;
      opacity: 0.2;
      animation: floatParticle 8s infinite ease-in-out;
      filter: blur(2px);
    }

    @keyframes floatParticle {
      0%, 100% {
        transform: translateY(0) translateX(0);
        opacity: 0.2;
      }
      25% {
        transform: translateY(-20px) translateX(10px);
        opacity: 0.4;
      }
      50% {
        transform: translateY(-30px) translateX(-10px);
        opacity: 0.3;
      }
      75% {
        transform: translateY(-10px) translateX(20px);
        opacity: 0.4;
      }
    }

    /* ===== EFECTO LÁSER ===== */
    .laser-effect {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(102, 126, 234, 0.1) 50%,
        transparent 70%
      );
      animation: laserMove 10s linear infinite;
      pointer-events: none;
      z-index: 1;
    }

    @keyframes laserMove {
      0% {
        transform: translateX(-50%) translateY(-50%) rotate(0deg);
      }
      100% {
        transform: translateX(-50%) translateY(-50%) rotate(360deg);
      }
    }

    /* ===== CONTENEDOR PRINCIPAL ===== */
    .input-container {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 50px;
      margin: 20px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 2;
      box-shadow: 
        0 4px 20px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(102, 126, 234, 0.1);
    }

    .input-container.focused {
      border-color: transparent;
      box-shadow: 
        0 8px 30px rgba(102, 126, 234, 0.3),
        0 0 0 2px rgba(102, 126, 234, 0.5),
        0 0 20px rgba(102, 126, 234, 0.3);
      transform: translateY(-2px);
    }

    .input-container.sending {
      background: rgba(102, 126, 234, 0.1);
      border-color: rgba(102, 126, 234, 0.5);
    }

    /* ===== ICONOS ===== */
    .input-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #667eea;
      opacity: 0.7;
      transition: all 0.3s ease;
    }

    .input-icon.left {
      animation: iconPulse 3s infinite;
    }

    .input-icon svg {
      width: 24px;
      height: 24px;
      filter: drop-shadow(0 0 5px rgba(102, 126, 234, 0.5));
    }

    .focused .input-icon {
      opacity: 1;
      color: #764ba2;
      transform: scale(1.1);
    }

    @keyframes iconPulse {
      0%, 100% {
        transform: scale(1);
        filter: drop-shadow(0 0 5px rgba(102, 126, 234, 0.3));
      }
      50% {
        transform: scale(1.1);
        filter: drop-shadow(0 0 15px rgba(102, 126, 234, 0.8));
      }
    }

    /* ===== TEXTAREA ===== */
    textarea {
      flex: 1;
      padding: 12px 8px;
      background: transparent;
      border: none;
      color: white;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 16px;
      resize: none;
      outline: none;
      transition: all 0.3s ease;
      line-height: 1.5;
      max-height: 150px;
    }

    textarea::placeholder {
      color: rgba(255, 255, 255, 0.4);
      font-weight: 300;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
    }

    textarea:focus::placeholder {
      opacity: 0.5;
      transform: translateX(10px);
    }

    textarea:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ===== BOTÓN DE ENVIAR ===== */
    .send-btn {
      position: relative;
      width: 52px;
      height: 52px;
      border: none;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      box-shadow: 
        0 4px 15px rgba(102, 126, 234, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.1) rotate(5deg);
      background: linear-gradient(135deg, #764ba2, #667eea);
      box-shadow: 
        0 8px 25px rgba(102, 126, 234, 0.6),
        0 0 20px rgba(102, 126, 234, 0.4);
    }

    .send-btn:active:not(:disabled) {
      transform: scale(0.95);
    }

    .send-btn.pulse {
      animation: buttonPulse 2s infinite;
    }

    @keyframes buttonPulse {
      0%, 100% {
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      }
      50% {
        box-shadow: 0 8px 30px rgba(102, 126, 234, 0.8);
      }
    }

    .send-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
      background: linear-gradient(135deg, #888, #666);
      transform: scale(0.95);
    }

    .btn-content {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .send-icon {
      width: 24px;
      height: 24px;
      filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
      animation: iconFly 0.5s ease;
    }

    @keyframes iconFly {
      0% {
        transform: translateX(-10px) scale(0.8);
        opacity: 0;
      }
      100% {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
    }

    .btn-glow {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .send-btn:hover .btn-glow {
      opacity: 0.4;
    }

    /* ===== SPINNER ===== */
    .spinner-container {
      position: relative;
      width: 24px;
      height: 24px;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-glow {
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%);
      animation: glowPulse 1.5s ease-in-out infinite;
    }

    @keyframes glowPulse {
      0%, 100% {
        opacity: 0.3;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.2);
      }
    }

    /* ===== EFECTO RIPPLE ===== */
    .ripple {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 5px;
      height: 5px;
      background: rgba(102, 126, 234, 0.5);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: rippleEffect 1s ease-out;
      pointer-events: none;
      z-index: 3;
    }

    @keyframes rippleEffect {
      0% {
        width: 5px;
        height: 5px;
        opacity: 0.5;
      }
      100% {
        width: 300px;
        height: 300px;
        opacity: 0;
      }
    }

    /* ===== MODO OSCURO ===== */
    :host-context(.dark-mode) {
      .input-container {
        background: rgba(0, 0, 0, 0.3);
        border-color: rgba(255, 255, 255, 0.05);
      }

      textarea {
        color: #fff;
      }

      textarea::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .input-container {
        margin: 8px 8px;
        padding: 8px 12px;
        border-radius: 48px;
      }

      textarea {
        font-size: 14px;
        padding: 6px 8px;
        max-height: 80px;
      }

      .send-btn {
        width: 40px;
        height: 40px;
      }

      .input-icon svg {
        width: 18px;
        height: 18px;
      }

      .input-feedback {
        font-size: 12px;
        padding: 4px 8px;
      }
    }

    @media (max-width: 640px) {
      .input-container {
        margin: 6px 6px;
        padding: 6px 10px;
      }

      textarea {
        font-size: 13px;
        padding: 5px 6px;
        max-height: 70px;
      }

      .send-btn {
        width: 36px;
        height: 36px;
      }

      .input-icon svg {
        width: 16px;
        height: 16px;
      }
    }

    @media (max-width: 480px) {
      .input-container {
        margin: 4px 4px;
        padding: 4px 8px;
      }

      textarea {
        font-size: 12px;
        padding: 4px 6px;
        max-height: 60px;
      }

      .send-btn {
        width: 32px;
        height: 32px;
      }

      .input-icon svg {
        width: 14px;
        height: 14px;
      }

      .input-feedback {
        font-size: 10px;
        padding: 2px 4px;
      }
    }

    /* ===== ANIMACIONES ADICIONALES ===== */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Efecto de gradiente en hover */
    .input-container::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #667eea, #764ba2, #667eea);
      border-radius: 52px;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: -1;
    }

    .input-container:hover::before {
      opacity: 0.3;
    }

    /* Efecto de texto brillante */
    .input-container.focused textarea {
      text-shadow: 0 0 5px rgba(102, 126, 234, 0.5);
    }
  `]
})
export class ChatInputComponent implements AfterViewInit, OnInit {
  @Output() send = new EventEmitter<string>();
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @Input() disabled = false;
  
  message = '';
  sending = false;
  isFocused = false;
  showRipple = false;
  
  // Partículas
  particles: Array<{left: number, top: number, delay: number, size: number}> = [];

  ngOnInit() {
    // Generar partículas aleatorias
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        size: Math.random() * 4 + 2 // 2-6px
      });
    }
  }

  ngAfterViewInit() {
    this.autoResize();
  }

  onEnter(event: Event) {
    event.preventDefault();
    if (!this.sending && this.message.trim()) {
      this.sendMessage();
    }
  }

  sendMessage() {
    if (this.message.trim() && !this.sending) {
      // Mostrar efecto ripple
      this.showRipple = true;
      setTimeout(() => this.showRipple = false, 1000);

      // Emitir mensaje
      this.send.emit(this.message);
      
      // Animar salida del mensaje
      const icon = document.querySelector('.send-icon');
      icon?.classList.add('sending');
      
      this.message = '';
      this.autoResize();
      
      setTimeout(() => icon?.classList.remove('sending'), 500);
    }
  }

  private autoResize() {
    if (this.messageInput) {
      const textarea = this.messageInput.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }

  setSending(sending: boolean) {
    this.sending = sending;
  }
}