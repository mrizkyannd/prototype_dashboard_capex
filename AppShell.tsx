import React, { ReactNode } from 'react';
import { RouteId } from '../types';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

interface AppShellProps {
  activeRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeRoute,
  onNavigate,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#f6f9ff] text-[#161c22] font-sans antialiased flex">
      {/* Shared Sidebar */}
      <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} />

      {/* Main Container */}
      <div className="flex-1 ml-[166px] flex flex-col min-w-0">
        {/* Shared TopHeader */}
        <TopHeader onNavigate={onNavigate} activeRoute={activeRoute} />

        {/* Page Content Viewport */}
        <main className="pt-[48px] p-5 min-h-[calc(100vh-48px)] flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};
