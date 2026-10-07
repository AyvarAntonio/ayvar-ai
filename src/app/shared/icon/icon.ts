import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

const paths: Record<string, string[]> = {
  plus: ['M12 5v14M5 12h14'],
  close: ['m6 6 12 12M6 18 18 6'],
  menu: ['M4 6h16M4 12h16M4 18h16'],
  panel: ['M9 3v18', 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z'],
  search: ['M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM16 16l5 5'],
  sparkles: ['m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3ZM20 2v4M18 4h4'],
  arrow: ['M5 12h14m-6-6 6 6-6 6'],
  diagonal: ['M6 18 18 6M6 6h12v12'],
  up: ['M12 19V5m-6 6 6-6 6 6'],
  down: ['M12 5v14m-6-6 6 6 6-6'],
  chevron: ['m9 5 7 7-7 7'],
  code: ['m8 6-6 6 6 6m8-12 6 6-6 6M14 4l-4 16'],
  pen: ['m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15l-1 6Z'],
  book: ['M12 6v15M3 3c4-1 7 0 9 3 2-3 5-4 9-3v15c-4-1-7 0-9 3-2-3-5-4-9-3V3Z'],
  bulb: ['M9 18h6m-5 3h4M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z'],
  chat: ['M21 11.5a8.5 8.5 0 0 1-8.5 8.5H3l2-5a8.5 8.5 0 1 1 16-3.5ZM8 10h8m-8 4h5'],
  clock: ['M12 8v4l3 2', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'],
  download: ['M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4'],
  settings: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z', 'm9 3 1-1h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 2h-4l-1-2-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1V3Z'],
  sliders: ['M4 7h7m4 0h5M4 17h3m4 0h9M11 4v6M7 14v6'],
  trash: ['M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7'],
  check: ['m5 12 4 4L19 6'],
  copy: ['M9 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z', 'M17 4V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h1'],
  volume: ['m11 4-6 4H2v8h3l6 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14'],
  mic: ['M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8'],
  stop: ['M6 6h12v12H6Z'],
  globe: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z'],
  wifiOff: ['m2 2 20 20M8.5 16.5a5 5 0 0 1 7 0M12 20h.01M5 12a10 10 0 0 1 5-2m5 0a10 10 0 0 1 4 2M2 7a16 16 0 0 1 3-2m4-1a16 16 0 0 1 13 3'],
  retry: ['M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 2M5 16a8 8 0 0 0 13 2'],
  zap: ['m13 2-9 12h7l-1 8L21 9h-8l1-7Z'],
  pause: ['M8 5v14M16 5v14'],
  play: ['m8 4 12 8-12 8V4Z'],
  shield: ['m12 3 9 4v5c0 5-9 9-9 9s-9-4-9-9V7l9-4Zm-4 9 3 3 5-6'],
  monitor: ['M3 3h18v14H3V3Zm5 18h8m-4-4v4'],
  command: ['M9 7V5a2 2 0 1 0-2 2h10a2 2 0 1 0-2-2v14a2 2 0 1 0 2-2H7a2 2 0 1 0 2 2V7Z'],
  user: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2'],
  info: ['M12 11v6m0-10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'],
};

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">@for (path of iconPaths; track $index) { <path [attr.d]="path" /> }</svg>`,
  styles: [':host { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; line-height: 0; }'],
})
export class IconComponent {
  @Input() name = 'sparkles';
  @Input() size = 20;
  get iconPaths(): string[] { return paths[this.name] || paths['sparkles']; }
}
