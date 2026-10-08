import React from 'react';
import abjLogo from '../assets/Logo-ABJ.svg';

export const BrandBlock: React.FC = () => {
  return (
    <div className="h-[68px] px-4 flex items-center gap-2.5 border-b border-[#1e2d4a]/60 shrink-0 select-none">
      <div className="w-[34px] max-w-[34px] h-[28px] rounded bg-white flex items-center justify-center overflow-hidden shrink-0 p-0.5">
        <img
          src={abjLogo}
          alt="Official ABJ Logo"
          className="w-full h-full object-contain object-center shrink-0"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-[13px] font-bold text-white leading-[16px] tracking-tight whitespace-pre-line">
          CAPEX Project{'\n'}Bundling ABJ
        </span>
      </div>
    </div>
  );
};
