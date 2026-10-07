import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { NotificationService } from '../../core/services/notification-service';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-notifications',
  imports: [IconComponent],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      @for (notice of notifications.notices(); track notice.id) {
        <div class="toast" [class.error]="notice.kind === 'error'" [attr.role]="notice.kind === 'error' ? 'alert' : 'status'">
          <span class="toast-icon"><app-icon [name]="notice.kind === 'success' ? 'check' : 'info'" [size]="18" /></span>
          <span>{{ notice.message }}</span>
          <button class="icon-button" (click)="notifications.dismiss(notice.id)" aria-label="Cerrar notificación"><app-icon name="close" [size]="16" /></button>
        </div>
      }
    </div>
    <dialog #dialog aria-labelledby="notice-title" aria-describedby="notice-description" (cancel)="notifications.resolve(false)" (click)="backdrop($event)">
      @if (notifications.dialog(); as options) {
        <div class="dialog-top"><span class="dialog-icon" [class.danger]="options.danger"><app-icon [name]="options.danger ? 'trash' : 'sparkles'" [size]="24" /></span><button class="icon-button" autofocus (click)="notifications.resolve(false)" aria-label="Cerrar diálogo"><app-icon name="close" /></button></div>
        <h2 id="notice-title">{{ options.title }}</h2>
        <p id="notice-description">{{ options.description }}</p>
        <div class="dialog-actions">
          @if (options.cancelLabel) { <button class="secondary-button" (click)="notifications.resolve(false)">{{ options.cancelLabel }}</button> }
          <button class="primary-button" [class.danger-button]="options.danger" (click)="notifications.resolve(true)">{{ options.confirmLabel || 'Entendido' }}</button>
        </div>
      }
    </dialog>
  `,
  styles: [`
    .toast-stack { position: fixed; bottom: max(24px, env(safe-area-inset-bottom)); right: 24px; z-index: 100; display: grid; gap: 10px; width: min(400px, calc(100vw - 32px)); pointer-events: none; }
    .toast { display: flex; align-items: center; gap: 12px; padding: 10px 10px 10px 16px; color: hsl(calc(var(--neon-hue) + 23) 24% 91%); background: hsl(calc(var(--neon-hue) + 54) 16% 11% / 0.961); border: 1px solid rgb(var(--accent-rgb) / 0.188); border-radius: 13px; box-shadow: 0 12px 50px #0007; font-size: 13px; line-height: 1.5; animation: enter .25s ease; pointer-events: auto; }
    .toast-icon { color: var(--accent); display: flex; }
    .toast > span:nth-child(2) { flex: 1; }
    .toast.error { border-color: #ff969e50; background: #28191ef5; }
    .toast.error .toast-icon { color: var(--danger); }
    dialog { width: 440px; }
    .dialog-top { display: flex; align-items: center; justify-content: space-between; }
    .dialog-icon { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 14px; background: rgb(var(--accent-rgb) / 0.063); color: var(--accent); }
    .dialog-icon.danger { color: var(--danger); background: #ff969e12; }
    h2 { font: 600 23px var(--display); margin: 24px 0 12px; }
    p { color: var(--muted); font-size: 14px; line-height: 1.8; white-space: pre-line; margin-bottom: 28px; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
    .danger-button { background: #ff969e; border-color: #ff969e; color: #341218; }
    .danger-button:hover { background: #ffb1b7; }
    @media(max-width: 600px) { .toast-stack { right: 16px; bottom: max(16px, env(safe-area-inset-bottom)); } }
  `],
})
export class NotificationsComponent {
  readonly notifications = inject(NotificationService);
  private readonly element = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.element()?.nativeElement;
      if (!dialog) return;
      if (this.notifications.dialog()) {
        if (!dialog.open) dialog.showModal();
      } else if (dialog.open) dialog.close();
    });
  }

  backdrop(event: MouseEvent) {
    if (event.target === this.element()?.nativeElement) {
      const bounds = this.element()!.nativeElement.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) this.notifications.resolve(false);
    }
  }
}
