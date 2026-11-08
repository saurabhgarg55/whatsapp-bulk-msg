/**
 * Phone number normalisation and validation utilities using libphonenumber-js
 * Specially tuned for Nepal (+977) and international dealer numbers
 */

import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

// Map of Devanagari digits ०-९ to Western Arabic 0-9
const DEVANAGARI_DIGITS_MAP: Record<string, string> = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
};

/**
 * Converts Devanagari numerals (०१२३४५६७८९) into standard 0-9 digits
 */
export function convertDevanagariToAscii(input: string): string {
  if (!input) return '';
  return input.replace(/[०-९]/g, (match) => DEVANAGARI_DIGITS_MAP[match] || match);
}

/**
 * Normalises a raw Excel cell value which might be a number, float, or scientific notation string
 * e.g. 9.841234567e9 -> "9841234567"
 */
export function parseRawCellValueToString(val: unknown): string {
  if (val === null || val === undefined) return '';

  if (typeof val === 'number') {
    // Check if it's an integer or scientific notation
    if (!Number.isFinite(val)) return '';
    // Format full integer digits without scientific notation
    return BigInt(Math.round(val)).toString();
  }

  const str = String(val).trim();
  // Check if string contains scientific notation like 9.84E+9 or 9.84e9
  if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(str)) {
    const num = Number(str);
    if (!Number.isNaN(num) && Number.isFinite(num)) {
      return BigInt(Math.round(num)).toString();
    }
  }

  return str;
}

/**
 * Splits multiple phone numbers found in a single cell
 * e.g. "9841234567 / 9851234567" or "9841234567, 9851234567"
 * Returns the first candidate and a warning if multiple were found
 */
export function extractFirstPhoneNumber(raw: string): { first: string; warning?: string } {
  const converted = convertDevanagariToAscii(raw.trim());

  // Split on comma, slash, semicolon, pipe, or the word 'or' / '&'
  const parts = converted
    .split(/[,;/|&]|\s+or\s+|\s+and\s+/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length > 1) {
    return {
      first: parts[0],
      warning: `Multiple numbers in cell (${parts.length}). Used first: "${parts[0]}"`,
    };
  }

  return { first: parts[0] || '' };
}

export interface PhoneValidationResult {
  isValid: boolean;
  normalizedDigits: string; // international digits only, e.g. "9779841234567"
  formattedDisplay: string; // readable e.g. "+977 9841 234567"
  countryCode: string;
  isMobile: boolean;
  warning?: string;
  errorReason?: string;
}

/**
 * Normalises and validates a phone number string according to the selected default country
 */
export function normalizePhoneNumber(
  rawInput: unknown,
  defaultCountry: string = 'NP'
): PhoneValidationResult {
  const rawString = parseRawCellValueToString(rawInput);
  if (!rawString.trim()) {
    return {
      isValid: false,
      normalizedDigits: '',
      formattedDisplay: '',
      countryCode: defaultCountry,
      isMobile: false,
      errorReason: 'Missing phone number',
    };
  }

  const { first: candidate, warning: multiWarning } = extractFirstPhoneNumber(rawString);

  // Check for invalid alphabetic characters
  if (/[a-zA-Z]/.test(candidate)) {
    return {
      isValid: false,
      normalizedDigits: '',
      formattedDisplay: candidate,
      countryCode: defaultCountry,
      isMobile: false,
      warning: multiWarning,
      errorReason: 'Contains letters instead of digits',
    };
  }

  // Pre-clean spaces, hyphens, parentheses, dots
  let cleaned = candidate.replace(/[\s\-().]/g, '');

  // Handle leading "00" international prefix: replace with "+"
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Try parsing with libphonenumber-js
  const country = (defaultCountry.toUpperCase() || 'NP') as CountryCode;
  const parsed = parsePhoneNumberFromString(cleaned, country);

  const digitCount = cleaned.replace(/\D/g, '').length;

  if (!parsed) {
    if (digitCount < 7) {
      return {
        isValid: false,
        normalizedDigits: '',
        formattedDisplay: candidate,
        countryCode: defaultCountry,
        isMobile: false,
        warning: multiWarning,
        errorReason: `Number too short (${digitCount} digits)`,
      };
    }

    return {
      isValid: false,
      normalizedDigits: '',
      formattedDisplay: candidate,
      countryCode: defaultCountry,
      isMobile: false,
      warning: multiWarning,
      errorReason: 'Invalid phone number format',
    };
  }

  // Check validity
  const isValid = parsed.isValid();
  if (!isValid) {
    if (digitCount < 7) {
      return {
        isValid: false,
        normalizedDigits: '',
        formattedDisplay: candidate,
        countryCode: parsed.country || defaultCountry,
        isMobile: false,
        warning: multiWarning,
        errorReason: `Number too short (${digitCount} digits)`,
      };
    }

    const isPossible = parsed.isPossible();
    return {
      isValid: false,
      normalizedDigits: '',
      formattedDisplay: parsed.formatInternational() || candidate,
      countryCode: parsed.country || defaultCountry,
      isMobile: false,
      warning: multiWarning,
      errorReason: isPossible ? 'Unrecognised phone number prefix or length' : 'Invalid phone number',
    };
  }

  // International digits only (no +, no spaces)
  // e.g. parsed.number is "+9779841234567" -> "9779841234567"
  const normalizedDigits = parsed.number.replace(/^\+/, '');
  const formattedDisplay = parsed.formatInternational();
  const phoneType = parsed.getType();

  // Mobile check: in Nepal, mobiles start with 98 or 97
  const isNepal = parsed.country === 'NP' || (!parsed.country && defaultCountry === 'NP');
  const nationalDigits = parsed.nationalNumber || '';
  const isNepalLandline = isNepal && !nationalDigits.startsWith('98') && !nationalDigits.startsWith('97');

  const isMobile =
    !isNepalLandline &&
    (phoneType === 'MOBILE' || phoneType === 'FIXED_LINE_OR_MOBILE' || !phoneType);

  let typeWarning: string | undefined = undefined;
  if (phoneType === 'FIXED_LINE' || isNepalLandline) {
    typeWarning = 'Landline / fixed line (may not have WhatsApp)';
  }

  const combinedWarning = [multiWarning, typeWarning].filter(Boolean).join('; ') || undefined;

  return {
    isValid: true,
    normalizedDigits,
    formattedDisplay,
    countryCode: parsed.country || defaultCountry,
    isMobile,
    warning: combinedWarning,
  };
}

export const SUPPORTED_COUNTRIES: { code: string; name: string; prefix: string }[] = [
  { code: 'NP', name: 'Nepal (+977)', prefix: '+977' },
  { code: 'IN', name: 'India (+91)', prefix: '+91' },
  { code: 'BD', name: 'Bangladesh (+880)', prefix: '+880' },
  { code: 'BT', name: 'Bhutan (+975)', prefix: '+975' },
  { code: 'AE', name: 'United Arab Emirates (+971)', prefix: '+971' },
  { code: 'US', name: 'United States (+1)', prefix: '+1' },
  { code: 'GB', name: 'United Kingdom (+44)', prefix: '+44' },
];
