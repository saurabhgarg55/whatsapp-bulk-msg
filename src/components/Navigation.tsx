/**
 * Top Navigation Bar following the strict 3-zone contract
 */

import React from 'react';
import { ActiveView } from '../types';
import { LogoPlaceholder } from './LogoPlaceholder';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface NavigationProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  hasActiveCampaign: boolean;
  isDemoMode: boolean;
  onOpenPrivacyModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  onViewChange,
  hasActiveCampaign,
  isDemoMode,
  onOpenPrivacyModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <div
          onClick={() => onViewChange('overview')}
          className="cursor-pointer whitespace-nowrap shrink-0 hover:opacity-95 transition-opacity"
        >
          <LogoPlaceholder />
        </div>

        {/* Zone 2: Single-line navigation links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onViewChange('overview')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'overview'
                ? 'bg-[#0B1F3A] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100'
            }`}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() => onViewChange('new-campaign')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'new-campaign'
                ? 'bg-[#0B1F3A] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100'
            }`}
          >
            New Campaign
          </button>

          <button
            type="button"
            onClick={() => onViewChange('desk')}
            className={`relative px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'desk'
                ? 'bg-[#0B1F3A] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100'
            }`}
          >
            Campaign Progress
            {hasActiveCampaign && (
              <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-[#C9A24B]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onViewChange('report')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'report'
                ? 'bg-[#0B1F3A] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100'
            }`}
          >
            Campaign Report
          </button>
        </nav>

        {/* Zone 3: Privacy and Demo status */}
        <div className="flex items-center gap-2 shrink-0">
          {isDemoMode && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Demo Mode Active
            </span>
          )}

          <button
            type="button"
            onClick={onOpenPrivacyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="View browser-only privacy guarantee"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Memory Only</span>
            <span>Privacy Note</span>
          </button>
        </div>
      </div>
    </header>
  );
};
