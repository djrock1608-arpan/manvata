import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';
import { 
  TrendingUp, 
  ArrowDownLeft, 
  AlertCircle, 
  Users, 
  PlusCircle, 
  ArrowDownCircle, 
  UserPlus, 
  Receipt, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboard({ setActivePage, setSelectedCustomerId }) {
  const { apiFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const data = await apiFetch('/api/entries/dashboard-stats');
      setStats(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const openCustomer = (id) => {
    if (setSelectedCustomerId) {
      setSelectedCustomerId(id);
    }
    setActivePage('customer-detail');
  };

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      {/* Top Banner & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">દુકાન ડેશબોર્ડ</h2>
          <p className="text-sm text-slate-500">
            આજના હિસાબ-કિતાબ અને બાકી રકમની તાજી સ્થિતિ
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
          તાજું કરો (Refresh)
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Sales (ઉધાર) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">આજનું કુલ વેચાણ</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {loading ? '...' : formatCurrency(stats?.todaySales || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">આજે આપેલો ઉધાર સામાન</p>
          </div>
        </div>

        {/* Card 2: Today's Collection (જમા) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">આજની કુલ જમા</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">
              {loading ? '...' : formatCurrency(stats?.todayJama || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">આજે રોકડ / UPI થી આવેલ રકમ</p>
          </div>
        </div>

        {/* Card 3: Total Pending (બજારમાં બાકી) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">કુલ બાકી રકમ</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600">
              {loading ? '...' : formatCurrency(stats?.totalPending || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">બધા ગ્રાહકો પાસેથી લેવાના બાકી</p>
          </div>
        </div>

        {/* Card 4: Customers Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">કુલ ગ્રાહકો</span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {loading ? '...' : `${stats?.totalCustomers || 0} જણા`}
            </div>
            <p className="text-xs text-slate-500 mt-1">નોંધાયેલા ખાતા ધારકો</p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setActivePage('new-entry')}
          className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-sm hover:shadow-md active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-base">નવી ઉધાર નોંધ</div>
              <div className="text-xs text-amber-100">ગ્રાહકના નામે સામાન લખો</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-70" />
        </button>

        <button
          onClick={() => setActivePage('payment')}
          className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-sm hover:shadow-md active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-base">પૈસા જમા કરો</div>
              <div className="text-xs text-emerald-100">ગ્રાહકે પૈસા આપ્યા તે નોંધો</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-70" />
        </button>

        <button
          onClick={() => setActivePage('customers')}
          className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-sm hover:shadow-md active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-base">નવો ગ્રાહક ઉમેરો</div>
              <div className="text-xs text-slate-300">નવું ખાતું ખોલો</div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 opacity-70" />
        </button>
      </div>

      {/* Recent Activity Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-800">તાજેતરની લેવડ-દેવડ (છેલ્લી નોંધો)</h3>
          </div>
          <button
            onClick={() => setActivePage('customers')}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            બધા ગ્રાહકો જુઓ
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">માહિતી લોડ થઈ રહી છે...</div>
        ) : !stats?.recentEntries || stats.recentEntries.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            હજુ સુધી કોઈ નોંધ થઈ નથી. "નવી નોંધ" બટન દબાવી પહેલી નોંધ કરો!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.recentEntries.map((entry) => {
              const isUdhar = entry.type === 'UDHAR';
              return (
                <div
                  key={entry.id}
                  onClick={() => openCustomer(entry.customer_id)}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                        isUdhar
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}
                    >
                      {isUdhar ? 'ઉધાર' : 'જમા'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        {entry.customer_name}
                        <span className="text-xs font-normal text-slate-400">
                          ({entry.customer_phone})
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {entry.item_name}
                        {entry.quantity > 1 ? ` × ${entry.quantity}` : ''}
                        {entry.notes ? ` • ${entry.notes}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-black text-sm sm:text-base ${
                        isUdhar ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {isUdhar ? '+' : '-'} {formatCurrency(entry.amount)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formatDate(entry.date)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
