/**
 * Campaign Report View
 * Computes audit summary, exports to Excel/CSV with formula injection protection,
 * and handles secure memory wipe with pre-download warnings.
 */

import React, { useState } from 'react';
import {
  DealerRow,
  ActiveView,
  CampaignConfig,
  CampaignImage,
} from '../types';
import {
  FileSpreadsheet,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowLeft,
  Search,
} from 'lucide-react';
import {
  computeReportSummary,
  exportReportToExcel,
  exportReportToCsv,
} from '../utils/export';

interface ReportViewProps {
  config: CampaignConfig;
  dealers: DealerRow[];
  image: CampaignImage | null;
  campaignStartedAt?: string;
  campaignFinishedAt?: string;
  onNavigate: (view: ActiveView) => void;
  onClearAllCampaignMemory: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  config,
  dealers,
  image,
  campaignStartedAt,
  campaignFinishedAt,
  onNavigate,
  onClearAllCampaignMemory,
}) => {
  const [hasDownloadedReport, setHasDownloadedReport] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSendStatus, setFilterSendStatus] = useState<string>('all');

  const summary = computeReportSummary(dealers, campaignStartedAt, campaignFinishedAt);

  const handleExportExcel = () => {
    exportReportToExcel(config.campaignName || 'Troika_Campaign', dealers, summary);
    setHasDownloadedReport(true);
  };

  const handleExportCsv = () => {
    exportReportToCsv(config.campaignName || 'Troika_Campaign', dealers);
    setHasDownloadedReport(true);
  };

  // Filter contacts table
  const filteredDealers = dealers.filter((d) => {
    if (filterSendStatus === 'sent' && d.sendRecord.status !== 'sent') return false;
    if (filterSendStatus === 'skipped' && d.sendRecord.status !== 'skipped') return false;
    if (filterSendStatus === 'pending' && d.sendRecord.status !== 'pending') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (d.cleanName || '').toLowerCase().includes(q);
      const matchPhone = (d.rawPhone || '').includes(q) || (d.normalizedPhone || '').includes(q);
      return matchName || matchPhone;
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#C9A24B]">
            Troika Campaign Audit
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Campaign Dispatch Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            {config.campaignName || 'Troika WhatsApp Promotional Campaign'} · Summary and dealer log
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('desk')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Send Desk
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirmModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Campaign &amp; Image Memory
          </button>
        </div>
      </div>

      {/* Mandatory Prominent Audit Disclaimer */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-3">
        <Clock className="w-5 h-5 text-[#0B1F3A] shrink-0" />
        <div>
          <span className="font-bold text-slate-900">
            Audit Notice: Marked as sent by user. Not independently verified by WhatsApp.
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Because this tool operates with zero external APIs and no Selenium automation, message statuses reflect the explicit manual confirmations of the Troika operator.
          </p>
        </div>
      </div>

      {/* High-Level Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Dealers
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {summary.totalContacts}
          </p>
          <span className="text-[10px] text-slate-400">in imported file</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Selected
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {summary.totalSelected}
          </p>
          <span className="text-[10px] text-slate-400">valid campaign targets</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Marked Sent
          </span>
          <p className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
            {summary.markedSent}
          </p>
          <span className="text-[10px] text-emerald-600">dispatched by operator</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Skipped
          </span>
          <p className="text-2xl font-bold text-amber-700 mt-1 font-mono">
            {summary.skipped}
          </p>
          <span className="text-[10px] text-amber-600">bypassed by user</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Completion Rate
          </span>
          <p className="text-2xl font-bold text-[#0B1F3A] mt-1 font-mono">
            {summary.completionRatePercent}%
          </p>
          <span className="text-[10px] text-slate-400">of selected dealers</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Duration
          </span>
          <p className="text-lg font-bold text-slate-900 mt-1 font-mono truncate">
            {summary.durationFormatted}
          </p>
          <span className="text-[10px] text-slate-400">active desk time</span>
        </div>
      </div>

      {/* Export Actions Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Export Official Audit Reports
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Includes dealer name, phone number, dispatch timestamps, and formula injection protection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export to Excel (.xlsx)
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            <FileText className="w-4 h-4" />
            Export to CSV (.csv)
          </button>
        </div>
      </div>

      {/* Detailed Dealers Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-xs">Filter by Status:</span>
            <button
              type="button"
              onClick={() => setFilterSendStatus('all')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                filterSendStatus === 'all'
                  ? 'bg-[#0B1F3A] text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({dealers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSendStatus('sent')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                filterSendStatus === 'sent'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Sent ({summary.markedSent})
            </button>
            <button
              type="button"
              onClick={() => setFilterSendStatus('skipped')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                filterSendStatus === 'skipped'
                  ? 'bg-amber-700 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Skipped ({summary.skipped})
            </button>
            <button
              type="button"
              onClick={() => setFilterSendStatus('pending')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                filterSendStatus === 'pending'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pending ({summary.pending})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search dealer log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-[#0B1F3A]"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 select-none">
              <tr>
                <th className="py-2.5 px-3 w-12 text-slate-500">Row</th>
                <th className="py-2.5 px-3">Dealer Name</th>
                <th className="py-2.5 px-3">Phone in File</th>
                <th className="py-2.5 px-3">WhatsApp Number</th>
                <th className="py-2.5 px-3">Send Status</th>
                <th className="py-2.5 px-3">Time Marked</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredDealers.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 font-mono text-slate-400">#{d.rawIndex}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{d.cleanName}</td>
                  <td className="py-2 px-3 font-mono text-slate-600">{d.rawPhone || '—'}</td>
                  <td className="py-2 px-3 font-mono font-medium">
                    {d.normalizedPhone ? `+${d.normalizedPhone}` : '—'}
                  </td>
                  <td className="py-2 px-3">
                    {d.sendRecord.status === 'sent' && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                      </span>
                    )}
                    {d.sendRecord.status === 'skipped' && (
                      <span className="text-amber-700 font-semibold">Skipped</span>
                    )}
                    {d.sendRecord.status === 'opened' && (
                      <span className="text-blue-700 font-medium">Opened (Unconfirmed)</span>
                    )}
                    {d.sendRecord.status === 'pending' && (
                      <span className="text-slate-400">Pending</span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-500">
                    {d.sendRecord.sentAt || d.sendRecord.skippedAt || d.sendRecord.openedAt || '—'}
                  </td>
                  <td className="py-2 px-3 text-[11px] text-slate-500">
                    {d.warning || d.errorReason || (d.status === 'duplicate' ? `Duplicate of #${d.duplicateOfIndex}` : '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear Memory Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Clear All Campaign Data &amp; Image?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will immediately revoke image object URLs and permanently drop all dealer lists, phone numbers, and statuses from browser memory.
              </p>

              {!hasDownloadedReport && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 text-left flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Warning:</strong> You have not downloaded your Excel or CSV report yet. Once cleared, this data cannot be recovered.
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowClearConfirmModal(false);
                  onClearAllCampaignMemory();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors shadow-xs"
              >
                Yes, Wipe Memory Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
