import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminCustomers from './pages/AdminCustomers';
import AdminCustomerDetail from './pages/AdminCustomerDetail';
import AdminItems from './pages/AdminItems';
import AdminNewEntry from './pages/AdminNewEntry';
import AdminPayment from './pages/AdminPayment';
import AdminSettings from './pages/AdminSettings';
import CustomerPortal from './pages/CustomerPortal';

function MainApp() {
  const { user, loading, isAdmin, isCustomer } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white text-2xl font-bold animate-pulse shadow-lg mb-4">
          📖
        </div>
        <p className="text-slate-600 font-semibold text-sm">ખાતાવહી શરૂ થઈ રહી છે...</p>
      </div>
    );
  }

  // Not logged in -> Show Login
  if (!user) {
    return <Login />;
  }

  // Customer Portal
  if (isCustomer) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar activePage="portal" setActivePage={() => {}} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <CustomerPortal />
        </main>
      </div>
    );
  }

  // Admin (Shopkeeper) View
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activePage === 'dashboard' && (
          <AdminDashboard
            setActivePage={setActivePage}
            setSelectedCustomerId={setSelectedCustomerId}
          />
        )}
        {activePage === 'customers' && (
          <AdminCustomers
            setActivePage={setActivePage}
            setSelectedCustomerId={setSelectedCustomerId}
          />
        )}
        {activePage === 'customer-detail' && (
          <AdminCustomerDetail
            customerId={selectedCustomerId}
            setActivePage={setActivePage}
          />
        )}
        {activePage === 'items' && <AdminItems />}
        {activePage === 'new-entry' && (
          <AdminNewEntry
            setActivePage={setActivePage}
            setSelectedCustomerId={setSelectedCustomerId}
          />
        )}
        {activePage === 'payment' && (
          <AdminPayment
            setActivePage={setActivePage}
            setSelectedCustomerId={setSelectedCustomerId}
          />
        )}
        {activePage === 'settings' && <AdminSettings />}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
