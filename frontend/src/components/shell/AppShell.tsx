import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationDrawer } from './NotificationDrawer';
import { QuickActionModal } from './QuickActionModal';
import { api } from '../../api/client';

export function AppShell() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initial fetch of unread count
    api.getNotifications()
      .then((data) => {
        const count = data.filter((n: any) => !n.isRead).length;
        setUnreadCount(count);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="h-screen bg-[var(--color-bg)] flex flex-col antialiased overflow-hidden">
      <div className="flex flex-1 w-full min-h-0">
        {/* Sidebar */}
        <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

        {/* Main Workspace Layout */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <Topbar
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenQuickAction={() => setIsQuickActionOpen(true)}
            onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
            unreadCount={unreadCount}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global Interactive Modals and Drawers */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />

      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />
    </div>
  );
}
