export const updateLowStockLimit = (currentSettings, newLimit) => {
    return { ...currentSettings, lowStockThreshold: newLimit };
};

export const updateTheme = (currentSettings, newTheme) => {
    return { ...currentSettings, theme: newTheme };
};

export const updateBusinessProfile = (currentSettings, profileData) => {
    // profileData: { businessName, businessLogo, currency, currencySymbol }
    return { ...currentSettings, ...profileData };
};
