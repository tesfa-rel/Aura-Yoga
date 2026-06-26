import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import UserDashboard from './User/UserDashboard';
import ProfilePage from './User/ProfilePage';
import MyWaitlist from './User/MyWaitlist';
import CalendarView from './Classes/CalendarView';
import ClassList from './Classes/ClassList';
import PackageList from './Packages/PackageList';
import BookingHistory from './Booking/BookingHistory';
import PaymentHistory from './Payment/PaymentHistory';
import AdminDashboardPage from './Admin/AdminDashboardPage';
import ClassManagement from './Admin/ClassManagement';
import UserManagement from './Admin/UserManagement';
import BookingManagement from './Admin/BookingManagement';
import PackageManagement from './Admin/PackageManagement';
import PaymentManagement from './Admin/PaymentManagement';
import InstructorManagement from './Admin/InstructorManagement';
import Analytics from './Admin/Analytics';
import MobileBottomNav from './Layout/MobileBottomNav';
import DesktopSidebar from './Layout/DesktopSidebar';
import TabletSidebar from './Layout/TabletSidebar';
import {
  HomeIcon,
  ClassesIcon,
  PackagesIcon,
  BookingsIcon,
  PaymentsIcon,
  DashboardIcon,
  UsersIcon,
  InstructorIcon,
  AnalyticsIcon,
  ProfileIcon,
  WaitlistIcon,
  CalendarIcon,
} from './Layout/TabIcons';

type TabType = 'home' | 'classes' | 'packages' | 'bookings' | 'payments' | 'waitlist' | 'profile' | 'calendar' | 'admin-dashboard' | 'admin-classes' | 'admin-users' | 'admin-bookings' | 'admin-packages' | 'admin-payments' | 'admin-instructors' | 'admin-analytics';

interface TabDef {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = () => setShowMobileMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    const isAdmin = user.role === 'ADMIN';
    const tabMap: Record<string, TabType> = isAdmin
      ? { home: 'admin-dashboard', dashboard: 'admin-dashboard', classes: 'admin-classes', packages: 'admin-packages', bookings: 'admin-bookings', users: 'admin-users', payments: 'admin-payments', instructors: 'admin-instructors', analytics: 'admin-analytics' }
      : { home: 'home', classes: 'classes', packages: 'packages', bookings: 'bookings', payments: 'payments', waitlist: 'waitlist', profile: 'profile', calendar: 'calendar' };
    const segments = location.pathname.split('/').filter(Boolean);
    const tab = segments.length > 1 ? segments[1] : null;
    if (tab && tabMap[tab]) {
      setActiveTab(tabMap[tab]);
    } else if (isAdmin) {
      setActiveTab('admin-dashboard');
    }
  }, [location.pathname, user]);

  const isAdmin = user?.role === 'ADMIN';

  const userTabs: TabDef[] = useMemo(() => [
    { id: 'home', label: 'Home', icon: <HomeIcon className="w-5 h-5" /> },
    { id: 'classes', label: 'Classes', icon: <ClassesIcon className="w-5 h-5" /> },
    { id: 'calendar', label: 'Schedule', icon: <CalendarIcon className="w-5 h-5" /> },
    { id: 'packages', label: 'Packages', icon: <PackagesIcon className="w-5 h-5" /> },
    { id: 'bookings', label: 'Bookings', icon: <BookingsIcon className="w-5 h-5" /> },
    { id: 'payments', label: 'Payments', icon: <PaymentsIcon className="w-5 h-5" /> },
    { id: 'waitlist', label: 'Waitlist', icon: <WaitlistIcon className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <ProfileIcon className="w-5 h-5" /> },
  ], []);

  const adminTabs: TabDef[] = useMemo(() => [
    { id: 'admin-dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" /> },
    { id: 'admin-classes', label: 'Classes', icon: <ClassesIcon className="w-5 h-5" /> },
    { id: 'admin-packages', label: 'Packages', icon: <PackagesIcon className="w-5 h-5" /> },
    { id: 'admin-bookings', label: 'Bookings', icon: <BookingsIcon className="w-5 h-5" /> },
    { id: 'admin-users', label: 'Users', icon: <UsersIcon className="w-5 h-5" /> },
    { id: 'admin-instructors', label: 'Instructors', icon: <InstructorIcon className="w-5 h-5" /> },
    { id: 'admin-payments', label: 'Payments', icon: <PaymentsIcon className="w-5 h-5" /> },
    { id: 'admin-analytics', label: 'Analytics', icon: <AnalyticsIcon className="w-5 h-5" /> },
  ], []);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const tabs = isAdmin ? adminTabs : userTabs;

  const handleLogout = () => {
    logout();
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as TabType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    if (activeTab === 'home') {
      return isAdmin ? <AdminDashboardPage onTabChange={handleTabChange} /> : <UserDashboard />;
    }

    // Redirect non-admin users away from admin tabs
    if (!isAdmin && activeTab.startsWith('admin-')) {
      return <UserDashboard />;
    }

    const content = (() => {
      switch (activeTab) {
        case 'classes': return <ClassList />;
        case 'packages': return <PackageList />;
        case 'bookings': return <BookingHistory />;
        case 'payments': return <PaymentHistory />;
        case 'waitlist': return <MyWaitlist />;
        case 'profile': return <ProfilePage />;
        case 'calendar': return <CalendarView />;
        case 'admin-dashboard': return <AdminDashboardPage onTabChange={handleTabChange} />;
        case 'admin-classes': return <ClassManagement />;
        case 'admin-users': return <UserManagement />;
        case 'admin-bookings': return <BookingManagement />;
        case 'admin-packages': return <PackageManagement />;
        case 'admin-payments': return <PaymentManagement />;
        case 'admin-instructors': return <InstructorManagement />;
        case 'admin-analytics': return <Analytics />;
        default: return isAdmin ? <AdminDashboardPage onTabChange={handleTabChange} /> : <UserDashboard />;
      }
    })();

    return (
      <main className="flex-1 min-w-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {content}
        </div>
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-aura-bark flex">
      {/* Desktop Sidebar (lg+) */}
      <DesktopSidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userName={user.name}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />

      {/* Tablet Sidebar (md - lg) */}
      <TabletSidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userName={user.name}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header - only visible on mobile */}
        <header className="md:hidden bg-aura-bark border-b border-aura-sand/10 sticky top-0 z-40">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileDrawer(true)}
                className="p-2 -ml-2 text-aura-sand hover:text-aura-ivory hover:bg-aura-sand/10 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-bold text-aura-ivory font-serif">AURA</h1>
            </div>
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMobileMenu(prev => !prev); }}
                className="w-8 h-8 rounded-full bg-aura-sand/20 flex items-center justify-center"
              >
                <span className="text-sm font-semibold text-aura-ivory">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </button>
              {showMobileMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-aura-ink border border-aura-sand/20 rounded-lg shadow-lg z-50 py-1">
                  {isAdmin && (
                    <button
                      onClick={() => { handleTabChange(activeTab === 'home' ? 'admin-dashboard' : 'home'); setShowMobileMenu(false); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
                    >
                      {activeTab === 'home' ? (
                        <>
                          <svg className="w-4 h-4 mr-2 text-aura-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          Admin Dashboard
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2 text-aura-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Home
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-aura-umber/30"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Drawer */}
        {showMobileDrawer && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="flex-1 bg-black/50"
              onClick={() => setShowMobileDrawer(false)}
            />
            <aside className="w-64 bg-aura-bark border-l border-aura-sand/10 flex flex-col h-full">
              <div className="flex items-center justify-between h-14 px-4 border-b border-aura-sand/10">
                <h2 className="text-lg font-bold text-aura-ivory font-serif">Menu</h2>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-2 text-aura-sand hover:text-aura-ivory hover:bg-aura-sand/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { handleTabChange(tab.id); setShowMobileDrawer(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-sans transition-colors duration-200 min-h-[44px] ${
                        isActive
                          ? 'bg-aura-sand/20 text-aura-ivory'
                          : 'text-aura-sand hover:bg-aura-umber/40 hover:text-aura-ivory'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-aura-sand/10">
                <button
                  onClick={() => { handleLogout(); setShowMobileDrawer(false); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-aura-ivory hover:bg-aura-sand/10 rounded-lg transition-colors min-h-[44px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Content */}
        <div ref={contentRef} className="flex-1 pb-20 md:pb-0 overflow-y-auto">
          {renderContent()}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileBottomNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
};

export default DashboardLayout;
