import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  MapPin, 
  ArrowRight, 
  Edit2, 
  Trash2, 
  KeyRound,
  MessageCircle,
  Clock
} from 'lucide-react';

export default function AdminCustomers({ setActivePage, setSelectedCustomerId }) {
  const { apiFetch, user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', pin: '1234', address: '' });
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm
  const [deleteId, setDeleteId] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const url = search ? `/api/customers?search=${encodeURIComponent(search)}` : '/api/customers';
      const data = await apiFetch(url);
      setCustomers(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', pin: '1234', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({ name: cust.name, phone: cust.phone, pin: '', address: cust.address || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await apiFetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setToast({ type: 'success', message: 'ગ્રાહકની વિગતો સફળતાપૂર્વક સુધારી લેવામાં આવી.' });
      } else {
        const res = await apiFetch('/api/customers', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setToast({ 
          type: 'success', 
          message: `ગ્રાહક ઉમેરાઈ ગયો! ગ્રાહક લૉગિન PIN: ${res.defaultPin}` 
        });
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await apiFetch(`/api/customers/${id}`, { method: 'DELETE' });
      setToast({ type: 'success', message: res.message });
      setDeleteId(null);
      fetchCustomers();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const openLedger = (id) => {
    if (setSelectedCustomerId) {
      setSelectedCustomerId(id);
    }
    setActivePage('customer-detail');
  };

  // WhatsApp Reminder link
  const sendWhatsAppReminder = (c) => {
    const shopName = user?.shop_name || 'અમારી દુકાન';
    const text = encodeURIComponent(
      `નમસ્તે ${c.name} જી,\n${shopName} તરફથી નમ્ર વિનંતી.\nતમારા ખાતામાં બાકી રકમ: ₹${c.balance} છે.\nકૃપા કરીને સમયસર ચુકવણી કરવા વિનંતી.\nઆભાર!`
    );
    window.open(`https://wa.me/91${c.phone}?text=${text}`, '_blank');
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">ગ્રાહકોની ખાતાવહી</h2>
          <p className="text-sm text-slate-500">
            તમામ ગ્રાહકોની યાદી, બાકી રકમ અને લેવડ-દેવડ
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          નવો ગ્રાહક ઉમેરો
        </button>
      </div>

      {/* Balance Summary & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ગ્રાહક શોધો... નામ અથવા 10 અંકનો મોબાઈલ નંબર"
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl flex items-center justify-between">
          <span className="text-xs font-bold text-amber-900">આ યાદીની કુલ બાકી:</span>
          <span className="text-lg font-black text-amber-800">
            {formatCurrency(totalOutstanding)}
          </span>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">ગ્રાહકો લોડ થઈ રહ્યા છે...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">કોઈ ગ્રાહક મળ્યા નથી</h4>
            <p className="text-sm text-slate-500 mt-1">
              નવા ગ્રાહકનું ખાતું બનાવવા માટે ઉપરનું બટન દબાવો.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {customers.map((c) => {
              const hasBalance = c.balance > 0;
              return (
                <div
                  key={c.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Customer Info */}
                  <div 
                    className="flex items-start gap-3.5 cursor-pointer flex-1"
                    onClick={() => openLedger(c.id)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base hover:text-amber-700 transition-colors">
                          {c.name}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {c.phone}
                        </span>
                        {c.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {c.address}
                          </span>
                        )}
                        {c.last_date && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3" />
                            છેલ્લી નોંધ: {formatDate(c.last_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Balance & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div 
                      className="text-left sm:text-right cursor-pointer"
                      onClick={() => openLedger(c.id)}
                    >
                      <span className="text-[11px] font-semibold text-slate-500 block">બાકી રકમ</span>
                      <span
                        className={`text-lg font-black ${
                          hasBalance ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatCurrency(c.balance)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasBalance && (
                        <button
                          onClick={() => sendWhatsAppReminder(c)}
                          title="WhatsApp પર યાદ અપાવો"
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => openLedger(c.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200 transition-colors"
                      >
                        ખાતું જુઓ
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => openEditModal(c)}
                        title="સુધારો"
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteId(c.id)}
                        title="કાઢી નાખો"
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'ગ્રાહકની વિગત સુધારો' : 'નવો ગ્રાહક ઉમેરો'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              ગ્રાહકનું પૂરું નામ *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="દા.ત. રમેશભાઈ પટેલ"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              10 અંકનો મોબાઈલ નંબર *
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="દા.ત. 9876543210"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
            <p className="text-[11px] text-slate-500 mt-1">આ નંબરથી ગ્રાહક લૉગિન કરી શકશે.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              ગ્રાહક લૉગિન PIN (4 અંક)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={4}
                pattern="[0-9]*"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder={editingCustomer ? 'બદલવો હોય તો જ લખો' : 'ડિફોલ્ટ 1234'}
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {editingCustomer ? 'નવો PIN નાખવો હોય તો 4 અંક લખો, અન્યથા ખાલી રાખો.' : 'ખાલી રાખશો તો ડિફોલ્ટ PIN 1234 રહેશે.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              સરનામું / વિસ્તાર (ઓપ્શનલ)
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="દા.ત. પ્લોટ નં. 12, સ્ટેશન રોડ"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'સાચવી રહ્યા છીએ...' : (editingCustomer ? 'સુધારો સાચવો' : 'ગ્રાહક ઉમેરો')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Customer Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="ગ્રાહકનું ખાતું કાઢી નાખવાની પુષ્ટિ"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            શું તમે ખરેખર આ ગ્રાહક અને તેમના તમામ ઉધાર/જમાની નોંધો હંમેશા માટે કાઢી નાખવા માંગો છો? આ ક્રિયા પાછી વાળી શકાશે નહીં.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
            >
              રદ કરો
            </button>
            <button
              onClick={() => handleDelete(deleteId)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm"
            >
              હા, ખાતું કાઢી નાખો
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
