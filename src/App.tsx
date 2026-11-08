/**
 * Troika WhatsApp Sender - Root Application Component
 * Private internal tool for Troika International
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ActiveView,
  CampaignConfig,
  CampaignImage,
  DealerRow,
  SavedProgressData,
} from './types';
import {
  DEFAULT_CONFIG,
  loadStoredPreferences,
  saveStoredPreferences,
} from './utils/storage';
import { Navigation } from './components/Navigation';
import { OverviewView } from './components/OverviewView';
import { NewCampaignView } from './components/NewCampaignView';
import { SendDeskView } from './components/SendDeskView';
import { ReportView } from './components/ReportView';
import { PrivacyNoteModal } from './components/PrivacyNoteModal';
import { TestDeskModal } from './components/TestDeskModal';

export default function App() {
  // Navigation View State
  const [activeView, setActiveView] = useState<ActiveView>('overview');

  // Campaign Configuration (only non-sensitive defaults loaded from storage)
  const [config, setConfig] = useState<CampaignConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...loadStoredPreferences(),
  }));

  // Memory-only Campaign Data
  const [dealers, setDealers] = useState<DealerRow[]>([]);
  const [image, setImage] = useState<CampaignImage | null>(null);
  const [campaignStartedAt, setCampaignStartedAt] = useState<string | undefined>(undefined);
  const [campaignFinishedAt, setCampaignFinishedAt] = useState<string | undefined>(undefined);

  // Modals
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Resume progress file input ref
  const progressFileInputRef = useRef<HTMLInputElement>(null);

  // Save non-sensitive preferences when changed
  const updateConfig = (updated: Partial<CampaignConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updated };
      saveStoredPreferences(next);
      return next;
    });
  };

  // Demo mode toggle
  const toggleDemoMode = () => {
    setConfig((prev) => ({ ...prev, isDemoMode: !prev.isDemoMode }));
  };

  // Has active campaign condition
  const hasActiveCampaign = dealers.length > 0 && dealers.some((d) => d.selected);

  // Safe window beforeunload alert during active campaigns
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnfinished = dealers.some(
        (d) => d.selected && d.sendRecord.status === 'pending'
      );
      if (hasActiveCampaign && hasUnfinished) {
        e.preventDefault();
        e.returnValue =
          'You have an active Troika campaign in progress. If you close or reload this tab, your campaign progress will be erased from memory.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasActiveCampaign, dealers]);

  // Completely wipe campaign data & revoke object URLs from browser memory
  const handleClearAllCampaignMemory = () => {
    if (image?.objectUrl) {
      URL.revokeObjectURL(image.objectUrl);
    }
    setImage(null);
    setDealers([]);
    setCampaignStartedAt(undefined);
    setCampaignFinishedAt(undefined);
    setActiveView('overview');
  };

  // "Save Progress File" JSON export
  const handleSaveProgressFile = () => {
    const data: SavedProgressData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      config: {
        ...config,
      },
      dealers,
      campaignStartedAt,
      campaignFinishedAt,
      currentIndex: 0,
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (config.campaignName || 'Troika_Campaign')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    a.download = `${safeName}_Progress_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // "Resume from Progress File" handler
  const handleResumeFromFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed: SavedProgressData = JSON.parse(text);

      if (!parsed.dealers || !Array.isArray(parsed.dealers)) {
        alert('Invalid progress file structure.');
        return;
      }

      setDealers(parsed.dealers);
      if (parsed.config) {
        updateConfig(parsed.config);
      }
      if (parsed.campaignStartedAt) setCampaignStartedAt(parsed.campaignStartedAt);
      if (parsed.campaignFinishedAt) setCampaignFinishedAt(parsed.campaignFinishedAt);

      alert(
        'Campaign progress restored successfully! Please note: To protect privacy, images are not embedded in progress files. Please re-select your promotional image under "New Campaign" or proceed with sending.'
      );
      setActiveView('desk');
    } catch {
      alert('Could not parse the selected progress file. Make sure it is a valid Troika .json progress file.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <Navigation
        activeView={activeView}
        onViewChange={setActiveView}
        hasActiveCampaign={hasActiveCampaign}
        isDemoMode={config.isDemoMode}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-12">
        {activeView === 'overview' && (
          <OverviewView
            onNavigate={setActiveView}
            hasActiveCampaign={hasActiveCampaign}
            dealers={dealers}
            image={image}
            isDemoMode={config.isDemoMode}
            onToggleDemoMode={toggleDemoMode}
            onOpenTestModal={() => setIsTestModalOpen(true)}
            onTriggerResumeFromFile={() => progressFileInputRef.current?.click()}
          />
        )}

        {activeView === 'new-campaign' && (
          <NewCampaignView
            config={config}
            onUpdateConfig={updateConfig}
            dealers={dealers}
            onSetDealers={setDealers}
            image={image}
            onSetImage={setImage}
            onLaunchDesk={() => setActiveView('desk')}
            onOpenTestModal={() => setIsTestModalOpen(true)}
            onNavigate={setActiveView}
          />
        )}

        {activeView === 'desk' && (
          <SendDeskView
            config={config}
            onUpdateConfig={updateConfig}
            dealers={dealers}
            onUpdateDealers={setDealers}
            image={image}
            onNavigate={setActiveView}
            campaignStartedAt={campaignStartedAt}
            onSetCampaignStartedAt={setCampaignStartedAt}
            campaignFinishedAt={campaignFinishedAt}
            onSetCampaignFinishedAt={setCampaignFinishedAt}
            onSaveProgressFile={handleSaveProgressFile}
          />
        )}

        {activeView === 'report' && (
          <ReportView
            config={config}
            dealers={dealers}
            image={image}
            campaignStartedAt={campaignStartedAt}
            campaignFinishedAt={campaignFinishedAt}
            onNavigate={setActiveView}
            onClearAllCampaignMemory={handleClearAllCampaignMemory}
          />
        )}
      </main>

      {/* Hidden File Input for Resuming from Progress File */}
      <input
        ref={progressFileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleResumeFromFile(e.target.files[0]);
            e.target.value = ''; // reset so same file can be reloaded if needed
          }
        }}
      />

      {/* Privacy Guarantee Modal */}
      <PrivacyNoteModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* "Test with my own number" Modal */}
      <TestDeskModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        config={config}
        image={image}
      />

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Troika International · Artful Passion · Private Internal Assisted Tool
          </span>
          <span className="text-[11px] text-slate-400">
            Browser Memory-Only · Zero External Analytics · Strict CSP
          </span>
        </div>
      </footer>
    </div>
  );
}
