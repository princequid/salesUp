export const THEMES = {
    light: {
        colors: {
            primary: '#2563EB',      // Blue 600
            secondary: '#10B981',    // Emerald 500
            background: '#F1F5F9',   // Slate 100
            surface: '#FFFFFF',      // White
            card: '#FFFFFF',         // White
            textPrimary: '#0F172A',  // Slate 900
            textSecondary: '#475569',// Slate 600
            border: '#E2E8F0',       // Slate 200
            danger: '#EF4444',       // Red 500
            warning: '#F59E0B',      // Amber 500
            success: '#10B981'       // Emerald 500
        }
    },
    dark: {
        colors: {
            primary: '#3B82F6',      // Blue 500
            secondary: '#34D399',    // Emerald 400
            background: '#0F172A',   // Slate 900
            surface: '#1E293B',      // Slate 800
            card: '#1E293B',         // Slate 800
            textPrimary: '#F8FAFC',  // Slate 50
            textSecondary: '#CBD5E1',// Slate 300
            border: '#334155',       // Slate 700
            danger: '#F87171',       // Red 400
            warning: '#FBBF24',      // Amber 400
            success: '#34D399'       // Emerald 400
        }
    }
};

export const applyTheme = (mode) => {
    // Mode can be 'light', 'dark', or 'system'
    let themeToApply = mode;

    if (mode === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        themeToApply = systemDark ? 'dark' : 'light';
    }

    const theme = THEMES[themeToApply];
    const root = document.documentElement;

    // Apply colors to CSS variables
    root.style.setProperty('--accent-primary', theme.colors.primary);
    root.style.setProperty('--accent-secondary', theme.colors.secondary);
    root.style.setProperty('--bg-primary', theme.colors.background);
    root.style.setProperty('--bg-secondary', theme.colors.surface === '#FFFFFF' ? '#F8FAFC' : '#111827'); // Slight offset for secondary bg
    root.style.setProperty('--bg-card', theme.colors.card);
    root.style.setProperty('--text-primary', theme.colors.textPrimary);
    root.style.setProperty('--text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--glass-border', `1px solid ${theme.colors.border}`);
    root.style.setProperty('--accent-danger', theme.colors.danger);
    root.style.setProperty('--accent-warning', theme.colors.warning);
    root.style.setProperty('--accent-success', theme.colors.success);

    // Apply data attribute for specific CSS overrides if needed
    root.setAttribute('data-theme', themeToApply);
};
