/**
 * Non-sensitive user preferences storage helper
 *
 * PRIVACY GUARANTEE:
 * Only tiny, non-sensitive UX preferences (e.g., cooldown seconds, default country code)
 * are stored in localStorage.
 * NEVER store dealer names, phone numbers, campaign messages, or images in
 * localStorage, sessionStorage, IndexedDB, cookies, or Cache API.
 */

import { CampaignConfig } from '../types';

const STORAGE_KEYS = {
  DEFAULT_COUNTRY: 'troika_pref_country',
  COOLDOWN_SECONDS: 'troika_pref_cooldown',
  BREAK_INTERVAL: 'troika_pref_break_interval',
  MESSAGE_MODE: 'troika_pref_msg_mode',
  LINK_TYPE: 'troika_pref_link_type',
};

export const DEFAULT_CONFIG: CampaignConfig = {
  campaignName: '',
  messageTemplate:
    'Namaste {name},\n\nExplore Troika\'s new luxury sanitaryware and bathware collection. Crafted with artful passion for modern living spaces.\n\nPlease find our promotional catalog attached.',
  appendStopNotice: false,
  defaultCountry: 'NP',
  cooldownSeconds: 15,
  breakInterval: 40,
  messageMode: 'prefill',
  linkType: 'desktop',
  isDemoMode: false,
};

export function loadStoredPreferences(): Partial<CampaignConfig> {
  try {
    const prefs: Partial<CampaignConfig> = {};

    const country = localStorage.getItem(STORAGE_KEYS.DEFAULT_COUNTRY);
    if (country) prefs.defaultCountry = country;

    const cooldown = localStorage.getItem(STORAGE_KEYS.COOLDOWN_SECONDS);
    if (cooldown !== null) {
      const parsed = parseInt(cooldown, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 120) {
        prefs.cooldownSeconds = parsed;
      }
    }

    const breakInt = localStorage.getItem(STORAGE_KEYS.BREAK_INTERVAL);
    if (breakInt !== null) {
      const parsed = parseInt(breakInt, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 200) {
        prefs.breakInterval = parsed;
      }
    }

    const msgMode = localStorage.getItem(STORAGE_KEYS.MESSAGE_MODE);
    if (msgMode === 'prefill' || msgMode === 'blank') {
      prefs.messageMode = msgMode;
    }

    const linkType = localStorage.getItem(STORAGE_KEYS.LINK_TYPE);
    if (linkType === 'web' || linkType === 'desktop' || linkType === 'wame') {
      prefs.linkType = linkType;
    }

    return prefs;
  } catch {
    return {};
  }
}

export function saveStoredPreferences(config: Partial<CampaignConfig>): void {
  try {
    if (config.defaultCountry) {
      localStorage.setItem(STORAGE_KEYS.DEFAULT_COUNTRY, config.defaultCountry);
    }
    if (config.cooldownSeconds !== undefined) {
      localStorage.setItem(STORAGE_KEYS.COOLDOWN_SECONDS, String(config.cooldownSeconds));
    }
    if (config.breakInterval !== undefined) {
      localStorage.setItem(STORAGE_KEYS.BREAK_INTERVAL, String(config.breakInterval));
    }
    if (config.messageMode) {
      localStorage.setItem(STORAGE_KEYS.MESSAGE_MODE, config.messageMode);
    }
    if (config.linkType) {
      localStorage.setItem(STORAGE_KEYS.LINK_TYPE, config.linkType);
    }
  } catch {
    // Graceful fallback if localStorage is disabled in iframe or browser security
  }
}
