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

  // Memoize className calculation with responsive design
  const contentClasses = useMemo(() => 
    `flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'lg:ml-0' : 'lg:ml-0'}`,
    [isCollapsed]
  );

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {/* Mobile Sidebar Backdrop */}
      <div className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
        !isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`} />
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className={`${contentClasses} w-full lg:w-auto`}>
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