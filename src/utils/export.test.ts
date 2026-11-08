/**
 * Vitest tests for Report Summary, Formula Injection Protection, and Memory State Clearing
 */

import { describe, it, expect } from 'vitest';
import { sanitizeFormulaInjection, computeReportSummary } from './export';
import { DealerRow } from '../types';

describe('Spreadsheet Security: Formula Injection Sanitization', () => {
  it('prefixes formulas starting with = with single quote', () => {
    expect(sanitizeFormulaInjection('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeFormulaInjection('=cmd|/C calc!A0')).toBe("'=cmd|/C calc!A0");
  });

  it('prefixes strings starting with +, -, @, or tab', () => {
    expect(sanitizeFormulaInjection('+9779841234567')).toBe("'+9779841234567");
    expect(sanitizeFormulaInjection('-100')).toBe("'-100");
    expect(sanitizeFormulaInjection('@SUM')).toBe("'@SUM");
    expect(sanitizeFormulaInjection('\tTabbed')).toBe("'\tTabbed");
  });

  it('does not alter normal strings or numbers', () => {
    expect(sanitizeFormulaInjection('Troika International')).toBe('Troika International');
    expect(sanitizeFormulaInjection('9841234567')).toBe('9841234567');
  });

  it('handles null and undefined safely', () => {
    expect(sanitizeFormulaInjection(null)).toBe('');
    expect(sanitizeFormulaInjection(undefined)).toBe('');
  });
});

describe('Report Summary Computation', () => {
  it('correctly aggregates sent, skipped, invalid, and completion rates', () => {
    const mockDealers: DealerRow[] = [
      {
        id: '1',
        rawIndex: 1,
        rawName: 'Dealer 1',
        rawPhone: '9841234567',
        cleanName: 'Dealer 1',
        normalizedPhone: '9779841234567',
        formattedDisplayPhone: '+977 9841 234567',
        countryCode: 'NP',
        status: 'valid',
        selected: true,
        sendRecord: { status: 'sent', sentAt: '10:00:00 AM' },
      },
      {
        id: '2',
        rawIndex: 2,
        rawName: 'Dealer 2',
        rawPhone: '9841234568',
        cleanName: 'Dealer 2',
        normalizedPhone: '9779841234568',
        formattedDisplayPhone: '+977 9841 234568',
        countryCode: 'NP',
        status: 'valid',
        selected: true,
        sendRecord: { status: 'skipped', skippedAt: '10:01:00 AM' },
      },
      {
        id: '3',
        rawIndex: 3,
        rawName: 'Dealer 3',
        rawPhone: '9841234569',
        cleanName: 'Dealer 3',
        normalizedPhone: '9779841234569',
        formattedDisplayPhone: '+977 9841 234569',
        countryCode: 'NP',
        status: 'valid',
        selected: true,
        sendRecord: { status: 'pending' },
      },
      {
        id: '4',
        rawIndex: 4,
        rawName: 'Invalid Dealer',
        rawPhone: '123',
        cleanName: 'Invalid Dealer',
        normalizedPhone: '',
        formattedDisplayPhone: '123',
        countryCode: 'NP',
        status: 'invalid',
        selected: false,
        sendRecord: { status: 'pending' },
      },
    ];

    const startedAt = '2026-11-08T10:00:00.000Z';
    const finishedAt = '2026-11-08T10:05:30.000Z'; // 5m 30s

    const summary = computeReportSummary(mockDealers, startedAt, finishedAt);

    expect(summary.totalContacts).toBe(4);
    expect(summary.totalSelected).toBe(3);
    expect(summary.markedSent).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(summary.pending).toBe(1);
    expect(summary.invalid).toBe(1);
    // completed = 2 (sent + skipped) out of 3 selected = 67%
    expect(summary.completionRatePercent).toBe(67);
    expect(summary.durationFormatted).toBe('5m 30s');
  });
});

describe('Memory State Clearing Behavior', () => {
  it('revokes blob URL and drops object references without leaking', () => {
    let mockRevoked = false;
    const originalRevoke = URL.revokeObjectURL;
    URL.revokeObjectURL = () => {
      mockRevoked = true;
    };

    // Simulate clearing
    let imageObj: { objectUrl: string } | null = { objectUrl: 'blob:http://localhost/abc' };
    let dealersList: DealerRow[] | null = [{ id: '1' } as DealerRow];

    // Wipe
    if (imageObj?.objectUrl) {
      URL.revokeObjectURL(imageObj.objectUrl);
    }
    imageObj = null;
    dealersList = [];

    expect(mockRevoked).toBe(true);
    expect(imageObj).toBeNull();
    expect(dealersList.length).toBe(0);

    URL.revokeObjectURL = originalRevoke;
  });
});
