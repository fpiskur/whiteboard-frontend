import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme-preference';

function getSystemTheme(): Theme {
    if (!browser) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialTheme(): Theme {
    if (!browser) return 'light';

    // Check localStorage first
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }

    // Fall back to system preference
    return getSystemTheme();
}

class ThemeState {
    currentTheme = $state<Theme>(getInitialTheme());

    get isDark() {
        return this.currentTheme === 'dark';
    }

    toggle() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.persist();
        this.apply();
    }

    setTheme(theme: Theme) {
        this.currentTheme = theme;
        this.persist();
        this.apply();
    }

    private persist() {
        if (browser) {
            localStorage.setItem(STORAGE_KEY, this.currentTheme);
        }
    }

    private apply() {
        if (browser) {
            document.documentElement.setAttribute('data-theme', this.currentTheme);
        }
    }

    init() {
        this.apply();

        // Listen for system theme changes
        if (browser) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't set a preference
                if (!localStorage.getItem(STORAGE_KEY)) {
                    this.currentTheme = e.matches ? 'dark' : 'light';
                    this.apply();
                }
            });
        }
    }
}

export const themeState = new ThemeState();
