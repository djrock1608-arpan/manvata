import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getTodayDateString } from '../utils/format';
import Toast from '../components/Toast';
import { 
  ArrowDownCircle, 
  User, 
  Wallet, 
  CheckCircle, 
  Calendar, 
  ArrowRight,
  CreditCard
} from 'lucide-react';

export default function AdminPayment({ setActivePage, setSelectedCustomerId }) {
  const { apiFetch } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [date, setDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('રોકડ જમા');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const list = await apiFetch('/api/customers');
        setCustomers(list);
        if (list.length > 0) {
          // Default to first customer with pending balance if any
          const withBalance = list.find((c) => c.balance > 0);
          setCustomerId(withBalance ? withBalance.id.toString() : list[0].id.toString());
        }
      } catch (err) {
        setToast({ type: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const selectedCustomer = customers.find((c) => c.id === parseInt(customerId));

  const setFullBalance = () => {
    if (selectedCustomer && selectedCustomer.balance > 0) {
      setAmount(selectedCustomer.balance.toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      setToast({ type: 'error', message: 'કૃપા કરીને ગ્રાહક પસંદ કરો.' });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setToast({ type: 'error', message: 'માન્ય જમા રકમ દાખલ કરો.' });
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/api/entries', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: parseInt(customerId),
          type: 'JAMA',
          amount: numAmount,
          payment_mode: paymentMode,
          notes,
          date
        })
      });

      setToast({
        type: 'success',
        message: `${selectedCustomer?.name} ના ખાતામાં ₹${numAmount} સફળતાપૂર્વક જમા થઈ ગયા!`
      });

      // Redirect to customer detail after 700ms
      setTimeout(() => {
        if (setSelectedCustomerId) {
          setSelectedCustomerId(parseInt(customerId));
        }
        setActivePage('customer-detail');
      }, 700);

    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">પૈસા જમા કરો</h2>
        <p className="text-sm text-slate-500">
          ગ્રાહકે રોકડ અથવા ઓનલાઇન ચૂકવેલા નાણાં જમા કરો જેથી બાકી રકમ ઘટી જાય
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Customer Selection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            1. ગ્રાહક પસંદ કરો *
          </label>

          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium bg-white"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone}) - બાકી: ₹{c.balance}
              </option>
            ))}
          </select>

          {selectedCustomer && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-900 block">
                  ગ્રાહકની હાલની બાકી રકમ:
                </span>
                <span className="text-xl font-black text-emerald-800">
                  {formatCurrency(selectedCustomer.balance)}
                </span>
              </div>
              {selectedCustomer.balance > 0 && (
                <button
                  type="button"
                  onClick={setFullBalance}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  પૂરી રકમ ભરો
                </button>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Amount & Payment Mode */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            2. જમા રકમ અને પદ્ધતિ *
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              જમા કરવાની રકમ (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="દા.ત. 500"
                className="w-full pl-9 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 text-xl font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick amount chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">ઝડપી રકમ:</span>
            {[100, 200, 500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt.toString())}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 rounded-lg transition-colors border border-slate-200"
              >
                + ₹{amt}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ચુકવણી પદ્ધતિ (Payment Mode)
              </label>
              <select
                value={paymentMode}
                onChange={(e) => {
                  setPaymentMode(e.target.value);
                  if (e.target.value === 'UPI') setNotes('Google Pay / UPI દ્વારા જમા');
                  else if (e.target.value === 'CASH') setNotes('રોકડ જમા');
                }}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="CASH">💵 રોકડ (Cash)</option>
                <option value="UPI">📱 Google Pay / PhonePe (UPI)</option>
                <option value="BANK">🏦 બેંક ટ્રાન્સફર</option>
                <option value="OTHER">અન્ય</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                તારીખ
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              નોંધ / વિગત (ઓપ્શનલ)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="દા.ત. રોકડ આપી ગયા"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={submitting || !amount || parseFloat(amount) <= 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl shadow-md text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? 'જમા થઈ રહ્યું છે...' : `ખાતામાં ₹${parseFloat(amount || 0).toFixed(2)} જમા કરો`}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
