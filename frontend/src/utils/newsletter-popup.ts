const POPUP_STORAGE_KEY = "newsletter_popup_last_shown";
const HOURS_BETWEEN_POPUPS = 6;

/**
 * Check if the newsletter popup should be displayed
 * Returns true if:
 * 1. User is visiting for the first time (no timestamp stored)
 * 2. More than 6 hours have passed since last display
 */
export const shouldShowNewsletterPopup = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const lastShown = localStorage.getItem(POPUP_STORAGE_KEY);

    // First visit - show popup
    if (!lastShown) {
      return true;
    }

    // Check if 6 hours have passed
    const lastShownTimestamp = parseInt(lastShown, 10);
    const currentTimestamp = Date.now();
    const hoursPassed =
      (currentTimestamp - lastShownTimestamp) / (1000 * 60 * 60);

    return hoursPassed >= HOURS_BETWEEN_POPUPS;
  } catch (error) {
    console.error("Error checking newsletter popup status:", error);
    return false;
  }
};

/**
 * Store the current timestamp to track when popup was last shown
 */
export const markNewsletterPopupShown = (): void => {
  if (typeof window === "undefined") return;

  try {
    const currentTimestamp = Date.now().toString();
    localStorage.setItem(POPUP_STORAGE_KEY, currentTimestamp);
  } catch (error) {
    console.error("Error storing newsletter popup timestamp:", error);
  }
};

/**
 * Reset the popup timer (useful for testing)
 */
export const resetNewsletterPopupTimer = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(POPUP_STORAGE_KEY);
  } catch (error) {
    console.error("Error resetting newsletter popup timer:", error);
  }
};
