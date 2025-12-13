/**
 * Global Typography System
 */

export const FONT_SIZES = {
    h1: '1.5rem',      // 24px
    h2: '1.25rem',     // 20px
    h3: '1.125rem',    // 18px
    body: '1rem',      // 16px
    bodySmall: '0.875rem', // 14px
    caption: '0.75rem' // 12px
};

export const FONT_WEIGHTS = {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
};

export const LINE_HEIGHTS = {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625
};

export const TEXT_STYLES = {
    h1: { fontSize: FONT_SIZES.h1, fontWeight: FONT_WEIGHTS.bold, lineHeight: LINE_HEIGHTS.tight },
    h2: { fontSize: FONT_SIZES.h2, fontWeight: FONT_WEIGHTS.semibold, lineHeight: LINE_HEIGHTS.tight },
    h3: { fontSize: FONT_SIZES.h3, fontWeight: FONT_WEIGHTS.semibold, lineHeight: LINE_HEIGHTS.normal },
    body: { fontSize: FONT_SIZES.body, fontWeight: FONT_WEIGHTS.regular, lineHeight: LINE_HEIGHTS.normal },
    small: { fontSize: FONT_SIZES.bodySmall, fontWeight: FONT_WEIGHTS.medium, lineHeight: LINE_HEIGHTS.normal },
    caption: { fontSize: FONT_SIZES.caption, fontWeight: FONT_WEIGHTS.regular, lineHeight: LINE_HEIGHTS.normal }
};
