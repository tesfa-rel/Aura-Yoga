import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import Home from './Homepage/Home';
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

type TabType = 'home' | 'classes' | 'packages' | 'bookings' | 'payments' | 'admin-dashboard' | 'admin-classes' | 'admin-users' | 'admin-bookings' | 'admin-packages' | 'admin-payments';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const tab = segments.length > 1 ? segments[1] as TabType : null;
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.pathname]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    logout();
  };

  const isAdmin = user.role === 'ADMIN';

  const userTabs: { id: TabType; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'classes', label: 'Classes' },
    { id: 'packages', label: 'Packages' },
    { id: 'bookings', label: 'My Bookings' },
    { id: 'payments', label: 'My Payments' },
  ];

  const adminTabs: { id: TabType; label: string }[] = [
    { id: 'admin-dashboard', label: 'Dashboard' },
    { id: 'admin-classes', label: 'Classes' },
    { id: 'admin-packages', label: 'Packages' },
    { id: 'admin-bookings', label: 'Bookings' },
    { id: 'admin-users', label: 'Users' },
    { id: 'admin-payments', label: 'Payments' },
  ];

  const tabs = isAdmin ? adminTabs : userTabs;

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'classes':
        return (
          <div className="pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <ClassList />
            </div>
          </div>
        );
      case 'packages':
        return (
          <div className="pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <PackageList />
            </div>
          </div>
        );
      case 'bookings':
        return (
          <div className="pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <BookingHistory />
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <PaymentHistory />
            </div>
          </div>
        );
      case 'admin-dashboard':
        return (
          <div className="pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <AdminDashboardPage />
            </div>
          </div>
        );
      case 'admin-classes':
        return (
          <div className="pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <ClassManagement />
            </div>
          </div>
        );
      case 'admin-users':
        return (
          <div className="pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <UserManagement />
            </div>
          </div>
        );
      case 'admin-bookings':
        return (
          <div className="pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <BookingManagement />
            </div>
          </div>
        );
      case 'admin-packages':
        return (
          <div className="pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <PackageManagement />
            </div>
          </div>
        );
      case 'admin-payments':
        return (
          <div className="pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <PaymentManagement />
            </div>
          </div>
        );
      default:
        return isAdmin ? (
          <div className="pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <AdminDashboardPage />
            </div>
          </div>
        ) : (
          <Home />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-purple-600">AURA Yoga</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab.id ? 'text-purple-600 bg-purple-50' : ''
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                <span className="text-sm text-gray-600">Welcome, {user.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-purple-600 hover:bg-gray-100 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <div className="px-3 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">Welcome, {user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left text-gray-700 hover:text-purple-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium ${
                    activeTab === tab.id ? 'text-purple-600 bg-purple-50' : ''
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                className="w-full text-left text-gray-700 hover:text-purple-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Content Area */}
      <div className={activeTab === 'home' ? 'pt-14' : ''}>
        {renderContent()}
      </div>
    </div>
  );
};

export default DashboardLayout;
