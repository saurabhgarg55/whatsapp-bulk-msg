/**
 * "Test with my own number" modal
 * Simulates the Send Desk workflow for a single self-test contact
 */

import React, { useState } from 'react';
import { X, Smartphone, Copy, ExternalLink, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { CampaignConfig, CampaignImage } from '../types';
import { normalizePhoneNumber } from '../utils/phone';
import { personalizeMessage, buildWhatsAppLink } from '../utils/template';
import { copyImageToClipboard, copyTextToClipboard, openWhatsAppChatTab } from '../utils/clipboard';

interface TestDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CampaignConfig;
  image: CampaignImage | null;
}

export const TestDeskModal: React.FC<TestDeskModalProps> = ({
  isOpen,
  onClose,
  config,
  image,
}) => {
  const [testName, setTestName] = useState('My Test Dealer');
  const [testPhone, setTestPhone] = useState('');
  const [country, setCountry] = useState(config.defaultCountry || 'NP');
  const [copyImageStatus, setCopyImageStatus] = useState<string | null>(null);
  const [copyTextStatus, setCopyTextStatus] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [stepDone, setStepDone] = useState(false);

  if (!isOpen) return null;

  const phoneResult = normalizePhoneNumber(testPhone, country);
  const previewMessage = personalizeMessage(
    config.messageTemplate || 'Namaste {name}, this is a test from Troika WhatsApp Sender.',
    testName,
    config.appendStopNotice
  );

  const handleTestSendDesk = async () => {
    if (!phoneResult.isValid) return;

    const link = buildWhatsAppLink(
      phoneResult.normalizedDigits,
      previewMessage,
      config.linkType,
      config.messageMode
    );
    setGeneratedLink(link);
    setPopupBlocked(false);

    // 1. Copy image to clipboard if image is present
    if (image?.objectUrl) {
      const copyRes = await copyImageToClipboard(image.objectUrl);
      if (copyRes.success) {
        setCopyImageStatus('Image copied to clipboard as PNG! Ready to paste (Ctrl+V).');
      } else {
        setCopyImageStatus(`Note: ${copyRes.message || 'Could not copy image automatically.'}`);
      }
    } else {
      setCopyImageStatus('No campaign image selected. Only message text will be tested.');
    }

    // 2. Open chat tab
    if (config.isDemoMode) {
      setPopupBlocked(true); // in demo mode, show link text instead
    } else {
      const result = openWhatsAppChatTab(link);
      if (result.blocked) {
        setPopupBlocked(true);
      }
    }

    setStepDone(true);
  };

  const handleManualCopyMessage = async () => {
    await copyTextToClipboard(previewMessage);
    setCopyTextStatus(true);
    setTimeout(() => setCopyTextStatus(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0B1F3A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#C9A24B]" />
            <div>
              <h2 className="text-base font-semibold">Test With My Own Number</h2>
              <p className="text-xs text-slate-300">
                Verify the exact Send Desk experience before launching to dealers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Test Contact Name
              </label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. My Phone / Test Dealer"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="px-2 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="NP">NP (+977)</option>
                  <option value="IN">IN (+91)</option>
                  <option value="BD">BD (+880)</option>
                  <option value="AE">AE (+971)</option>
                  <option value="GB">GB (+44)</option>
                  <option value="US">US (+1)</option>
                </select>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="9841234567 or +977..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                />
              </div>
              {testPhone && (
                <div className="mt-1 text-xs">
                  {phoneResult.isValid ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" /> Valid:{' '}
                      <span className="font-mono">{phoneResult.formattedDisplay}</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {phoneResult.errorReason || 'Invalid phone'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Message Preview */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Personalised Message Preview</span>
              <button
                type="button"
                onClick={handleManualCopyMessage}
                className="flex items-center gap-1 text-slate-600 hover:text-[#0B1F3A]"
              >
                {copyTextStatus ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copyTextStatus ? 'Copied' : 'Copy Message'}</span>
              </button>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
              {previewMessage}
            </div>
          </div>

          {/* Image Status */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="font-semibold text-slate-700">Campaign Image:</span>
            {image ? (
              <span className="text-emerald-700 font-medium truncate max-w-xs">
                {image.name} ({(image.size / 1024).toFixed(0)} KB)
              </span>
            ) : (
              <span className="text-slate-500 italic">No image chosen yet</span>
            )}
          </div>

          {/* Feedback & Popup Notice */}
          {copyImageStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              {copyImageStatus}
            </div>
          )}

          {popupBlocked && generatedLink && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <p className="font-semibold">
                {config.isDemoMode
                  ? 'Demo Mode Active: Link was not opened automatically.'
                  : 'Browser blocked pop-up or opened tab:'}
              </p>
              <div className="p-2 bg-white rounded border border-amber-200 font-mono text-[11px] break-all select-all">
                {generatedLink}
              </div>
              {!config.isDemoMode && (
                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 text-white font-medium rounded-md hover:bg-amber-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Click to open test chat manually
                </a>
              )}
            </div>
          )}

          {stepDone && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-600" />
                Test Action Completed!
              </p>
              <p>
                In WhatsApp Web, hit <kbd className="px-1 py-0.5 bg-white border rounded">Ctrl+V</kbd> to paste the image, inspect the text prefill or caption, and verify everything looks great before starting the campaign.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            Close
          </button>

          <button
            type="button"
            disabled={!phoneResult.isValid}
            onClick={handleTestSendDesk}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#162E52] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
          >
            <ExternalLink className="w-4 h-4 text-[#C9A24B]" />
            Copy Image + Open Test WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
