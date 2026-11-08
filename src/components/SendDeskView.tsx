/**
 * Send Desk - The primary assisted sending interface
 * Enforces manual human sending, PNG clipboard copy, cooldown countdowns, and progress tracking
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CampaignConfig,
  CampaignImage,
  DealerRow,
  ActiveView,
  SendStatus,
} from '../types';
import {
  ExternalLink,
  CheckCircle2,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Pause,
  Play,
  RotateCcw,
  Coffee,
  AlertCircle,
  Save,
  Check,
  ListFilter,
  Eye,
  Clock,
  Sparkles,
} from 'lucide-react';
import { personalizeMessage, buildWhatsAppLink } from '../utils/template';
import { copyImageToClipboard, copyTextToClipboard, openWhatsAppChatTab } from '../utils/clipboard';

interface SendDeskViewProps {
  config: CampaignConfig;
  onUpdateConfig: (updated: Partial<CampaignConfig>) => void;
  dealers: DealerRow[];
  onUpdateDealers: (updated: DealerRow[]) => void;
  image: CampaignImage | null;
  onNavigate: (view: ActiveView) => void;
  campaignStartedAt?: string;
  onSetCampaignStartedAt: (t: string) => void;
  campaignFinishedAt?: string;
  onSetCampaignFinishedAt: (t: string) => void;
  onSaveProgressFile: () => void;
}

export const SendDeskView: React.FC<SendDeskViewProps> = ({
  config,
  onUpdateConfig,
  dealers,
  onUpdateDealers,
  image,
  onNavigate,
  campaignStartedAt,
  onSetCampaignStartedAt,
  campaignFinishedAt,
  onSetCampaignFinishedAt,
  onSaveProgressFile,
}) => {
  // Only selected dealers participate in the send sequence
  const selectedDealers = useMemo(() => dealers.filter((d) => d.selected), [dealers]);

  // Current dealer index within selectedDealers
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Cooldown countdown state
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Break counter state
  const [sentCountSinceBreak, setSentCountSinceBreak] = useState(0);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Status correction drawer
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);

  // Clipboard & Popup notifications
  const [imageCopyNotice, setImageCopyNotice] = useState<{
    type: 'success' | 'fallback' | 'info';
    message: string;
  } | null>(null);
  const [messageCopyNotice, setMessageCopyNotice] = useState(false);
  const [blockedPopupUrl, setBlockedPopupUrl] = useState<string | null>(null);

  // Set start time if not already set
  useEffect(() => {
    if (!campaignStartedAt && selectedDealers.length > 0) {
      onSetCampaignStartedAt(new Date().toISOString());
    }
  }, [campaignStartedAt, selectedDealers.length, onSetCampaignStartedAt]);

  // Current active dealer
  const currentDealer = selectedDealers[currentIndex];

  // Calculated Metrics
  const totalSelected = selectedDealers.length;
  const sentCount = selectedDealers.filter((d) => d.sendRecord.status === 'sent').length;
  const skippedCount = selectedDealers.filter((d) => d.sendRecord.status === 'skipped').length;
  const openedCount = selectedDealers.filter((d) => d.sendRecord.status === 'opened').length;
  const completedCount = sentCount + skippedCount;
  const remainingCount = Math.max(0, totalSelected - completedCount);
  const percentComplete = totalSelected > 0 ? Math.round((completedCount / totalSelected) * 100) : 0;
  const isAllCompleted = totalSelected > 0 && completedCount === totalSelected;

  // Personalised message for current dealer
  const personalizedMsg = currentDealer
    ? personalizeMessage(config.messageTemplate, currentDealer.cleanName, config.appendStopNotice)
    : '';

  // Cooldown timer tick
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Handle Mark as Sent
  const handleMarkAsSentAndNext = useCallback(() => {
    if (!currentDealer) return;

    const now = new Date().toLocaleTimeString();
    const updated = dealers.map((d) => {
      if (d.id === currentDealer.id) {
        return {
          ...d,
          sendRecord: {
            ...d.sendRecord,
            status: 'sent' as SendStatus,
            sentAt: now,
          },
        };
      }
      return d;
    });

    onUpdateDealers(updated);

    // Increment break tracker
    const newSentSinceBreak = sentCountSinceBreak + 1;
    setSentCountSinceBreak(newSentSinceBreak);

    if (newSentSinceBreak >= config.breakInterval) {
      setShowBreakReminder(true);
    }

    // Auto advance to next pending dealer or show completion modal
    if (currentIndex < selectedDealers.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Reached the end of the list!
      onSetCampaignFinishedAt(new Date().toISOString());
      setShowCompletionModal(true);
    }

    setImageCopyNotice(null);
    setBlockedPopupUrl(null);
  }, [
    currentDealer,
    dealers,
    onUpdateDealers,
    sentCountSinceBreak,
    config.breakInterval,
    currentIndex,
    selectedDealers.length,
    onSetCampaignFinishedAt,
  ]);

  // Handle Skip Dealer
  const handleSkipDealer = useCallback(() => {
    if (!currentDealer) return;

    const now = new Date().toLocaleTimeString();
    const updated = dealers.map((d) => {
      if (d.id === currentDealer.id) {
        return {
          ...d,
          sendRecord: {
            ...d.sendRecord,
            status: 'skipped' as SendStatus,
            skippedAt: now,
          },
        };
      }
      return d;
    });

    onUpdateDealers(updated);

    if (currentIndex < selectedDealers.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Reached the end of the list!
      onSetCampaignFinishedAt(new Date().toISOString());
      setShowCompletionModal(true);
    }

    setImageCopyNotice(null);
    setBlockedPopupUrl(null);
  }, [currentDealer, dealers, onUpdateDealers, currentIndex, selectedDealers.length, onSetCampaignFinishedAt]);

  // Handle Main Action: "Copy image + Open WhatsApp chat"
  const handleCopyImageAndOpenChat = useCallback(async () => {
    if (!currentDealer || isPaused) return;

    // Guard: If campaign is finished and current dealer was already sent
    if (isAllCompleted && currentDealer.sendRecord.status === 'sent') {
      setShowCompletionModal(true);
      return;
    }

    // Start cooldown
    if (config.cooldownSeconds > 0) {
      setCooldownRemaining(config.cooldownSeconds);
    }

    // Mark dealer status as opened
    const now = new Date().toLocaleTimeString();
    const updated = dealers.map((d) => {
      if (d.id === currentDealer.id && d.sendRecord.status === 'pending') {
        return {
          ...d,
          sendRecord: {
            ...d.sendRecord,
            status: 'opened' as SendStatus,
            openedAt: now,
          },
        };
      }
      return d;
    });
    onUpdateDealers(updated);

    // 1. Copy image to clipboard as PNG
    if (image?.objectUrl) {
      const copyRes = await copyImageToClipboard(image.objectUrl);
      if (copyRes.success) {
        setImageCopyNotice({
          type: 'success',
          message: 'Image copied to clipboard as PNG! Ready to paste (Ctrl+V) in WhatsApp Web.',
        });
      } else {
        setImageCopyNotice({
          type: 'fallback',
          message:
            'Automatic clipboard write was blocked by the browser. Fallback: Right-click the image on the right and select "Copy image", or drag it directly into WhatsApp Web.',
        });
      }
    } else {
      setImageCopyNotice({
        type: 'info',
        message: 'No promotional image attached to this campaign. Only chat link opened.',
      });
    }

    // 2. Open WhatsApp Web tab
    const link = buildWhatsAppLink(
      currentDealer.normalizedPhone,
      personalizedMsg,
      config.linkType,
      config.messageMode
    );

    if (config.isDemoMode) {
      setBlockedPopupUrl(link);
    } else {
      const tabResult = openWhatsAppChatTab(link);
      if (tabResult.blocked) {
        setBlockedPopupUrl(link);
      } else {
        setBlockedPopupUrl(null);
      }
    }
  }, [
    currentDealer,
    isPaused,
    config.cooldownSeconds,
    config.linkType,
    config.messageMode,
    config.isDemoMode,
    dealers,
    onUpdateDealers,
    image,
    personalizedMsg,
  ]);

  // Manual image copy
  const handleManualImageCopy = async () => {
    if (!image?.objectUrl) return;
    const res = await copyImageToClipboard(image.objectUrl);
    if (res.success) {
      setImageCopyNotice({
        type: 'success',
        message: 'Image copied to clipboard as PNG!',
      });
    } else {
      setImageCopyNotice({
        type: 'fallback',
        message: 'Could not write to clipboard. Please right-click the image and select "Copy image".',
      });
    }
  };

  // Manual message copy
  const handleManualMessageCopy = async () => {
    if (!personalizedMsg) return;
    await copyTextToClipboard(personalizedMsg);
    setMessageCopyNotice(true);
    setTimeout(() => setMessageCopyNotice(false), 2000);
  };

  // Download image file
  const handleDownloadImage = () => {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image.objectUrl;
    a.download = image.name || 'troika_promotional_image.jpg';
    a.click();
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input or textarea or modal
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        showBreakReminder ||
        showStatusDrawer
      ) {
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        // Space / Enter -> Trigger primary action
        e.preventDefault();
        handleCopyImageAndOpenChat();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleMarkAsSentAndNext();
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handleSkipDealer();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        if (currentIndex < selectedDealers.length - 1) setCurrentIndex((i) => i + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleCopyImageAndOpenChat,
    handleMarkAsSentAndNext,
    handleSkipDealer,
    currentIndex,
    selectedDealers.length,
    showBreakReminder,
    showStatusDrawer,
  ]);

  if (totalSelected === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Dealers Selected</h2>
        <p className="text-sm text-slate-600">
          You haven&apos;t imported or selected any valid dealers for this campaign yet.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('new-campaign')}
          className="px-5 py-2.5 bg-[#0B1F3A] hover:bg-[#162E52] text-white font-semibold text-sm rounded-xl transition-colors"
        >
          Go to New Campaign Setup
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Top Banner: Progress Bar & Campaign Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                {config.campaignName || 'Troika WhatsApp Campaign'}
              </span>
              {config.isDemoMode && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                  DEMO MODE
                </span>
              )}
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Assisted Dispatcher · Dealer {currentIndex + 1} of {totalSelected}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-700 font-mono">
              <span className="font-bold text-emerald-700">{sentCount} Sent</span>
              <span className="text-slate-300">·</span>
              <span className="text-amber-700 font-medium">{skippedCount} Skipped</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600 font-medium">{remainingCount} Left</span>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <select
                value={config.linkType}
                onChange={(e) => onUpdateConfig({ linkType: e.target.value as 'desktop' | 'web' | 'wame' })}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium text-slate-800"
                title="Select WhatsApp mode: Windows App opens desktop software directly"
              >
                <option value="desktop">WhatsApp Desktop App (Windows) [Default]</option>
                <option value="web">Direct WhatsApp Web (web.whatsapp.com)</option>
                <option value="wame">wa.me (Universal Web)</option>
              </select>

              <button
                type="button"
                onClick={() => setShowStatusDrawer(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="View all dealer statuses and correct mistakes"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Manage List ({totalSelected})</span>
              </button>

              <button
                type="button"
                onClick={onSaveProgressFile}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Download secure progress JSON file"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Progress File</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
          <div
            className="bg-emerald-600 h-2 transition-all duration-300"
            style={{ width: `${(sentCount / totalSelected) * 100}%` }}
            title={`Sent: ${sentCount}`}
          />
          <div
            className="bg-amber-500 h-2 transition-all duration-300"
            style={{ width: `${(skippedCount / totalSelected) * 100}%` }}
            title={`Skipped: ${skippedCount}`}
          />
        </div>
      </div>

      {/* Persistent 4-Step Action Guide */}
      <div className="bg-[#0B1F3A] text-white rounded-xl p-4 shadow-sm border border-[#0B1F3A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#C9A24B] text-[#0B1F3A] flex items-center justify-center font-bold text-sm shrink-0">
            4
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C9A24B]">
              Standard Assisted Send Steps (Follow in Order):
            </h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-200 mt-0.5">
              <span><strong>1)</strong> Click &ldquo;Copy Image + Open Chat&rdquo;</span>
              <span><strong>2)</strong> In WhatsApp Web press <kbd className="px-1 py-0.2 bg-white/20 rounded font-mono text-[10px]">Ctrl+V</kbd> to paste image</span>
              <span><strong>3)</strong> Review &amp; click Send yourself</span>
              <span><strong>4)</strong> Return here and click &ldquo;Mark as sent and next&rdquo;</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {isPaused ? (
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Resume Campaign
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsPaused(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors border border-white/20"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('report')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A24B] hover:bg-[#B68F37] text-white text-xs font-bold rounded-lg transition-colors"
          >
            Finish &amp; View Report
          </button>
        </div>
      </div>

      {/* Main Send Desk Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side (7 Cols): Current Dealer Details, Message Preview & Action Center */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Contact Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-[#0B1F3A] font-mono font-bold text-xs flex items-center justify-center">
                  #{currentDealer?.rawIndex || currentIndex + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {currentDealer?.cleanName || 'Sir/Madam'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                    <span>
                      {currentDealer?.normalizedPhone ? `+${currentDealer.normalizedPhone}` : currentDealer?.rawPhone}
                    </span>
                    <span>·</span>
                    <span>Position {currentIndex + 1} of {totalSelected}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {currentDealer?.sendRecord.status === 'sent' && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Marked as Sent ({currentDealer.sendRecord.sentAt})
                  </span>
                )}
                {currentDealer?.sendRecord.status === 'opened' && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Chat Opened ({currentDealer.sendRecord.openedAt})
                  </span>
                )}
                {currentDealer?.sendRecord.status === 'skipped' && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <SkipForward className="w-3.5 h-3.5" />
                    Skipped
                  </span>
                )}
                {currentDealer?.sendRecord.status === 'pending' && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                    Pending Send
                  </span>
                )}
              </div>
            </div>

            {/* Warnings if any */}
            {currentDealer?.warning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{currentDealer.warning}</span>
              </div>
            )}

            {/* Personalised Message Box with Copy Action */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Personalised Message Preview:
                </span>
                <button
                  type="button"
                  onClick={handleManualMessageCopy}
                  className="flex items-center gap-1 text-slate-600 hover:text-[#0B1F3A] font-semibold"
                >
                  {messageCopyNotice ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{messageCopyNotice ? 'Copied' : 'Copy Message'}</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">
                {personalizedMsg}
              </div>
            </div>

            {/* Primary Action Button: "Copy image + Open WhatsApp chat" OR "Campaign Complete" */}
            <div className="space-y-3 pt-2">
              {isAllCompleted ? (
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      Campaign Completed! All {totalSelected} Dealers Processed
                    </h4>
                    <p className="text-xs text-emerald-800">
                      You have reached the end of the dealer list. No pending contacts remain.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate('report')}
                    className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                    <span>View Official Campaign Report &amp; Export</span>
                    <span className="hidden sm:inline-block text-[11px] font-normal text-emerald-200 font-mono bg-white/10 px-2 py-0.5 rounded">
                      Press Space / Enter
                    </span>
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <button
                      type="button"
                      onClick={() => setShowStatusDrawer(true)}
                      className="text-slate-600 hover:text-slate-900 font-medium underline"
                    >
                      Review / Adjust Dealer Statuses
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentDealer) {
                          const link = buildWhatsAppLink(
                            currentDealer.normalizedPhone,
                            personalizedMsg,
                            config.linkType,
                            config.messageMode
                          );
                          openWhatsAppChatTab(link);
                        }
                      }}
                      className="text-slate-400 hover:text-slate-600 text-[11px]"
                      title="Force re-open WhatsApp for this dealer"
                    >
                      Re-open chat for this dealer
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isPaused}
                  onClick={handleCopyImageAndOpenChat}
                  className="w-full py-4 px-6 bg-[#0B1F3A] hover:bg-[#162E52] disabled:opacity-50 text-white font-bold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-3 relative overflow-hidden"
                >
                  <ExternalLink className="w-5 h-5 text-[#C9A24B]" />
                  <span>
                    {cooldownRemaining > 0
                      ? `Open WhatsApp Chat (${cooldownRemaining}s cooldown)`
                      : 'Copy Image + Open WhatsApp Chat'}
                  </span>
                  <span className="hidden sm:inline-block text-[11px] font-normal text-slate-300 font-mono bg-white/10 px-2 py-0.5 rounded">
                    Press Space / Enter
                  </span>
                </button>
              )}

              {/* Status / Feedback Notifications */}
              {imageCopyNotice && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                    imageCopyNotice.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : imageCopyNotice.type === 'fallback'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'bg-blue-50 text-blue-900 border border-blue-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{imageCopyNotice.message}</span>
                </div>
              )}

              {/* Pop-up blocked / Demo mode notice with fallback link */}
              {blockedPopupUrl && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                  <p className="font-semibold">
                    {config.isDemoMode
                      ? 'Demo Mode Active: Click simulated link below'
                      : 'Browser blocked opening WhatsApp tab:'}
                  </p>
                  <div className="p-2 bg-white rounded border border-amber-200 font-mono text-[11px] break-all select-all">
                    {blockedPopupUrl}
                  </div>
                  {!config.isDemoMode && (
                    <a
                      href={blockedPopupUrl}
                      target="troika_whatsapp_tab"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0B1F3A] text-white font-semibold rounded-lg hover:bg-[#162E52]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Dealer Chat Manually
                    </a>
                  )}
                </div>
              )}

              {/* Secondary Navigation & Marking Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleMarkAsSentAndNext}
                  className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Sent (S)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSkipDealer}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Skip Dealer (K)</span>
                </button>

                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous (P)</span>
                </button>

                <button
                  type="button"
                  disabled={currentIndex >= selectedDealers.length - 1}
                  onClick={() => setCurrentIndex((i) => Math.min(selectedDealers.length - 1, i + 1))}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span>Next (N)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Keyboard Shortcuts Hint Bar */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap items-center justify-center gap-3">
                <span className="font-semibold text-slate-700">Keyboard Shortcuts:</span>
                <span><kbd className="px-1 py-0.5 bg-slate-100 border rounded font-mono">Space/Enter</kbd> Open Chat</span>
                <span><kbd className="px-1 py-0.5 bg-slate-100 border rounded font-mono">S</kbd> Mark Sent</span>
                <span><kbd className="px-1 py-0.5 bg-slate-100 border rounded font-mono">K</kbd> Skip</span>
                <span><kbd className="px-1 py-0.5 bg-slate-100 border rounded font-mono">P</kbd> Prev</span>
                <span><kbd className="px-1 py-0.5 bg-slate-100 border rounded font-mono">N</kbd> Next</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (5 Cols): Large Promotional Image Preview & Actions */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Promotional Catalog Image
                </h3>
                {image && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    {(image.size / 1024).toFixed(0)} KB
                  </span>
                )}
              </div>

              {image ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center min-h-[300px] max-h-[460px]">
                  <img
                    src={image.objectUrl}
                    alt="Troika Promotional Graphic"
                    className="w-full h-full object-contain max-h-[460px]"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 min-h-[250px] flex flex-col items-center justify-center">
                  <p className="text-xs font-semibold text-slate-600 mb-1">No Image Attached</p>
                  <p className="text-[11px]">Go to New Campaign to select a promotional bathware photo.</p>
                </div>
              )}
            </div>

            {/* Image Action Buttons */}
            {image && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleManualImageCopy}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Image (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Break Reminder Modal */}
      {showBreakReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Time for a Safe Pacing Break!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have messaged <strong className="text-slate-900 font-semibold">{sentCountSinceBreak} dealers</strong> in this session. Sending many similar messages in quick succession can flag your WhatsApp account. Troika recommends resting for 5–10 minutes before resuming.
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setSentCountSinceBreak(0);
                  setShowBreakReminder(false);
                }}
                className="px-6 py-2.5 bg-[#0B1F3A] hover:bg-[#162E52] text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                I Took a Break / Continue Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Correction Drawer / Modal */}
      {showStatusDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-[#0B1F3A] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Manage Contacts &amp; Correct Statuses</h3>
                <p className="text-[11px] text-slate-300">
                  Undo accidental &ldquo;Sent&rdquo; marks, jump to any dealer, or skip contacts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusDrawer(false)}
                className="text-slate-300 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh] divide-y divide-slate-100 text-xs">
              {selectedDealers.map((d, idx) => (
                <div
                  key={d.id}
                  className={`py-2.5 px-3 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg ${
                    idx === currentIndex ? 'bg-blue-50/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 w-8">#{idx + 1}</span>
                    <div>
                      <span className="font-semibold text-slate-900">{d.cleanName}</span>
                      <span className="text-slate-500 font-mono ml-2">
                        +{d.normalizedPhone || d.rawPhone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={d.sendRecord.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as SendStatus;
                        const updated = dealers.map((item) =>
                          item.id === d.id
                            ? {
                                ...item,
                                sendRecord: {
                                  ...item.sendRecord,
                                  status: newStatus,
                                  sentAt: newStatus === 'sent' ? new Date().toLocaleTimeString() : undefined,
                                },
                              }
                            : item
                        );
                        onUpdateDealers(updated);
                      }}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="opened">Opened</option>
                      <option value="sent">Sent</option>
                      <option value="skipped">Skipped</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowStatusDrawer(false);
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-[#0B1F3A] hover:bg-slate-100 rounded"
                    >
                      Jump Here
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStatusDrawer(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Complete Celebration Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                End of Dealer List Reached
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Campaign Successfully Completed!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have reached the end of the selected dealer queue. All{' '}
                <strong className="text-slate-900">{totalSelected} dealers</strong> have been processed.
              </p>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-3 py-2 border-y border-slate-100 text-left">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-semibold uppercase text-emerald-800">Marked as Sent</span>
                <p className="text-xl font-bold text-emerald-700 font-mono mt-0.5">{sentCount}</p>
              </div>
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                <span className="text-[10px] font-semibold uppercase text-amber-800">Skipped by User</span>
                <p className="text-xl font-bold text-amber-700 font-mono mt-0.5">{skippedCount}</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowCompletionModal(false);
                  onNavigate('report');
                }}
                className="w-full py-3 px-4 bg-[#0B1F3A] hover:bg-[#162E52] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-[#C9A24B]" />
                View Official Campaign Report &amp; Export
              </button>

              <button
                type="button"
                onClick={() => setShowCompletionModal(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Stay on Desk &amp; Review Dealer List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
