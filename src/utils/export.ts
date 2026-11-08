/**
 * Campaign report generation and spreadsheet formula injection sanitization
 */

import * as XLSX from 'xlsx';
import { DealerRow } from '../types';

/**
 * Sanitizes a string against spreadsheet formula injection (CSV/Excel injection)
 * Any string starting with =, +, -, @, or tab is prefixed with a single quote '
 */
export function sanitizeFormulaInjection(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r\n]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export interface ReportSummary {
  totalContacts: number;
  totalSelected: number;
  markedSent: number;
  skipped: number;
  invalid: number;
  pending: number;
  completionRatePercent: number;
  startedAt?: string;
  finishedAt?: string;
  durationFormatted: string;
}

export function computeReportSummary(
  dealers: DealerRow[],
  startedAt?: string,
  finishedAt?: string
): ReportSummary {
  const totalContacts = dealers.length;
  const selectedDealers = dealers.filter((d) => d.selected);
  const totalSelected = selectedDealers.length;

  let markedSent = 0;
  let skipped = 0;
  let pending = 0;

  for (const dealer of selectedDealers) {
    const s = dealer.sendRecord.status;
    if (s === 'sent') markedSent++;
    else if (s === 'skipped') skipped++;
    else pending++;
  }

  const invalid = dealers.filter((d) => d.status === 'invalid' || d.status === 'missing_number').length;

  const completed = markedSent + skipped;
  const completionRatePercent = totalSelected > 0 ? Math.round((completed / totalSelected) * 100) : 0;

  let durationFormatted = 'N/A';
  if (startedAt) {
    const start = new Date(startedAt).getTime();
    const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
    const diffSec = Math.max(0, Math.floor((end - start) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    durationFormatted = `${mins}m ${secs}s`;
  }

  return {
    totalContacts,
    totalSelected,
    markedSent,
    skipped,
    invalid,
    pending,
    completionRatePercent,
    startedAt,
    finishedAt,
    durationFormatted,
  };
}

/**
 * Exports campaign report to an Excel .xlsx workbook
 */
export function exportReportToExcel(
  campaignName: string,
  dealers: DealerRow[],
  summary: ReportSummary
): void {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryRows = [
    ['Troika WhatsApp Sender - Campaign Report'],
    ['Campaign Name', sanitizeFormulaInjection(campaignName || 'Troika Campaign')],
    ['Disclaimer', 'Marked as sent by user. Not independently verified by WhatsApp.'],
    ['Exported At', new Date().toLocaleString()],
    [''],
    ['Metric', 'Value'],
    ['Total Dealers in File', summary.totalContacts],
    ['Total Selected for Campaign', summary.totalSelected],
    ['Marked as Sent by User', summary.markedSent],
    ['Skipped by User', summary.skipped],
    ['Remaining / Pending', summary.pending],
    ['Invalid / Missing Numbers', summary.invalid],
    ['Completion Rate', `${summary.completionRatePercent}%`],
    ['Started At', summary.startedAt || 'N/A'],
    ['Finished At', summary.finishedAt || 'In Progress / Not Marked Finished'],
    ['Campaign Duration', summary.durationFormatted],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Detailed contact rows
  const detailHeaders = [
    'Original Row',
    'Dealer Name',
    'Phone in File',
    'Normalized WhatsApp Number',
    'Country',
    'File Status',
    'Send Status',
    'Time Marked',
    'Notes / Warnings',
  ];

  const detailRows = dealers.map((d) => [
    d.rawIndex,
    sanitizeFormulaInjection(d.rawName || d.cleanName),
    sanitizeFormulaInjection(d.rawPhone),
    sanitizeFormulaInjection(d.normalizedPhone ? `+${d.normalizedPhone}` : ''),
    sanitizeFormulaInjection(d.countryCode),
    sanitizeFormulaInjection(d.status),
    sanitizeFormulaInjection(d.sendRecord.status),
    sanitizeFormulaInjection(
      d.sendRecord.sentAt || d.sendRecord.skippedAt || d.sendRecord.openedAt || ''
    ),
    sanitizeFormulaInjection(d.warning || d.errorReason || ''),
  ]);

  const detailWs = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
  XLSX.utils.book_append_sheet(wb, detailWs, 'Dealer Log');

  const safeFilename = (campaignName || 'Troika_Campaign')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  XLSX.writeFile(wb, `${safeFilename}_Report.xlsx`);
}

/**
 * Exports campaign report to CSV format with formula injection sanitization
 */
export function exportReportToCsv(
  campaignName: string,
  dealers: DealerRow[]
): void {
  const headers = [
    'Original Row',
    'Dealer Name',
    'Phone in File',
    'WhatsApp Number',
    'Send Status',
    'Time Marked',
    'Notes',
  ];

  const rows = dealers.map((d) => [
    d.rawIndex,
    `"${sanitizeFormulaInjection(d.rawName || d.cleanName).replace(/"/g, '""')}"`,
    `"${sanitizeFormulaInjection(d.rawPhone).replace(/"/g, '""')}"`,
    `"${sanitizeFormulaInjection(d.normalizedPhone ? `+${d.normalizedPhone}` : '').replace(/"/g, '""')}"`,
    `"${sanitizeFormulaInjection(d.sendRecord.status).replace(/"/g, '""')}"`,
    `"${sanitizeFormulaInjection(d.sendRecord.sentAt || d.sendRecord.skippedAt || '').replace(/"/g, '""')}"`,
    `"${sanitizeFormulaInjection(d.warning || d.errorReason || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeFilename = (campaignName || 'Troika_Campaign')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);
  link.setAttribute('download', `${safeFilename}_Report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
