import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService } from './notification-service';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly notices = inject(NotificationService);
  private readonly updates = inject(SwUpdate);
  private promptEvent: InstallPrompt | null = null;
  readonly installed = signal(window.matchMedia?.('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  readonly installReady = signal(false);
  readonly installing = signal(false);
  readonly updateAvailable = signal(false);

  constructor() {
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      this.promptEvent = event as InstallPrompt;
      this.installReady.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.installReady.set(false);
      this.promptEvent = null;
      this.notices.show('Ayvar ya tiene un lugar en tu dispositivo.');
    });
    if (this.updates.isEnabled) {
      this.updates.versionUpdates.pipe(takeUntilDestroyed()).subscribe(event => {
        if (event.type === 'VERSION_READY') this.updateAvailable.set(true);
      });
    }
  }

  async install() {
    if (this.installed() || this.installing()) return;
    if (this.promptEvent) {
      const event = this.promptEvent;
      this.installing.set(true);
      try {
        await event.prompt();
        await event.userChoice;
      } catch {
        this.notices.show('No se pudo abrir la instalación. Inténtalo desde el menú del navegador.', 'info');
      } finally {
        this.promptEvent = null;
        this.installReady.set(false);
        this.installing.set(false);
      }
      return;
    }
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const android = /Android/i.test(navigator.userAgent);
    await this.notices.confirm({
      title: 'Ayvar, a un toque de distancia',
      description: ios
        ? '1. Abre esta página en Safari.\n2. Toca Compartir y «Añadir a la pantalla de inicio».\n3. Confirma con «Añadir».\n\nPodrás consultar tus chats guardados sin conexión. Para conversar con la IA necesitas internet.'
        : android
          ? 'Abre el menú ⋮ de Chrome y elige «Instalar aplicación» o «Añadir a la pantalla de inicio».\n\nLa instalación estará disponible cuando la aplicación publicada termine de cargar. Tus chats guardados también estarán disponibles sin conexión.'
          : 'En Chrome o Edge, busca el icono de instalación en la barra de direcciones o «Instalar Ayvar AI» en el menú del navegador. En Safari para Mac, elige Archivo → Añadir al Dock.\n\nLa instalación requiere la web publicada con HTTPS y un navegador compatible.',
      confirmLabel: 'Perfecto',
    });
  }

  update() { window.location.reload(); }
}
