import { TestBed } from '@angular/core/testing';
import { PreferencesService } from './preferences-service';

describe('Neon preferences', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute('style');
    localStorage.clear();
  });

  it('restores a saved color and keeps the other preferences', () => {
    localStorage.setItem('ayvar_preferences', JSON.stringify({ neonColor: 'pink', motion: false, enterToSend: true, responseStyle: 'concise' }));
    const preferences = TestBed.inject(PreferencesService);
    TestBed.tick();
    expect(preferences.neonColor()).toBe('pink');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#ff8dd8');
    preferences.selectNeon('blue');
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem('ayvar_preferences')!)).toMatchObject({ neonColor: 'blue', motion: false, enterToSend: true, responseStyle: 'concise' });
  });

  it('changes the saved color on entry in random mode and lets manual selection disable it', () => {
    localStorage.setItem('ayvar_preferences', JSON.stringify({ neonColor: 'green', randomNeon: true }));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const preferences = TestBed.inject(PreferencesService);
    TestBed.tick();
    expect(preferences.neonColor()).not.toBe('green');
    expect(preferences.randomNeon()).toBe(true);
    preferences.selectNeon('violet');
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem('ayvar_preferences')!)).toMatchObject({ neonColor: 'violet', randomNeon: false });
  });

  it('uses green when a saved color is invalid', () => {
    localStorage.setItem('ayvar_preferences', JSON.stringify({ neonColor: 'invalid' }));
    const preferences = TestBed.inject(PreferencesService);
    TestBed.tick();
    expect(preferences.neonColor()).toBe('green');
  });
});
