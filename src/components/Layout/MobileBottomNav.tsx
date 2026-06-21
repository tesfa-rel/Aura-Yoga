import React from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface MobileBottomNavProps {
  tabs: NavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-aura-ivory border-t border-aura-sand/30 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                min-w-[44px] min-h-[44px]
                transition-colors duration-200
                ${isActive
                  ? 'text-aura-bark'
                  : 'text-aura-umber hover:text-aura-ink'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`
                p-1 rounded-lg transition-all duration-200
                ${isActive ? 'bg-aura-sand/20' : ''}
              `}>
                {tab.icon}
              </div>
              <span className="text-[10px] font-medium mt-0.5 leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
