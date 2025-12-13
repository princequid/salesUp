// Reusable Animation System

/**
 * CSS Class names for standard animations.
 * Ensure src/styles/index.css is imported.
 */
export const ANIMATIONS = {
    fadeIn: 'animate-fade-in',      // Screen load
    slideUp: 'animate-slide-up',    // Modals/Bottom sheets
    cardPop: 'animate-card-pop',    // Cards appearing
    listItem: 'animate-list-item',  // List items
};

/**
 * Standard transition properties for inline styles
 */
export const TRANSITIONS = {
    default: 'all 0.2s ease-in-out',
    smooth: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
};

/**
 * Returns a style object with staggered animation delay.
 * @param {number} index - The index of the item in the list
 * @param {number} baseDelayMs - Base delay in milliseconds (default 50)
 * @returns {object} Style object with animationDelay
 */
export const getStaggerDelay = (index, baseDelayMs = 50) => {
    return {
        animationDelay: `${index * baseDelayMs}ms`
    };
};

/**
 * Animation duration constants (ms)
 */
export const DURATIONS = {
    fast: 200,
    normal: 300,
    slow: 500,
};
