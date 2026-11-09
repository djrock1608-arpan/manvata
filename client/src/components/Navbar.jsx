import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, Settings, User } from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActivePage(isAdmin ? 'dashboard' : 'portal')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                ખાતાવહી
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {isAdmin ? 'દુકાનદાર' : 'ગ્રાહક'}
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                {isAdmin ? (user?.shop_name || 'મારી દુકાન') : (user?.shopName || 'ડિજિટલ હિસાબ')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation for Admin */}
          {isAdmin && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <button
                onClick={() => setActivePage('dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'dashboard'
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                ડેશબોર્ડ
              </button>
              <button
                onClick={() => setActivePage('customers')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'customers' || activePage === 'customer-detail'
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                ગ્રાહકો
              </button>
              <button
                onClick={() => setActivePage('items')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'items'
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                વસ્તુઓ (ભાવ)
              </button>
              <button
                onClick={() => setActivePage('new-entry')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'new-entry'
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                + નવી નોંધ
              </button>
              <button
                onClick={() => setActivePage('payment')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activePage === 'payment'
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                + પૈસા જમા
              </button>
            </nav>
          )}

          {/* User actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAdmin && (
              <button
                onClick={() => setActivePage('settings')}
                title="સેટિંગ્સ અને પાસવર્ડ બદલો"
                className={`p-2 rounded-lg border transition-colors ${
                  activePage === 'settings'
                    ? 'bg-slate-100 border-slate-300 text-slate-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            <div className="hidden sm:flex items-center text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <User className="w-4 h-4 mr-1.5 text-slate-400" />
              {isAdmin ? user?.username : user?.name}
            </div>

            <button
              onClick={logout}
              title="બહાર નીકળો (Logout)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">બહાર નીકળો</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
