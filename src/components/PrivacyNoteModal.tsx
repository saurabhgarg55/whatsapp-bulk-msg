/**
 * Privacy Note Modal explaining memory-only privacy architecture
 */

import React from 'react';
import { X, ShieldCheck, Lock, HardDrive, WifiOff } from 'lucide-react';

interface PrivacyNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyNoteModal: React.FC<PrivacyNoteModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0B1F3A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#C9A24B]" />
            <h2 className="text-base font-semibold tracking-tight">
              Troika Privacy & Data Architecture Note
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm text-slate-700 max-h-[75vh] overflow-y-auto">
          <p className="leading-relaxed">
            Troika WhatsApp Sender is built from the ground up as a{' '}
            <strong className="text-slate-900 font-semibold">100% client-side, zero-backend tool</strong>{' '}
            specifically designed to protect Troika International&apos;s dealer relationships and confidential contact lists.
          </p>

          <div className="grid gap-3 pt-2">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
              <HardDrive className="w-5 h-5 text-[#0B1F3A] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 mb-0.5">Held Exclusively in React Memory</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Your dealer Excel files, customer phone numbers, messages, and uploaded promotional images are held only in temporary browser memory. When you close the tab or click &ldquo;Clear campaign data&rdquo;, all records and image memory references are permanently erased.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
              <Lock className="w-5 h-5 text-[#0B1F3A] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 mb-0.5">Strict Storage Ban on Dealer Data</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Dealer data is strictly prohibited from touching localStorage, sessionStorage, IndexedDB, cookies, or Cache storage. Only tiny, non-sensitive preferences (e.g. cooldown seconds or default country code) persist in browser settings.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-[#0B1F3A] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 mb-0.5">Zero Network Requests & Strict CSP</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  After loading the initial application bundle, this tool makes zero network requests. There are no tracking scripts, third-party CDNs, analytics beacons, or remote font servers. A strict Content Security Policy (`connect-src &apos;none&apos;`) actively blocks outgoing network calls.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
            <strong>Console Hygiene:</strong> Dealer names and phone numbers are never printed to the browser developer console.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#162E52] rounded-lg transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
