import { TestBed } from '@angular/core/testing';
import { ChatInputComponent } from './chat-input';

describe('Message composer', () => {
  beforeEach(() => { localStorage.clear(); TestBed.configureTestingModule({ imports: [ChatInputComponent] }); });

  it('preserves multiline input on Shift+Enter and trims the submitted message', async () => {
    const fixture = TestBed.createComponent(ChatInputComponent);
    const input = fixture.componentInstance;
    const send = vi.fn();
    input.send.subscribe(send);
    input.preferences.enterToSend.set(true);
    input.message = '  primera línea\nsegunda línea  ';
    await fixture.whenStable();
    const newline = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, cancelable: true });
    input.onEnter(newline);
    expect(newline.defaultPrevented).toBe(false);
    expect(send).not.toHaveBeenCalled();
    input.onEnter(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(send).toHaveBeenCalledWith('primera línea\nsegunda línea');
    expect(input.message).toBe('');
  });

  it('retains a draft while busy or offline and does not submit during IME composition', () => {
    const input = TestBed.createComponent(ChatInputComponent).componentInstance;
    const send = vi.fn();
    input.send.subscribe(send);
    input.message = 'Una idea';
    input.busy = true; input.sendMessage();
    input.busy = false; input.offline = true; input.sendMessage();
    input.offline = false;
    input.onEnter(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true }));
    expect(send).not.toHaveBeenCalled();
    expect(input.message).toBe('Una idea');
  });
});
