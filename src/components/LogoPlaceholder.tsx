/**
 * ==============================================================================
 * TROIKA LOGO PLACEHOLDER COMPONENT
 * ==============================================================================
 * HOW TO SWAP IN YOUR REAL LOGO LATER:
 * To use your official Troika International logo image (SVG / PNG):
 * 1. Put your logo file (e.g. 'troika-logo.svg' or 'troika-logo.png') in the /public folder.
 * 2. In this file, replace the JSX inside the return statement with:
 *    <img src="/troika-logo.png" alt="Troika International" className="h-9 w-auto" />
 * ==============================================================================
 */

import React from 'react';

interface LogoPlaceholderProps {
  className?: string;
  showTagline?: boolean;
}

export const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({
  className = '',
  showTagline = true,
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand monogram mark */}
      <div className="w-9 h-9 rounded-lg bg-[#0B1F3A] border border-[#C9A24B]/30 flex items-center justify-center shadow-xs shrink-0">
        <span className="font-serif text-[#C9A24B] font-bold text-lg tracking-wider">T</span>
      </div>

      {/* Brand typographic lockup */}
      <div className="flex flex-col">
        <span className="font-serif tracking-[0.2em] text-[#0B1F3A] font-bold text-base uppercase leading-tight">
          TROIKA
        </span>
        {showTagline && (
          <span className="text-[10px] tracking-[0.16em] text-[#C9A24B] font-medium uppercase leading-tight">
            artful passion
          </span>
        )}
      </div>
    </div>
  );
};
