export const PRIVATE_MODE = true;
export const DEFAULT_TIMEZONE = "America/New_York";
export const DEFAULT_BEDTIME = "22:30";
export const DEFAULT_WAKE_TIME = "06:30";
export const DEFAULT_SLEEP_GOAL_HOURS = 8;
export const DEFAULT_MAIN_PATH = "Speed/Athleticism";
export const PRIVATE_LINK_KEY_STORAGE = "gatebound_private_link_key_v1";

export function loadPrivateLinkKey() {
  try { return localStorage.getItem(PRIVATE_LINK_KEY_STORAGE) || ""; }
  catch (_) { return ""; }
}

export function savePrivateLinkKey(value) {
  try {
    const clean=String(value || "").trim();
    if (clean) localStorage.setItem(PRIVATE_LINK_KEY_STORAGE, clean);
    else localStorage.removeItem(PRIVATE_LINK_KEY_STORAGE);
    return true;
  } catch (_) { return false; }
}
