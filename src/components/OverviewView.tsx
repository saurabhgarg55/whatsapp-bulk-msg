/**
 * Overview dashboard view for Troika WhatsApp Sender
 */

import React from 'react';
import { ActiveView, DealerRow, CampaignImage } from '../types';
import {
  FileSpreadsheet,
  Send,
  Download,
  Shield,
  Smartphone,
  Sparkles,
  ArrowRight,
  Clock,
  Coffee,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { generateSampleExcelFile } from '../utils/excel';

interface OverviewViewProps {
  onNavigate: (view: ActiveView) => void;
  hasActiveCampaign: boolean;
  dealers: DealerRow[];
  image: CampaignImage | null;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenTestModal: () => void;
  onTriggerResumeFromFile: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  hasActiveCampaign,
  dealers,
  image,
  isDemoMode,
  onToggleDemoMode,
  onOpenTestModal,
  onTriggerResumeFromFile,
}) => {
  const selectedCount = dealers.filter((d) => d.selected).length;
  const sentCount = dealers.filter((d) => d.sendRecord.status === 'sent').length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden bg-[#0B1F3A] text-white rounded-2xl p-6 sm:p-8 shadow-md border border-[#0B1F3A]">
        {/* Subtle decorative gold glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#C9A24B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#C9A24B]">
              Troika International · Artful Passion
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            Assisted Dealer WhatsApp Promotional Desk
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            A private, browser-only tool for Troika staff to dispatch promotional bathware campaigns
            to existing dealers one-by-one. Operates entirely in your browser memory with zero
            tracking, automated clipboard image preparation, and safe human-paced sending.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {hasActiveCampaign ? (
              <button
                type="button"
                onClick={() => onNavigate('desk')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A24B] hover:bg-[#B68F37] text-white font-semibold text-sm rounded-xl transition-colors shadow-xs"
              >
                <Send className="w-4 h-4" />
                Resume Active Campaign ({sentCount}/{selectedCount} Sent)
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('new-campaign')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A24B] hover:bg-[#B68F37] text-white font-semibold text-sm rounded-xl transition-colors shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Start New Campaign
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onOpenTestModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-xl transition-colors border border-white/20"
            >
              <Smartphone className="w-4 h-4 text-[#C9A24B]" />
              Test With My Own Number
            </button>

            <button
              type="button"
              onClick={onTriggerResumeFromFile}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-xl transition-colors border border-white/20"
              title="Load a previously saved .json progress file"
            >
              <FolderOpen className="w-4 h-4 text-slate-300" />
              Resume from File
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Status or Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sample Excel Generator */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-4">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Download Sample Template</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Get an Excel file (.xlsx) preloaded with sample Nepal and international dealer rows,
              Devanagari numerals, scientific notations, and duplicates to test import detection.
            </p>
          </div>
          <button
            type="button"
            onClick={generateSampleExcelFile}
            className="w-full py-2 px-3 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Sample Excel (.xlsx)
          </button>
        </div>

        {/* Demo Mode Toggle */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">Demo Mode</h3>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isDemoMode ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isDemoMode ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              In Demo Mode, the &ldquo;Open Chat&rdquo; action displays the generated link text in a
              safe modal and does <strong className="text-slate-900">not</strong> open real WhatsApp,
              preventing accidental messages during staff training.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleDemoMode}
            className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              isDemoMode
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
            }`}
          >
            {isDemoMode ? 'Turn Off Demo Mode' : 'Enable Safe Demo Mode'}
          </button>
        </div>

        {/* Browser Memory Guarantee */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 flex items-center justify-center text-[#0B1F3A] mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Private Internal Architecture</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Zero server databases. Zero cloud sync. All dealer names, numbers, and catalog images
              remain strictly in browser memory and disappear when the tab closes or on Reset.
            </p>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>CSP `connect-src: none` enforced</span>
          </div>
        </div>
      </div>

      {/* 4-Step How It Works Guide */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Standard 4-Step Campaign Workflow</h2>
        <p className="text-xs text-slate-500 mb-6">
          Designed specifically around WhatsApp Web&apos;s manual image paste capabilities:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="inline-block px-2 py-0.5 text-xs font-bold bg-[#0B1F3A] text-white rounded mb-2">
              Step 1
            </span>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Import Dealer Excel</h4>
            <p className="text-xs text-slate-600 leading-normal">
              Upload your dealer list (.xlsx, .xls, .csv). The system auto-detects names, numbers, and
              flags invalid or duplicate contacts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="inline-block px-2 py-0.5 text-xs font-bold bg-[#0B1F3A] text-white rounded mb-2">
              Step 2
            </span>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Compose & Attach Image</h4>
            <p className="text-xs text-slate-600 leading-normal">
              Write your personalized message using <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">{'{name}'}</code>{' '}
              and upload one promotional bathware photo.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="inline-block px-2 py-0.5 text-xs font-bold bg-[#C9A24B] text-white rounded mb-2">
              Step 3
            </span>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Send Desk Workflow</h4>
            <p className="text-xs text-slate-600 leading-normal">
              Click &ldquo;Copy Image + Open Chat&rdquo;. In WhatsApp Web, press{' '}
              <kbd className="px-1 py-0.5 bg-slate-200 text-slate-800 rounded font-mono text-[10px]">Ctrl+V</kbd>{' '}
              to paste the image, review, and click Send yourself.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="inline-block px-2 py-0.5 text-xs font-bold bg-[#0B1F3A] text-white rounded mb-2">
              Step 4
            </span>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Export Report & Wipe</h4>
            <p className="text-xs text-slate-600 leading-normal">
              Mark each dealer as sent. When finished, export your audit report (Excel/CSV) and clear
              memory with one click.
            </p>
          </div>
        </div>
      </div>

      {/* Safety & Anti-Spam Notice */}
      <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-5 flex items-start gap-4 text-xs text-amber-900 leading-relaxed">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-800">
          <Coffee className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-semibold text-amber-950 mb-1 flex items-center gap-2">
            Safe Pacing & Account Protection Reminder
            <span className="text-[10px] font-normal text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
              Recommended: 15s cooldown
            </span>
          </h4>
          <p>
            Sending high volumes of identical promotional messages in rapid succession can trigger
            WhatsApp anti-abuse algorithms. Troika WhatsApp Sender enforces an assisted human pace
            with cooldown timers and break reminders every 40 contacts. Always message existing
            dealers who expect communication from Troika International.
          </p>
        </div>
      </div>
    </div>
  );
};
