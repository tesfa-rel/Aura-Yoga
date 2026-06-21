import React, { useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface TabletSidebarProps {
  tabs: NavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userName: string;
  onLogout: () => void;
}

const TabletSidebar: React.FC<TabletSidebarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  userName,
  onLogout,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className="hidden md:flex lg:hidden flex-col h-screen sticky top-0 bg-aura-ivory border-r border-aura-sand/30 z-40 transition-all duration-300"
      style={{ width: expanded ? 200 : 72 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-aura-sand/30 px-3">
        {expanded ? (
          <h1 className="text-lg font-bold text-aura-bark font-serif truncate">AURA</h1>
        ) : (
          <span className="text-xl font-bold text-aura-bark font-serif">A</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto" aria-label="Tablet navigation">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-200 min-h-[44px]
                ${isActive
                  ? 'bg-aura-sand/20 text-aura-bark'
                  : 'text-aura-umber hover:bg-aura-sand/10 hover:text-aura-ink'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon}
              {expanded && <span className="truncate">{tab.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-2 border-t border-aura-sand/30">
        {expanded && (
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-7 h-7 rounded-full bg-aura-sand/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-aura-bark">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-aura-umber truncate">{userName}</span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-2.5 py-2 text-sm font-medium text-aura-bark hover:bg-aura-sand/10 rounded-lg transition-colors min-h-[44px]"
          title="Logout"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {expanded && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default TabletSidebar;
