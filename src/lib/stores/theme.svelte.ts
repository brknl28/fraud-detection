type ThemeMode = 'light' | 'system' | 'dark';

class ThemeStore {
	mode = $state<ThemeMode>('system');

	constructor() {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('theme-mode') as ThemeMode | null;
			if (stored === 'light' || stored === 'dark') {
				this.mode = stored;
			}
			this.apply();
		}
	}

	setMode(mode: ThemeMode) {
		this.mode = mode;
		localStorage.setItem('theme-mode', mode);
		this.apply();
	}

	private apply() {
		if (typeof document === 'undefined') return;

		const meta = document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement | null;
		if (this.mode === 'system') {
			document.documentElement.style.colorScheme = '';
			if (meta) meta.content = 'light dark';
		} else {
			document.documentElement.style.colorScheme = this.mode;
			if (meta) meta.content = this.mode;
		}
	}
}

export const themeStore = new ThemeStore();
