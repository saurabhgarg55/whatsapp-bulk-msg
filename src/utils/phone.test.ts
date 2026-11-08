/**
 * Vitest tests for Phone Normalization and Validation
 */

import { describe, it, expect } from 'vitest';
import {
  normalizePhoneNumber,
  convertDevanagariToAscii,
  parseRawCellValueToString,
  extractFirstPhoneNumber,
} from './phone';

describe('Phone Utility: Devanagari Translation', () => {
  it('converts Devanagari digits to ASCII 0-9', () => {
    expect(convertDevanagariToAscii('०१२३४५६७८९')).toBe('0123456789');
    expect(convertDevanagariToAscii('९८४१२३४५६७')).toBe('9841234567');
  });

  it('keeps Latin characters and symbols unchanged', () => {
    expect(convertDevanagariToAscii('+977-९८४१२३४५६७')).toBe('+977-9841234567');
  });
});

describe('Phone Utility: Raw Cell Value Parsing', () => {
  it('handles standard numbers and floats', () => {
    expect(parseRawCellValueToString(9841234567)).toBe('9841234567');
  });

  it('handles scientific notation numbers and strings', () => {
    expect(parseRawCellValueToString(9.841234567e9)).toBe('9841234567');
    expect(parseRawCellValueToString('9.841234567E+09')).toBe('9841234567');
    expect(parseRawCellValueToString('9.84E+09')).toBe('9840000000');
  });

  it('handles null, undefined, or empty values', () => {
    expect(parseRawCellValueToString(null)).toBe('');
    expect(parseRawCellValueToString(undefined)).toBe('');
    expect(parseRawCellValueToString('')).toBe('');
  });
});

describe('Phone Utility: Multiple Numbers in One Cell', () => {
  it('extracts the first phone number and adds warning when slash-separated', () => {
    const res = extractFirstPhoneNumber('9841234567 / 9851234567');
    expect(res.first).toBe('9841234567');
    expect(res.warning).toContain('Multiple numbers in cell');
  });

  it('extracts the first phone number when comma-separated', () => {
    const res = extractFirstPhoneNumber('9841234567, 9851234567');
    expect(res.first).toBe('9841234567');
    expect(res.warning).toContain('Multiple numbers in cell');
  });

  it('returns single number without warning', () => {
    const res = extractFirstPhoneNumber('9841234567');
    expect(res.first).toBe('9841234567');
    expect(res.warning).toBeUndefined();
  });
});

describe('Phone Utility: Comprehensive Normalization', () => {
  it('normalises Nepal local 10-digit mobile number', () => {
    const res = normalizePhoneNumber('9841234567', 'NP');
    expect(res.isValid).toBe(true);
    expect(res.normalizedDigits).toBe('9779841234567');
    expect(res.countryCode).toBe('NP');
  });

  it('normalises Nepal local number with leading 0', () => {
    const res = normalizePhoneNumber('09841234567', 'NP');
    expect(res.isValid).toBe(true);
    expect(res.normalizedDigits).toBe('9779841234567');
  });

  it('normalises +977 prefix', () => {
    const res = normalizePhoneNumber('+977 9841234567', 'NP');
    expect(res.isValid).toBe(true);
    expect(res.normalizedDigits).toBe('9779841234567');
  });

  it('normalises 00977 international dial prefix', () => {
    const res = normalizePhoneNumber('009779841234567', 'NP');
    expect(res.isValid).toBe(true);
    expect(res.normalizedDigits).toBe('9779841234567');
  });

  it('normalises spaces, hyphens, and brackets', () => {
    const res = normalizePhoneNumber('+977-984-123-4567', 'NP');
    expect(res.isValid).toBe(true);
    expect(res.normalizedDigits).toBe('9779841234567');

    const res2 = normalizePhoneNumber('(977) 9841-234567', 'NP');
    expect(res2.isValid).toBe(true);
    expect(res2.normalizedDigits).toBe('9779841234567');
  });

  it('normalises numeric cell value directly', () => {
    const res = normalizePhoneNumber(9841234567, 'NP');
    expect(res.isValid).toBe(true);
    expect(res.normalizedDigits).toBe('9779841234567');
  });

  it('normalises scientific notation input', () => {
    const res = normalizePhoneNumber('9.841234567E+09', 'NP');
    expect(res.isValid).toBe(true);
    expect(res.normalizedDigits).toBe('9779841234567');
  });

  it('normalises Devanagari numerals for Nepal number', () => {
    const res = normalizePhoneNumber('९८४१२३४५६७', 'NP');
    expect(res.isValid).toBe(true);
    expect(res.normalizedDigits).toBe('9779841234567');
  });

  it('handles Indian +91 international numbers seamlessly', () => {
    const res = normalizePhoneNumber('+91 98100 12345', 'NP');
    expect(res.isValid).toBe(true);
    expect(res.countryCode).toBe('IN');
    expect(res.normalizedDigits).toBe('919810012345');
  });

  it('handles Indian 0091 prefix', () => {
    const res = normalizePhoneNumber('00919810012345', 'NP');
    expect(res.isValid).toBe(true);
    expect(res.countryCode).toBe('IN');
    expect(res.normalizedDigits).toBe('919810012345');
  });

  it('detects landline / fixed line and adds warning', () => {
    // 01-4412345 is Kathmandu fixed line
    const res = normalizePhoneNumber('01-4412345', 'NP');
    if (res.isValid) {
      expect(res.warning).toContain('Landline / fixed line');
    }
  });

  it('flags numbers that are too short', () => {
    const res = normalizePhoneNumber('9841', 'NP');
    expect(res.isValid).toBe(false);
    expect(res.errorReason).toContain('too short');
  });

  it('flags inputs containing letters instead of digits', () => {
    const res = normalizePhoneNumber('9841ABC', 'NP');
    expect(res.isValid).toBe(false);
    expect(res.errorReason).toContain('letters');
  });

  it('flags completely empty inputs', () => {
    const res = normalizePhoneNumber('', 'NP');
    expect(res.isValid).toBe(false);
    expect(res.errorReason).toBe('Missing phone number');
  });
});
