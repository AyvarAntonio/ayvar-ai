import { Injectable, effect, signal } from '@angular/core';

export type ResponseStyle = 'balanced' | 'concise' | 'detailed';
export type ChatMode = 'general' | 'create' | 'code' | 'learn';

export const NEON_COLORS = [
  { id: 'green', name: 'Verde', hex: '#c0f878', rgb: '192 248 120', hue: 86 },
  { id: 'cyan', name: 'Cian', hex: '#78edf8', rgb: '120 237 248', hue: 185 },
  { id: 'blue', name: 'Azul', hex: '#78a9f8', rgb: '120 169 248', hue: 217 },
  { id: 'violet', name: 'Violeta', hex: '#bb91ff', rgb: '187 145 255', hue: 263 },
  { id: 'pink', name: 'Rosa', hex: '#ff8dd8', rgb: '255 141 216', hue: 321 },
  { id: 'orange', name: 'Naranja', hex: '#ffbc78', rgb: '255 188 120', hue: 30 },
] as const;
export type NeonColor = typeof NEON_COLORS[number]['id'];

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  readonly motion = signal(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  readonly enterToSend = signal(!window.matchMedia?.('(pointer: coarse)').matches);
  readonly responseStyle = signal<ResponseStyle>('balanced');
  readonly neonColors = NEON_COLORS;
  readonly neonColor = signal<NeonColor>('green');
  readonly randomNeon = signal(false);

  selectNeon(color: NeonColor) {
    this.randomNeon.set(false);
    this.neonColor.set(color);
  }

  shuffleNeon() {
    const choices = NEON_COLORS.filter(color => color.id !== this.neonColor());
    this.neonColor.set(choices[Math.floor(Math.random() * choices.length)].id);
  }

  toggleRandomNeon() {
    this.randomNeon.update(enabled => !enabled);
    if (this.randomNeon()) this.shuffleNeon();
  }

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem('ayvar_preferences') || '{}');
      if (typeof saved.motion === 'boolean') this.motion.set(saved.motion);
      if (typeof saved.enterToSend === 'boolean') this.enterToSend.set(saved.enterToSend);
      if (['balanced', 'concise', 'detailed'].includes(saved.responseStyle)) this.responseStyle.set(saved.responseStyle);
      if (NEON_COLORS.some(color => color.id === saved.neonColor)) this.neonColor.set(saved.neonColor);
      if (typeof saved.randomNeon === 'boolean') this.randomNeon.set(saved.randomNeon);
    } catch { /* Si falla la lectura, conservamos los valores por defecto según el dispositivo. */ }
    if (this.randomNeon()) this.shuffleNeon();
    effect(() => {
      const preferences = { motion: this.motion(), enterToSend: this.enterToSend(), responseStyle: this.responseStyle(), neonColor: this.neonColor(), randomNeon: this.randomNeon() };
      const palette = NEON_COLORS.find(color => color.id === preferences.neonColor)!;
      document.documentElement.style.setProperty('--accent', palette.hex);
      document.documentElement.style.setProperty('--accent-rgb', palette.rgb);
      document.documentElement.style.setProperty('--neon-hue', String(palette.hue));
      document.documentElement.classList.toggle('motion-off', !preferences.motion);
      try { localStorage.setItem('ayvar_preferences', JSON.stringify(preferences)); } catch { /* Aunque no se guarden, las preferencias siguen funcionando durante esta visita xd */ }
    });
  }
}
