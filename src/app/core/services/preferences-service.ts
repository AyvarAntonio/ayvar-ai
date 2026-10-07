import { Injectable, effect, signal } from '@angular/core';

export type ResponseStyle = 'balanced' | 'concise' | 'detailed';
export type ChatMode = 'general' | 'create' | 'code' | 'learn';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  readonly motion = signal(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  readonly enterToSend = signal(!window.matchMedia?.('(pointer: coarse)').matches);
  readonly responseStyle = signal<ResponseStyle>('balanced');

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem('ayvar_preferences') || '{}');
      if (typeof saved.motion === 'boolean') this.motion.set(saved.motion);
      if (typeof saved.enterToSend === 'boolean') this.enterToSend.set(saved.enterToSend);
      if (['balanced', 'concise', 'detailed'].includes(saved.responseStyle)) this.responseStyle.set(saved.responseStyle);
    } catch { /* Keep device-aware defaults when storage is unavailable. */ }
    effect(() => {
      const preferences = { motion: this.motion(), enterToSend: this.enterToSend(), responseStyle: this.responseStyle() };
      document.documentElement.classList.toggle('motion-off', !preferences.motion);
      try { localStorage.setItem('ayvar_preferences', JSON.stringify(preferences)); } catch { /* Preferences still work for this visit. */ }
    });
  }
}
