/**
 * 8-Point Spacing Grid System
 * Base unit: 4px
 */

export const SPACING = {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md_sm: '0.75rem', // 12px
    md: '1rem',     // 16px
    lg_sm: '1.25rem', // 20px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    xxl: '3rem',    // 48px
};

/**
 * Common spacing combinations
 */
export const LAYOUT = {
    screenPadding: SPACING.lg, // 24px
    cardPadding: SPACING.lg,   // 24px
    gap: SPACING.md,           // 16px
    sectionGap: SPACING.xl,    // 32px
};
