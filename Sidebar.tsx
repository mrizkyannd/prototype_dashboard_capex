import React from 'react';
import { RouteId } from '../types';
import { BrandBlock } from './BrandBlock';
import { LayoutDashboard, FolderKanban, SearchCode, TrendingUp, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useData } from '../context/DataContext';

interface SidebarProps {
  activeRoute: RouteId;
  onNavigate: (route: RouteId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeRoute, onNavigate }) => {
  const { error, loading, isLoaded, validationData, lastRefreshed, refreshData } = useData();

  const reviewCount = validationData?.controlValidation?.reviewRows ?? 0;
  const hasError = !!error;

  const navItems = [
    { id: 'executive-overview' as RouteId, label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'project-portfolio' as RouteId, label: 'Project Portfolio', icon: FolderKanban },
    { id: 'procurement-explorer' as RouteId, label: 'Procurement Explorer', icon: SearchCode },
    { id: 'vowd-rna' as RouteId, label: 'VOWD & RNA', icon: TrendingUp },
  ];

  return (
    <nav className="fixed left-0 top-0 h-screen w-[166px] min-w-[166px] max-w-[166px] bg-[#111b2e] flex flex-col z-50 shadow-none border-r border-[#1e2d4a]/50 select-none">
      <BrandBlock />

      {/* Primary Navigation */}
      <div className="flex-1 flex flex-col gap-1 py-3 px-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id || (activeRoute === 'project-detail' && item.id === 'project-portfolio');

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-2 px-2.5 py-2.5 rounded-md text-[12px] font-medium transition-colors text-left w-full ${
                isActive
                  ? 'bg-[#2563eb] text-white shadow-xs'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1e2d4a]/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="leading-snug">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* System Status - Single status area */}
      <div className="mt-auto border-t border-[#1e2d4a] py-3 px-2 flex flex-col gap-1.5 bg-[#0e1726]">
        {hasError ? (
          <div className="flex flex-col gap-1 px-1">
            <div className="flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-medium leading-tight">Data Load Failed</span>
            </div>
            <button
              onClick={() => refreshData(true)}
              className="text-[10px] text-sky-400 hover:text-white underline text-left cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Retry Load</span>
            </button>
          </div>
        ) : loading && !isLoaded ? (
          <div className="flex items-center gap-1.5 px-1 text-slate-400">
            <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-sky-400" />
            <span className="text-[11px] font-medium leading-tight">Syncing Data...</span>
          </div>
        ) : reviewCount === 0 ? (
          <div className="flex items-center gap-1.5 px-1 text-[#10b981]">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-medium leading-tight">Data Reconciled</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-1 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-medium leading-tight">Data Review Required</span>
          </div>
        )}

        {lastRefreshed && (
          <div className="text-[10px] text-[#64748b] px-1 leading-tight border-t border-[#1e2d4a]/60 pt-1.5 mt-0.5">
            <span className="block text-[#94a3b8]">Last Refresh:</span>
            <span className="font-mono text-[#cbd5e1]">{lastRefreshed}</span>
          </div>
        )}
      </div>
    </nav>
  );
};
