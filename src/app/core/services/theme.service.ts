import { Injectable, computed, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'shop:theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly modeState = signal<ThemeMode>(this.readInitialMode());

  readonly mode = computed(() => this.modeState());
  readonly isDark = computed(() => this.modeState() === 'dark');

  constructor() {
    this.applyMode(this.modeState());
  }

  toggle(): void {
    this.setMode(this.isDark() ? 'light' : 'dark');
  }

  setMode(mode: ThemeMode): void {
    this.modeState.set(mode);
    this.applyMode(mode);
    this.writeStorage(mode);
  }

  private readInitialMode(): ThemeMode {
    const saved = this.readStorage();
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }

    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  private applyMode(mode: ThemeMode): void {
    try {
      document.documentElement.dataset['theme'] = mode;
    } catch {
      return;
    }
  }

  private readStorage(): string | null {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  }

  private writeStorage(mode: ThemeMode): void {
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      return;
    }
  }
}
