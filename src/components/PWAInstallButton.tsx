import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Monitor, CheckCircle, HelpCircle, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed desktop or mobile app, show a subtle status or hide
  if (isInstalled) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg ${className}`}>
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        <span>Installed App</span>
      </div>
    );
  }

  // 1-click install flow when Chrome fires beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg shadow-xs transition-colors ${className}`}
        title="Install Troika WhatsApp Sender as a standalone desktop app on your PC"
      >
        <Download className="w-3.5 h-3.5 text-[#C9A24B]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0B1F3A]">Install on iOS</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                1. Tap the <strong>Share</strong> button (box with upward arrow) in Safari.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
                3. Tap <strong>Add</strong> to install.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-lg bg-[#0B1F3A] py-2 text-xs font-semibold text-white hover:bg-[#162E52]"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Standard Desktop Chrome guide fallback (if beforeinstallprompt hasn't fired yet or already dismissed)
  return (
    <>
      <button
        type="button"
        onClick={() => setShowManualGuide(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors ${className}`}
        title="How to install this app on your PC in Chrome"
      >
        <Monitor className="w-3.5 h-3.5 text-[#C9A24B]" />
        <span>Install App</span>
      </button>

      {showManualGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] flex items-center justify-center text-[#C9A24B] font-serif font-bold text-sm">
                  T
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F3A]">Install Troika on your PC</h3>
                  <p className="text-[11px] text-slate-500">Standalone Desktop Application</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#C9A24B]" />
                  How to install in Chrome or Edge:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                  <li>Look at the right side of your <strong>Chrome address bar</strong> (where the URL is).</li>
                  <li>Click the <strong>Install icon</strong> (an icon showing a computer screen with an arrow, or an install badge).</li>
                  <li>Or click the <strong>three dots (⋮)</strong> in Chrome at the top right → select <strong>"Install Troika WhatsApp Sender..."</strong> or <strong>"Save and share" → "Install page as app"</strong>.</li>
                  <li>Click <strong>Install</strong> to add it to your Windows Desktop & Start Menu.</li>
                </ol>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Once installed, Troika opens in its own clean window without browser toolbars, exactly like a native Windows desktop program.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowManualGuide(false)}
              className="w-full rounded-xl bg-[#0B1F3A] py-2.5 text-xs font-semibold text-white hover:bg-[#162E52] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
