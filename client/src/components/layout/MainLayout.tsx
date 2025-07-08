import React, { ReactNode, useMemo, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PermanentAdvertisement } from "../common/PermanentAdvertisement";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayoutContent = React.memo(function MainLayoutContent({ children }: MainLayoutProps) {

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />
        
        {/* Content with responsive padding */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            {children}
          </div>
        </div>
      </div>
      
      {/* Permanent Advertisement - Hidden on mobile */}
      <div className="hidden xl:block">
        <PermanentAdvertisement />
      </div>
    </div>
  );
});

export const MainLayout = React.memo(function MainLayout({ children }: MainLayoutProps) {
  // Responsive sidebar state - collapsed on mobile, open on desktop
  const defaultOpen = typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
  
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
});