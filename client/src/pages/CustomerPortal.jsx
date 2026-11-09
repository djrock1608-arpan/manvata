import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';
import { 
  Store, 
  User, 
  Calendar, 
  Clock, 
  ShoppingBag, 
  ArrowDownLeft, 
  AlertCircle, 
  RefreshCw, 
  Phone,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function CustomerPortal() {
  const { user, apiFetch } = useAuth();
  const [data, setData] = useState(null);
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all'); // all, today, month
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    try {
      setRefreshing(true);
      const res = await apiFetch('/api/customer-portal/summary');
      setData(res);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchEntries = async (currentFilter) => {
    try {
      const url = currentFilter === 'all' 
        ? '/api/customer-portal/entries' 
        : `/api/customer-portal/entries?filter=${currentFilter}`;
      const res = await apiFetch(url);
      setEntries(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchEntries(filter);
  }, [filter]);

  const handleRefresh = () => {
    fetchSummary();
    fetchEntries(filter);
  };

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">તમારો ખાતાવહી હિસાબ આવી રહ્યો છે...</p>
      </div>
    );
  }

  const { customer, shop, stats, todayItems } = data || {
    customer: {},
    shop: {},
    stats: {},
    todayItems: []
  };

  const isOwed = stats?.netBalance > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Shop & Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-100 text-xs font-semibold uppercase tracking-wider mb-1">
              <Store className="w-4 h-4" />
              {shop.name || 'ખાતાવહી દુકાન'}
              {shop.phone && <span>• ફોન: {shop.phone}</span>}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              નમસ્તે, {customer.name}!
            </h2>
            <p className="text-xs text-amber-100 mt-1">
              મોબાઈલ: {customer.phone}
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            તાજું કરો
          </button>
        </div>

        {/* Outstanding Balance Banner Card */}
        <div className="mt-6 bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-medium text-amber-100 block">
              તમારે દુકાને ચૂકવવાની બાકી રકમ
            </span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-0.5">
              {formatCurrency(stats?.netBalance || 0)}
            </div>
          </div>
          <div className="text-xs text-amber-100">
            {isOwed ? (
              <span className="inline-flex items-center gap-1 bg-red-500/80 text-white px-2.5 py-1 rounded-full font-bold">
                બાકી ચૂકવવાપાત્ર
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-emerald-500/80 text-white px-2.5 py-1 rounded-full font-bold">
                હિસાબ ક્લિયર છે
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Today's purchases */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">આજે લીધેલ સામાન</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {formatCurrency(stats?.todayUdhar || 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {stats?.todayItemsCount || 0} નોંધો આજે થઈ
          </p>
        </div>

        {/* Total Jama */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">કુલ જમા કરેલ રકમ</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 mt-2">
            {formatCurrency(stats?.totalJama || 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">દુકાને આપેલા નાણાં</p>
        </div>

        {/* Total Udhar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">કુલ ઉધાર ખરીદી</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {formatCurrency(stats?.totalUdhar || 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">કુલ સામાન લીધો</p>
        </div>
      </div>

      {/* Today's Special Section (આજે લીધેલ સામાન) */}
      {todayItems && todayItems.length > 0 && (
        <div className="bg-amber-50/80 rounded-2xl border border-amber-200/80 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-slate-900 text-base">
              આજે લીધેલ સામાન ({todayItems.length} વસ્તુઓ)
            </h3>
          </div>
          <div className="divide-y divide-amber-200/60 bg-white rounded-xl border border-amber-200/60 overflow-hidden">
            {todayItems.map((item) => (
              <div key={item.id} className="p-3.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.item_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.quantity > 0 && `જથ્થો: ${item.quantity}`}
                    {item.unit_price > 0 && ` × ₹${item.unit_price}`}
                    {item.notes ? ` • ${item.notes}` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-red-600 text-base">
                    + {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Ledger History (આખી ખાતાવહી) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header with filters */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-base">તમારી આખી ખાતાવહી</h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              બધી નોંધો
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              આજની
            </button>
            <button
              onClick={() => setFilter('month')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filter === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              આ મહિનાની
            </button>
          </div>
        </div>

        {/* List of entries */}
        {entries.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            આ સમયગાળામાં કોઈ નોંધ મળી નથી.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((entry) => {
              const isUdhar = entry.type === 'UDHAR';
              return (
                <div
                  key={entry.id}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isUdhar
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}
                    >
                      {isUdhar ? 'ઉધાર' : 'જમા'}
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base">
                        {entry.item_name}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">
                          {formatDate(entry.date)}
                        </span>
                        {isUdhar && entry.quantity > 0 && entry.unit_price > 0 && (
                          <span>
                            • જથ્થો: {entry.quantity} (ભાવ: ₹{entry.unit_price})
                          </span>
                        )}
                        {!isUdhar && entry.payment_mode && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {entry.payment_mode}
                          </span>
                        )}
                        {entry.notes && (
                          <span className="text-slate-400 italic">• {entry.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-base sm:text-lg font-black ${
                        isUdhar ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {isUdhar ? '+' : '-'} {formatCurrency(entry.amount)}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {isUdhar ? 'ઉધાર સામાન' : 'પૈસા જમા'}
                    </span>
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
