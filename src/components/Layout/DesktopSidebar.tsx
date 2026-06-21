import React from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface DesktopSidebarProps {
  tabs: NavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userName: string;
  onLogout: () => void;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  userName,
  onLogout,
}) => {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-aura-ivory border-r border-aura-sand/30 z-40">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-aura-sand/30">
        <h1 className="text-xl font-bold text-aura-bark font-serif">AURA</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Desktop navigation">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-200 min-h-[44px]
                ${isActive
                  ? 'bg-aura-sand/20 text-aura-bark'
                  : 'text-aura-umber hover:bg-aura-sand/10 hover:text-aura-ink'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-aura-sand/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-aura-sand/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-aura-bark">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-aura-umber truncate">{userName}</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-aura-bark hover:bg-aura-sand/10 rounded-lg transition-colors min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
