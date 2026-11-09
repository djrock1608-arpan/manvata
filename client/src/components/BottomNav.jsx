import React from 'react';
import { LayoutDashboard, Users, Package, PlusCircle, ArrowDownCircle } from 'lucide-react';

export default function BottomNav({ activePage, setActivePage }) {
  const tabs = [
    { id: 'dashboard', label: 'ડેશબોર્ડ', icon: LayoutDashboard },
    { id: 'customers', label: 'ગ્રાહકો', icon: Users },
    { id: 'new-entry', label: 'નવી નોંધ', icon: PlusCircle, highlight: true },
    { id: 'payment', label: 'જમા કરો', icon: ArrowDownCircle },
    { id: 'items', label: 'વસ્તુઓ', icon: Package }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5 safe-area-bottom">
      <div className="grid grid-cols-5 gap-1 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePage === tab.id || (tab.id === 'customers' && activePage === 'customer-detail');

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => setActivePage(tab.id)}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className="w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-white">
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-[11px] font-medium mt-0.5 ${isActive ? 'text-amber-700' : 'text-slate-600'}`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActivePage(tab.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
                isActive ? 'text-amber-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] truncate max-w-[60px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
