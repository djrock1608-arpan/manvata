import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getTodayDateString } from '../utils/format';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  MessageCircle, 
  Printer, 
  PlusCircle, 
  ArrowDownCircle, 
  Edit2, 
  Trash2, 
  Calendar,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function AdminCustomerDetail({ customerId, setActivePage }) {
  const { apiFetch, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // ALL, UDHAR, JAMA
  const [toast, setToast] = useState(null);

  // Quick Action Modals
  const [isUdharOpen, setIsUdharOpen] = useState(false);
  const [isJamaOpen, setIsJamaOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteEntryId, setDeleteEntryId] = useState(null);

  // Shop items for dropdown in quick udhar
  const [shopItems, setShopItems] = useState([]);

  // Udhar form state
  const [udharForm, setUdharForm] = useState({
    item_name: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
    notes: '',
    date: getTodayDateString()
  });

  // Jama form state
  const [jamaForm, setJamaForm] = useState({
    amount: '',
    payment_mode: 'CASH',
    notes: 'રોકડ જમા',
    date: getTodayDateString()
  });

  // Edit entry form state
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    item_name: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
    notes: '',
    date: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchCustomerLedger = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/customers/${customerId}`);
      setData(res);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const items = await apiFetch('/api/items');
      setShopItems(items);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerLedger();
      fetchItems();
    }
  }, [customerId]);

  // Handle Quick Udhar Submission
  const handleUdharSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/api/entries', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId,
          type: 'UDHAR',
          ...udharForm
        })
      });
      setToast({ type: 'success', message: 'ઉધાર નોંધ સફળતાપૂર્વક ઉમેરાઈ ગઈ.' });
      setIsUdharOpen(false);
      setUdharForm({
        item_name: '',
        quantity: 1,
        unit_price: 0,
        amount: 0,
        notes: '',
        date: getTodayDateString()
      });
      fetchCustomerLedger();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Quick Jama Submission
  const handleJamaSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/api/entries', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId,
          type: 'JAMA',
          ...jamaForm
        })
      });
      setToast({ type: 'success', message: 'પૈસા સફળતાપૂર્વક જમા થઈ ગયા.' });
      setIsJamaOpen(false);
      setJamaForm({
        amount: '',
        payment_mode: 'CASH',
        notes: 'રોકડ જમા',
        date: getTodayDateString()
      });
      fetchCustomerLedger();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Entry
  const openEditEntry = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      item_name: entry.item_name,
      quantity: entry.quantity,
      unit_price: entry.unit_price,
      amount: entry.amount,
      notes: entry.notes || '',
      date: entry.date
    });
    setIsEditOpen(true);
  };

  // Handle Edit Entry Submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch(`/api/entries/${editingEntry.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      setToast({ type: 'success', message: 'નોંધ સફળતાપૂર્વક સુધારી લેવામાં આવી.' });
      setIsEditOpen(false);
      fetchCustomerLedger();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Entry
  const handleDeleteEntry = async (id) => {
    try {
      await apiFetch(`/api/entries/${id}`, { method: 'DELETE' });
      setToast({ type: 'success', message: 'નોંધ કાઢી નાખવામાં આવી.' });
      setDeleteEntryId(null);
      fetchCustomerLedger();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    if (!data?.customer) return;
    const c = data.customer;
    const shopName = user?.shop_name || 'ખાતાવહી દુકાન';
    const text = encodeURIComponent(
      `*${shopName}* - ખાતાવહી હિસાબ\n` +
      `ગ્રાહક: ${c.name}\n` +
      `તારીખ: ${formatDate(getTodayDateString())}\n` +
      `--------------------------\n` +
      `કુલ ઉધાર: ₹${c.total_udhar}\n` +
      `કુલ જમા: ₹${c.total_jama}\n` +
      `*બાકી ચૂકવવાપાત્ર રકમ: ₹${c.balance}*\n` +
      `--------------------------\n` +
      `તમારો હિસાબ જોવા તમારા મોબાઈલ નંબરથી લૉગિન કરો.`
    );
    window.open(`https://wa.me/91${c.phone}?text=${text}`, '_blank');
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-slate-400">
        ગ્રાહકની ખાતાવહી લોડ થઈ રહી છે...
      </div>
    );
  }

  const { customer, entries } = data || { customer: {}, entries: [] };

  const filteredEntries = entries.filter((e) => {
    if (filterType === 'ALL') return true;
    return e.type === filterType;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-6 print:p-0">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Back button & Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => setActivePage('customers')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          પાછા જાઓ
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp પર મોકલો
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            પ્રિન્ટ / PDF
          </button>
        </div>
      </div>

      {/* Customer Profile & Balance Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
              {customer.name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{customer.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 mt-1">
                <span className="flex items-center gap-1 font-medium">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {customer.phone}
                </span>
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {customer.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl flex items-center justify-between sm:justify-end gap-6">
            <div>
              <span className="text-xs font-bold text-slate-500 block">કુલ બાકી રકમ</span>
              <span
                className={`text-2xl font-black ${
                  customer.balance > 0 ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(customer.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Metrics: Udhar, Jama, Balance */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-red-50/70 border border-red-100 p-3 rounded-xl text-center">
            <span className="text-[11px] font-bold text-red-700 block">કુલ ઉધાર</span>
            <span className="text-sm sm:text-lg font-black text-red-700">
              {formatCurrency(customer.total_udhar)}
            </span>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl text-center">
            <span className="text-[11px] font-bold text-emerald-700 block">કુલ જમા</span>
            <span className="text-sm sm:text-lg font-black text-emerald-700">
              {formatCurrency(customer.total_jama)}
            </span>
          </div>
          <div className="bg-amber-50/70 border border-amber-100 p-3 rounded-xl text-center">
            <span className="text-[11px] font-bold text-amber-800 block">ચૂકવવાપાત્ર બાકી</span>
            <span className="text-sm sm:text-lg font-black text-amber-800">
              {formatCurrency(customer.balance)}
            </span>
          </div>
        </div>

        {/* Action Buttons: Add Udhar / Add Jama directly for this customer */}
        <div className="grid grid-cols-2 gap-3 mt-5 print:hidden">
          <button
            onClick={() => setIsUdharOpen(true)}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            + ઉધાર નોંધ કરો
          </button>
          <button
            onClick={() => setIsJamaOpen(true)}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
          >
            <ArrowDownCircle className="w-4 h-4" />
            + પૈસા જમા કરો
          </button>
        </div>
      </div>

      {/* Ledger History List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 print:bg-white">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              ખાતાવહી નોંધો ({filteredEntries.length})
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs print:hidden">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              બધી
            </button>
            <button
              onClick={() => setFilterType('UDHAR')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterType === 'UDHAR' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              ઉધાર
            </button>
            <button
              onClick={() => setFilterType('JAMA')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterType === 'JAMA' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              જમા
            </button>
          </div>
        </div>

        {/* Entries */}
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            કોઈ નોંધ મળી નથી.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEntries.map((entry) => {
              const isUdhar = entry.type === 'UDHAR';
              return (
                <div
                  key={entry.id}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
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
                        <span className="font-medium text-slate-600">
                          {formatDate(entry.date)}
                        </span>
                        {isUdhar && entry.quantity > 0 && entry.unit_price > 0 && (
                          <span>
                            • જથ્થો: {entry.quantity} (ભાવ: ₹{entry.unit_price})
                          </span>
                        )}
                        {entry.payment_mode && !isUdhar && (
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

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div
                        className={`text-base sm:text-lg font-black ${
                          isUdhar ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {isUdhar ? '+' : '-'} {formatCurrency(entry.amount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 print:hidden">
                      <button
                        onClick={() => openEditEntry(entry)}
                        title="સુધારો"
                        className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteEntryId(entry.id)}
                        title="કાઢી નાખો"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Quick Udhar */}
      <Modal
        isOpen={isUdharOpen}
        onClose={() => setIsUdharOpen(false)}
        title={`${customer.name} - ઉધાર નોંધ ઉમેરો`}
      >
        <form onSubmit={handleUdharSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              દુકાનની વસ્તુ પસંદ કરો
            </label>
            <select
              onChange={(e) => {
                const item = shopItems.find((i) => i.id === parseInt(e.target.value));
                if (item) {
                  const qty = udharForm.quantity || 1;
                  setUdharForm({
                    ...udharForm,
                    item_name: item.name,
                    unit_price: item.price,
                    amount: qty * item.price
                  });
                }
              }}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
            >
              <option value="">-- યાદીમાંથી પસંદ કરો અથવા નીચે જાતે લખો --</option>
              {shopItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - ₹{item.price} / {item.unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              વસ્તુનું નામ અથવા વિગત *
            </label>
            <input
              type="text"
              required
              value={udharForm.item_name}
              onChange={(e) => setUdharForm({ ...udharForm, item_name: e.target.value })}
              placeholder="દા.ત. દૂધ અમૂલ ગોલ્ડ"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                જથ્થો (Quantity) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={udharForm.quantity}
                onChange={(e) => {
                  const q = parseFloat(e.target.value) || 0;
                  setUdharForm({
                    ...udharForm,
                    quantity: e.target.value,
                    amount: q * (parseFloat(udharForm.unit_price) || 0)
                  });
                }}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                ભાવ (કિંમત ₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={udharForm.unit_price}
                onChange={(e) => {
                  const p = parseFloat(e.target.value) || 0;
                  setUdharForm({
                    ...udharForm,
                    unit_price: e.target.value,
                    amount: (parseFloat(udharForm.quantity) || 0) * p
                  });
                }}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">
              કુલ રકમ (ભાવ × જથ્થો):
            </span>
            <span className="text-xl font-black text-amber-800">
              ₹ {parseFloat(udharForm.amount || 0).toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                તારીખ
              </label>
              <input
                type="date"
                required
                value={udharForm.date}
                onChange={(e) => setUdharForm({ ...udharForm, date: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                વધારાની નોંધ
              </label>
              <input
                type="text"
                value={udharForm.notes}
                onChange={(e) => setUdharForm({ ...udharForm, notes: e.target.value })}
                placeholder="દા.ત. સવારનો સામાન"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUdharOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'નોંધાઈ રહ્યું છે...' : 'ઉધાર નોંધો'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Jama */}
      <Modal
        isOpen={isJamaOpen}
        onClose={() => setIsJamaOpen(false)}
        title={`${customer.name} - પૈસા જમા કરો`}
      >
        <form onSubmit={handleJamaSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">હાલની બાકી રકમ:</span>
            <span className="text-base font-black text-red-600">
              {formatCurrency(customer.balance)}
            </span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              જમા કરવાની રકમ (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={jamaForm.amount}
              onChange={(e) => setJamaForm({ ...jamaForm, amount: e.target.value })}
              placeholder="દા.ત. 500"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                ચુકવણીનો પ્રકાર
              </label>
              <select
                value={jamaForm.payment_mode}
                onChange={(e) => setJamaForm({ ...jamaForm, payment_mode: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
              >
                <option value="CASH">રોકડ (Cash)</option>
                <option value="UPI">Google Pay / PhonePe (UPI)</option>
                <option value="BANK">બેંક ટ્રાન્સફર</option>
                <option value="OTHER">અન્ય</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                તારીખ
              </label>
              <input
                type="date"
                required
                value={jamaForm.date}
                onChange={(e) => setJamaForm({ ...jamaForm, date: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              નોંધ (ઓપ્શનલ)
            </label>
            <input
              type="text"
              value={jamaForm.notes}
              onChange={(e) => setJamaForm({ ...jamaForm, notes: e.target.value })}
              placeholder="દા.ત. રોકડ આપી ગયા"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsJamaOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'જમા થઈ રહ્યું છે...' : 'પૈસા જમા કરો'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Entry */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="નોંધ સુધારો (Edit Entry)"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              વસ્તુનું નામ / વિગત *
            </label>
            <input
              type="text"
              required
              value={editForm.item_name}
              onChange={(e) => setEditForm({ ...editForm, item_name: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                જથ્થો
              </label>
              <input
                type="number"
                step="0.1"
                value={editForm.quantity}
                onChange={(e) => {
                  const q = parseFloat(e.target.value) || 0;
                  setEditForm({
                    ...editForm,
                    quantity: e.target.value,
                    amount: q * (parseFloat(editForm.unit_price) || 0)
                  });
                }}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                કિંમત / ભાવ (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={editForm.unit_price}
                onChange={(e) => {
                  const p = parseFloat(e.target.value) || 0;
                  setEditForm({
                    ...editForm,
                    unit_price: e.target.value,
                    amount: (parseFloat(editForm.quantity) || 0) * p
                  });
                }}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              કુલ રકમ (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                તારીખ
              </label>
              <input
                type="date"
                required
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                નોંધ
              </label>
              <input
                type="text"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'સાચવી રહ્યા છીએ...' : 'સુધારો સાચવો'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Entry Confirmation Modal */}
      <Modal
        isOpen={!!deleteEntryId}
        onClose={() => setDeleteEntryId(null)}
        title="નોંધ કાઢી નાખવાની પુષ્ટિ"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            શું તમે ખરેખર આ નોંધ કાઢી નાખવા માંગો છો? આનાથી ગ્રાહકની બાકી રકમ આપોઆપ ફરી ગણાઈ જશે.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteEntryId(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              રદ કરો
            </button>
            <button
              onClick={() => handleDeleteEntry(deleteEntryId)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm"
            >
              હા, કાઢી નાખો
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
