import { Injectable, signal } from '@angular/core';

export interface Notice {
  id: number;
  message: string;
  kind: 'success' | 'error' | 'info';
}

export interface DialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notices = signal<Notice[]>([]);
  readonly dialog = signal<DialogOptions | null>(null);
  private sequence = 0;
  private resolveDialog?: (value: boolean) => void;
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  show(message: string, kind: Notice['kind'] = 'success') {
    const id = ++this.sequence;
    if (this.notices().length >= 3) this.dismiss(this.notices()[0].id);
    this.notices.update(items => [...items, { id, message, kind }]);
    this.timers.set(id, setTimeout(() => this.dismiss(id), kind === 'error' ? 8000 : 4500));
  }

  dismiss(id: number) {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.notices.update(items => items.filter(item => item.id !== id));
  }

  confirm(options: DialogOptions): Promise<boolean> {
    this.resolveDialog?.(false);
    this.dialog.set(options);
    return new Promise(resolve => { this.resolveDialog = resolve; });
  }

  resolve(value: boolean) {
    this.dialog.set(null);
    this.resolveDialog?.(value);
    this.resolveDialog = undefined;
  }
}
