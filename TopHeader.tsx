import React from 'react';
import { Search, Filter, Calendar, Bell, Database } from 'lucide-react';
import { RouteId } from '../types';

interface TopHeaderProps {
  onNavigate?: (route: RouteId) => void;
  activeRoute?: RouteId;
}

export const TopHeader: React.FC<TopHeaderProps> = () => {
  return (
    <header className="fixed top-0 right-0 left-0 md:left-[166px] h-[48px] bg-white border-b border-[#dde3eb] z-40 flex items-center justify-between px-4 select-none">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-bold text-[#161c22] tracking-tight">
          CAPEX Project Bundling ABJ
        </h1>
      </div>

      {/* Right Utility Icons */}
      <div className="flex items-center gap-1">
        <button
          className="p-1.5 text-[#434655] hover:text-[#004ac6] hover:bg-[#eef4fc] rounded-full transition-colors"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 text-[#434655] hover:text-[#004ac6] hover:bg-[#eef4fc] rounded-full transition-colors"
          title="Filter"
        >
          <Filter className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 text-[#434655] hover:text-[#004ac6] hover:bg-[#eef4fc] rounded-full transition-colors"
          title="Calendar"
        >
          <Calendar className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 text-[#434655] hover:text-[#004ac6] hover:bg-[#eef4fc] rounded-full transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#ba1a1a] rounded-full"></span>
        </button>
      </div>
    </header>
  );
};
