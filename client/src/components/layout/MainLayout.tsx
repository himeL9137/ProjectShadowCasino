import React, { ReactNode, useMemo, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PermanentAdvertisement } from "../common/PermanentAdvertisement";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayoutContent = React.memo(function MainLayoutContent({ children }: MainLayoutProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Memoize className calculation
  const contentClasses = useMemo(() => 
    `flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-0' : 'ml-0'}`,
    [isCollapsed]
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className={contentClasses}>
        {/* Header */}
        <Header />
        
        {/* Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
      
      {/* Permanent Advertisement */}
      <PermanentAdvertisement />
    </div>
  );
});

export const MainLayout = React.memo(function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
});