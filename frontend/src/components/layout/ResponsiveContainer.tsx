import React from 'react';
import { DesktopSidebar } from './DesktopSidebar';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  useDotGrid?: boolean;
  hideSidebar?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  useDotGrid = true,
  hideSidebar = false
}) => {
  return (
    <div className="min-h-screen w-full bg-surface-dim dark:bg-[#121212] flex justify-center selection:bg-ink-blue-container selection:text-primary">
      <div className="w-full max-w-[1200px] flex min-h-screen">
        {/* Desktop Sidebar — always visible on lg: screens */}
        {!hideSidebar && <DesktopSidebar />}

        {/* Main Content Area */}
        <div
          className={`w-full lg:flex-1 min-h-screen flex flex-col relative bg-background border-x border-outline/50 shadow-[0_0_25px_rgba(0,0,0,0.03)] dark:shadow-[0_0_25px_rgba(0,0,0,0.3)] pb-24 lg:pb-6 ${
            useDotGrid ? 'notepad-canvas-bg' : ''
          } ${className}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
