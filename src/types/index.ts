/**
 * Troika WhatsApp Sender - Type Definitions
 * Private internal tool for Troika International
 */

export type RowStatus = 'valid' | 'invalid' | 'duplicate' | 'missing_number';

export type SendStatus = 'pending' | 'opened' | 'sent' | 'skipped';

export interface DealerRow {
  id: string;
  rawIndex: number; // 1-based index in source sheet
  rawName: string;
  rawPhone: string;
  cleanName: string;
  normalizedPhone: string; // international digits only, e.g. 9779841234567
  formattedDisplayPhone: string; // e.g. +977 9841 234567
  countryCode: string;
  status: RowStatus;
  warning?: string;
  errorReason?: string;
  duplicateOfIndex?: number; // row index of original contact
  selected: boolean;
  sendRecord: {
    status: SendStatus;
    openedAt?: string;
    sentAt?: string;
    skippedAt?: string;
  };
}

export type MessageMode = 'prefill' | 'blank';
export type LinkType = 'web' | 'desktop' | 'wame';

export interface CampaignConfig {
  campaignName: string;
  messageTemplate: string;
  appendStopNotice: boolean;
  defaultCountry: string; // 'NP', 'IN', etc.
  cooldownSeconds: number; // 0-120
  breakInterval: number; // e.g. 40
  messageMode: MessageMode;
  linkType: LinkType;
  isDemoMode: boolean;
}

export interface CampaignImage {
  file: File;
  objectUrl: string;
  name: string;
  size: number;
  type: string;
}

export interface SavedProgressData {
  version: string;
  exportedAt: string;
  config: CampaignConfig;
  dealers: DealerRow[];
  campaignStartedAt?: string;
  campaignFinishedAt?: string;
  currentIndex: number;
}

export type ActiveView = 'overview' | 'new-campaign' | 'desk' | 'report';
