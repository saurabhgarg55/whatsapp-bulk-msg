/**
 * Vitest tests for Excel/CSV processing and duplicate detection
 */

import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  detectHeaderAndColumns,
  processDealerRows,
} from './excel';

describe('Excel/CSV: Header Detection', () => {
  it('detects header row when header is in row 1', () => {
    const rows = [
      ['Dealer Name', 'Mobile Number', 'City'],
      ['Annapurna Tiles', '9841234567', 'Kathmandu'],
    ];

    const detected = detectHeaderAndColumns(rows);
    expect(detected.headerRowIndex).toBe(0);
    expect(detected.nameColIndex).toBe(0);
    expect(detected.phoneColIndex).toBe(1);
  });

  it('detects header row when header is NOT in row 1 (e.g. title in row 1 and empty row 2)', () => {
    const rows = [
      ['Troika International Dealer Directory 2026', '', ''],
      ['', '', ''],
      ['Party Name', 'Contact No', 'Location'],
      ['Kathmandu Ceramics', '9851234567', 'Kathmandu'],
    ];

    const detected = detectHeaderAndColumns(rows);
    expect(detected.headerRowIndex).toBe(2);
    expect(detected.nameColIndex).toBe(0);
    expect(detected.phoneColIndex).toBe(1);
  });

  it('detects synonym column headers (firm, shop, customer, whatsapp, cell)', () => {
    const rows = [
      ['S.N.', 'Firm', 'Address', 'WhatsApp'],
      [1, 'Pokhara Bath', 'Pokhara', '9846012345'],
    ];

    const detected = detectHeaderAndColumns(rows);
    expect(detected.headerRowIndex).toBe(0);
    expect(detected.nameColIndex).toBe(1);
    expect(detected.phoneColIndex).toBe(3);
  });
});

describe('Excel/CSV: Duplicate Detection and Row Processing', () => {
  it('identifies duplicates based on normalized phone numbers', () => {
    const rows = [
      ['Dealer Name', 'Mobile Number'],
      ['Dealer A', '9841234567'],
      ['Dealer B', '9851234567'],
      ['Dealer A Duplicate', '+977-984-123-4567'], // Same normalized number as Dealer A
    ];

    const dealers = processDealerRows(rows, 0, 0, 1, 'NP');
    expect(dealers.length).toBe(3);

    // Dealer A should be valid and selected
    expect(dealers[0].status).toBe('valid');
    expect(dealers[0].selected).toBe(true);

    // Dealer B should be valid and selected
    expect(dealers[1].status).toBe('valid');
    expect(dealers[1].selected).toBe(true);

    // Dealer A Duplicate should be marked as duplicate of row 2 and NOT selected by default
    expect(dealers[2].status).toBe('duplicate');
    expect(dealers[2].duplicateOfIndex).toBe(2);
    expect(dealers[2].selected).toBe(false);
  });

  it('handles CSV with UTF-8 BOM and Devanagari text using SheetJS', () => {
    const csvContent =
      '\uFEFF' + // UTF-8 BOM
      'Dealer Name,Mobile Number,City\n' +
      'नेपाल बाथ सेन्टर,९८४१२३४५६७,काठमाडौँ\n' +
      'Annapurna Sanitary,9841999999,Pokhara\n';

    const wb = XLSX.read(csvContent, { type: 'string', raw: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    const detected = detectHeaderAndColumns(rows);
    const dealers = processDealerRows(rows, detected.headerRowIndex, detected.nameColIndex, detected.phoneColIndex, 'NP');

    expect(dealers.length).toBe(2);
    expect(dealers[0].cleanName).toBe('नेपाल बाथ सेन्टर');
    expect(dealers[0].normalizedPhone).toBe('9779841234567');
    expect(dealers[0].status).toBe('valid');
  });
});
