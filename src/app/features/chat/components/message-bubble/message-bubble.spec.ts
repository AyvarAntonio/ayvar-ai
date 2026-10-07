import { TestBed } from '@angular/core/testing';
import { MessageBubbleComponent } from './message-bubble';

describe('AI response rendering', () => {
  it('formats Markdown while rendering raw HTML as text and rejecting unsafe links', async () => {
    await TestBed.configureTestingModule({ imports: [MessageBubbleComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MessageBubbleComponent);
    fixture.componentRef.setInput('message', {
      id: 'answer', role: 'ai', timestamp: new Date(), status: 'sent',
      content: '**Respuesta**\n\n```js\nconst x = 1;\n```\n\n<img src=x onerror="alert(1)">\n\n[enlace](javascript:alert%281%29)',
    });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.markdown strong')?.textContent).toBe('Respuesta');
    expect(element.querySelector('pre code')?.textContent).toContain('const x = 1;');
    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('a')?.getAttribute('href')).not.toMatch(/^javascript:/i);
  });
});
