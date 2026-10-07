import { AfterViewInit, Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, ViewChild, inject } from '@angular/core';
import { NEON_COLORS, NeonColor } from '../../core/services/preferences-service';

@Component({
  selector: 'app-neural-orb',
  template: `
    <div class="orb-scene" aria-hidden="true" [class.still]="!animated">
      <div class="orb-aura"></div><div class="orb-core"></div>
      <div class="orbit orbit-one"><i></i></div><div class="orbit orbit-two"><i></i></div>
      <canvas #canvas></canvas>
      <span class="orb-coordinate">01 / ∞</span><span class="orb-label">AI</span>
      <span class="orb-spark spark-one">+</span><span class="orb-spark spark-two">+</span>
    </div>
  `,
  styles: [`
    :host { position: relative; display: block; width: 280px; height: 200px; }
    .orb-scene { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 280px; height: 200px; }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
    .orb-aura { position: absolute; inset: 12% 10%; border-radius: 50%; background: radial-gradient(ellipse, hsl(calc(var(--neon-hue) + 6) 95% 66% / 0.129), hsl(calc(var(--neon-hue) + 84) 74% 63% / 0.031) 45%, transparent 70%); filter: blur(14px); animation: breathe 6s ease-in-out infinite; }
    .orb-core { position: absolute; width: 122px; height: 122px; top: 39px; left: 79px; border-radius: 50%; background: radial-gradient(circle at 33% 30%, hsl(calc(var(--neon-hue) + 14) 82% 74% / 0.051), hsl(calc(var(--neon-hue) + 84) 73% 66% / 0.035) 60%, hsl(calc(var(--neon-hue) + 71) 30% 14% / 0.133)); box-shadow: inset -8px -5px 28px hsl(calc(var(--neon-hue) + 84) 73% 66% / 0.082), inset 4px 3px 20px rgb(var(--accent-rgb) / 0.094), 0 0 40px hsl(calc(var(--neon-hue) + 10) 78% 66% / 0.063); }
    .orbit { position: absolute; left: 18px; top: 60px; width: 244px; height: 80px; border: 1px solid hsl(calc(var(--neon-hue) + 7) 59% 66% / 0.125); border-radius: 50%; transform: rotate(-25deg); }
    .orbit-two { width: 214px; height: 88px; top: 56px; left: 33px; transform: rotate(29deg); border-color: hsl(calc(var(--neon-hue) + 84) 73% 66% / 0.078); }
    .orbit i { position: absolute; left: 20px; top: 15px; width: 4px; height: 4px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent); }
    .orbit-two i { left: auto; right: 15px; top: 64px; background: var(--cyan); }
    .orb-coordinate { position: absolute; bottom: 28px; left: 12px; font: 9px var(--display); letter-spacing: 2px; color: #778876; }
    .orb-label { position: absolute; right: 34px; top: 34px; padding: 4px 6px; border: 1px solid rgb(var(--accent-rgb) / 0.157); border-radius: 4px; font: 9px var(--display); color: var(--accent); background: hsl(calc(var(--neon-hue) + 39) 23% 10%); }
    .orb-spark { position: absolute; color: hsl(calc(var(--neon-hue) + 22) 15% 60%); font: 16px var(--display); }
    .spark-one { top: 46px; left: 39px; }.spark-two { bottom: 31px; right: 29px; font-size: 11px; }
    .still * { animation: none; }
    @keyframes breathe { 50% { transform: scale(1.15); opacity: .6; } }
  `],
})
export class NeuralOrbComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() animated = true;
  @Input() color: NeonColor = 'green';
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;
  private readonly zone = inject(NgZone);
  private frame = 0;
  private context: CanvasRenderingContext2D | null = null;
  private lastFrame = 0;
  private readonly reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  private readonly visibility = () => this.restart();

  ngAfterViewInit() {
    if (typeof CanvasRenderingContext2D === 'undefined') return;
    const canvas = this.canvas!.nativeElement;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 280 * ratio;
    canvas.height = 200 * ratio;
    this.context = canvas.getContext('2d');
    this.context?.scale(ratio, ratio);
    document.addEventListener('visibilitychange', this.visibility);
    this.reduced?.addEventListener('change', this.visibility);
    this.restart();
  }

  ngOnChanges() { this.restart(); }

  private restart() {
    cancelAnimationFrame(this.frame);
    if (!this.context) return;
    this.draw(0.4);
    if (this.animated && !this.reduced?.matches && !document.hidden) {
      this.zone.runOutsideAngular(() => { this.frame = requestAnimationFrame(time => this.tick(time)); });
    }
  }

  private tick(time: number) {
    if (time - this.lastFrame > 33) {
      this.draw(time * .00013);
      this.lastFrame = time;
    }
    this.frame = requestAnimationFrame(next => this.tick(next));
  }

  private draw(angle: number) {
    const ctx = this.context!;
    const palette = NEON_COLORS.find(color => color.id === this.color)!;
    const rgb = palette.rgb.replaceAll(' ', ', ');
    ctx.clearRect(0, 0, 280, 200);
    const project = (latitude: number, longitude: number) => {
      const x = Math.cos(latitude) * Math.cos(longitude + angle);
      const y = Math.sin(latitude);
      const z = Math.cos(latitude) * Math.sin(longitude + angle);
      return { x: 140 + (x * .96 - y * .28) * 65, y: 100 + (y * .96 + x * .28) * 65, z };
    };
    // A rotating latitude/longitude mesh, rendered outside Angular's change detection.
    for (let row = 1; row < 17; row++) {
      const latitude = -Math.PI / 2 + row * Math.PI / 17;
      for (let col = 0; col < 40; col++) {
        const point = project(latitude, col * Math.PI / 20);
        const next = project(latitude, (col + 1) * Math.PI / 20);
        const below = project(latitude + Math.PI / 17, col * Math.PI / 20);
        const opacity = .09 + (point.z + 1) * .2;
        ctx.strokeStyle = `rgba(${rgb}, ${point.z > .1 ? opacity : opacity * .7})`;
        ctx.lineWidth = .55;
        ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(next.x, next.y); ctx.moveTo(point.x, point.y); ctx.lineTo(below.x, below.y); ctx.stroke();
        if (point.z > 0 && col % 2 === 0) {
          ctx.fillStyle = `rgba(${rgb}, ${.25 + point.z * .6})`;
          ctx.beginPath(); ctx.arc(point.x, point.y, .65 + point.z * .45, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.frame);
    document.removeEventListener('visibilitychange', this.visibility);
    this.reduced?.removeEventListener('change', this.visibility);
  }
}
