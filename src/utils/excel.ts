/**
 * Excel and CSV file processor using SheetJS
 * Auto-detects header row, sheet selection, column mapping, and duplicate detection
 */

import * as XLSX from 'xlsx';
import { DealerRow } from '../types';
import { normalizePhoneNumber, parseRawCellValueToString } from './phone';

export interface ParsedWorkbook {
  sheetNames: string[];
  activeSheet: string;
  rows: unknown[][];
}

export interface ColumnMapping {
  nameColumnIndex: number;
  phoneColumnIndex: number;
  headerRowIndex: number;
}

const NAME_SYNONYMS = [
  'name',
  'dealer',
  'dealer name',
  'dealer_name',
  'party',
  'party name',
  'party_name',
  'customer',
  'customer name',
  'firm',
  'firm name',
  'shop',
  'shop name',
  'client',
  'client name',
  'contact name',
  'person',
  'account',
  'company',
];

const PHONE_SYNONYMS = [
  'mobile',
  'phone',
  'whatsapp',
  'wa',
  'contact',
  'contact no',
  'contact number',
  'mobile no',
  'mobile number',
  'phone no',
  'phone number',
  'cell',
  'cell no',
  'cell phone',
  'tel',
  'number',
];

/**
 * Reads an uploaded file as ArrayBuffer and parses it with SheetJS
 */
export async function readExcelOrCsvFile(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer();

  // read with cellDates: false, raw: true to preserve values accurately
  // codepage 65001 handles UTF-8 BOM properly
  const workbook = XLSX.read(buffer, {
    type: 'array',
    raw: true,
    codepage: 65001,
  });

  const sheetNames = workbook.SheetNames;
  const firstSheetName = sheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: unknown[][] = worksheet
    ? XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
    : [];

  return {
    sheetNames,
    activeSheet: firstSheetName,
    rows,
  };
}

/**
 * Extracts rows from a specific sheet in a loaded workbook
 */
export function getRowsFromSheet(fileBuffer: ArrayBuffer, sheetName: string): unknown[][] {
  const workbook = XLSX.read(fileBuffer, { type: 'array', raw: true, codepage: 65001 });
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];
  return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
}

/**
 * Scans the first 10 rows to detect the header row and best candidate columns
 */
export function detectHeaderAndColumns(rows: unknown[][]): {
  headerRowIndex: number;
  nameColIndex: number;
  phoneColIndex: number;
  headers: string[];
} {
  const maxScan = Math.min(10, rows.length);
  let bestHeaderIndex = 0;
  let bestScore = -1;
  let detectedNameCol = -1;
  let detectedPhoneCol = -1;

  for (let r = 0; r < maxScan; r++) {
    const row = rows[r] || [];
    let nameIdx = -1;
    let phoneIdx = -1;
    let score = 0;

    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || '').trim().toLowerCase();
      if (!cellVal) continue;

      // Exact or partial match for name
      if (nameIdx === -1 && NAME_SYNONYMS.some((syn) => cellVal === syn || cellVal.includes(syn))) {
        nameIdx = c;
        score += 2;
      }
      // Exact or partial match for phone
      if (phoneIdx === -1 && PHONE_SYNONYMS.some((syn) => cellVal === syn || cellVal.includes(syn))) {
        phoneIdx = c;
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestHeaderIndex = r;
      detectedNameCol = nameIdx;
      detectedPhoneCol = phoneIdx;
    }
  }

  // If score was 0 (no matching headers found), fallback to row 0
  const headerRow = (rows[bestHeaderIndex] || []) as unknown[];
  const headers = headerRow.map((h, i) => (h ? String(h).trim() : `Column ${i + 1}`));

  // Fallback defaults if still not found
  if (detectedNameCol === -1 && headers.length > 0) {
    detectedNameCol = 0;
  }
  if (detectedPhoneCol === -1 && headers.length > 1) {
    detectedPhoneCol = 1;
  } else if (detectedPhoneCol === -1 && headers.length > 0) {
    detectedPhoneCol = 0;
  }

  return {
    headerRowIndex: bestHeaderIndex,
    nameColIndex: detectedNameCol,
    phoneColIndex: detectedPhoneCol,
    headers,
  };
}

/**
 * Processes rows from the workbook into DealerRow objects
 */
export function processDealerRows(
  rows: unknown[][],
  headerRowIndex: number,
  nameColIndex: number,
  phoneColIndex: number,
  defaultCountry: string = 'NP'
): DealerRow[] {
  const result: DealerRow[] = [];
  const seenPhones = new Map<string, number>(); // normalizedPhone -> rawIndex

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawNameVal = row[nameColIndex];
    const rawPhoneVal = row[phoneColIndex];

    const rawName = parseRawCellValueToString(rawNameVal).trim();
    const rawPhone = parseRawCellValueToString(rawPhoneVal).trim();

    // Skip entirely empty row
    if (!rawName && !rawPhone) continue;

    const rawIndex = i + 1; // 1-based row number in sheet
    const validation = normalizePhoneNumber(rawPhone, defaultCountry);

    let status: DealerRow['status'] = 'valid';
    let duplicateOfIndex: number | undefined = undefined;
    let errorReason: string | undefined = undefined;

    if (!rawPhone) {
      status = 'missing_number';
      errorReason = 'Missing phone number';
    } else if (!validation.isValid) {
      status = 'invalid';
      errorReason = validation.errorReason || 'Invalid phone format';
    } else {
      // Check duplicate
      const norm = validation.normalizedDigits;
      if (seenPhones.has(norm)) {
        status = 'duplicate';
        duplicateOfIndex = seenPhones.get(norm);
      } else {
        seenPhones.set(norm, rawIndex);
      }
    }

    // By default: select valid rows; do NOT select duplicates, invalids, or missing numbers
    const selected = status === 'valid';

    result.push({
      id: `dealer-${rawIndex}-${Math.random().toString(36).slice(2, 7)}`,
      rawIndex,
      rawName,
      rawPhone,
      cleanName: rawName || 'Sir/Madam',
      normalizedPhone: validation.normalizedDigits,
      formattedDisplayPhone: validation.formattedDisplay || rawPhone,
      countryCode: validation.countryCode,
      status,
      warning: validation.warning,
      errorReason,
      duplicateOfIndex,
      selected,
      sendRecord: {
        status: 'pending',
      },
    });
  }

  return result;
}

/**
 * Generates and triggers download of a realistic sample Excel file
 */
export function generateSampleExcelFile(): void {
  const sampleData = [
    ['Dealer Name', 'Mobile Number', 'City / Region', 'Notes'],
    ['SAMPLE - Annapurna Sanitary & Hardware', '9841234567', 'Kathmandu', 'Regular tier-1 dealer'],
    ['SAMPLE - Pokhara Bath Concepts', '09856012345', 'Pokhara', 'Leading 0 test'],
    ['SAMPLE - Himalayan Luxury Ceramics', '9.84199E+09', 'Lalitpur', 'Excel scientific notation test'],
    ['SAMPLE - Biratnagar Bathware', '९८५२०३४५६७', 'Biratnagar', 'Devanagari numerals test'],
    ['SAMPLE - Lumbini Tiles & Bath', '+977-984-7012345', 'Bhairahawa', 'Hyphens & plus prefix'],
    ['SAMPLE - Everest Traders', '9841234567', 'Kathmandu', 'Intentional duplicate of row 2'],
    ['SAMPLE - Janakpur Hardware Hub', '9801234567 / 9841000000', 'Janakpur', 'Dual number in cell test'],
    ['SAMPLE - Delhi Export Partner', '+91 98100 12345', 'New Delhi', 'India +91 international test'],
    ['SAMPLE - Butwal Sanitary Point', '01-4412345', 'Kathmandu', 'Landline / fixed line warning test'],
    ['SAMPLE - Incomplete Records Store', '', 'Hetauda', 'Missing number test'],
    ['SAMPLE - Invalid Digits Firm', '9841ABC', 'Dharan', 'Invalid letters test'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dealers');

  XLSX.writeFile(wb, 'Troika_Sample_Dealers_Template.xlsx');
}
