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
      className="hidden md:flex lg:hidden flex-col h-screen sticky top-0 bg-white border-r border-gray-200 z-40 transition-all duration-300"
      style={{ width: expanded ? 200 : 72 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200 px-3">
        {expanded ? (
          <h1 className="text-lg font-bold text-purple-600 truncate">AURA Yoga</h1>
        ) : (
          <span className="text-xl font-bold text-purple-600">A</span>
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
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
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
      <div className="p-2 border-t border-gray-200">
        {expanded && (
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-purple-600">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-700 truncate">{userName}</span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-2.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px]"
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
