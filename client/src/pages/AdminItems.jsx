import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { Package, Plus, Search, Edit2, Trash2, Tag, RefreshCw } from 'lucide-react';

export default function AdminItems() {
  const { apiFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', unit: 'નંગ' });
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const url = search ? `/api/items?search=${encodeURIComponent(search)}` : '/api/items';
      const data = await apiFetch(url);
      setItems(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', price: '', unit: 'નંગ' });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name, price: item.price, unit: item.unit || 'નંગ' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        await apiFetch(`/api/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setToast({ type: 'success', message: 'વસ્તુ સફળતાપૂર્વક સુધારાઈ ગઈ.' });
      } else {
        await apiFetch('/api/items', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setToast({ type: 'success', message: 'નવી વસ્તુ સફળતાપૂર્વક ઉમેરાઈ ગઈ.' });
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/api/items/${id}`, { method: 'DELETE' });
      setToast({ type: 'success', message: 'વસ્તુ સફળતાપૂર્વક કાઢી નાખવામાં આવી.' });
      setDeleteId(null);
      fetchItems();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const standardUnits = ['નંગ', 'લીટર', 'કિલો', 'ગ્રામ', 'પેકેટ', 'ડબ્બો', 'બોટલ', 'મીટર'];

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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">દુકાનની વસ્તુઓ અને ભાવ</h2>
          <p className="text-sm text-slate-500">
            અહીં સામાનનું નામ અને કિંમત સેટ કરો જેથી ઉધાર લખતી વખતે ભાવ આપોઆપ આવી જાય
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          નવી વસ્તુ ઉમેરો
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="વસ્તુ શોધો... (દા.ત. દૂધ, ખાંડ, તેલ)"
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 px-2 shrink-0">
          કુલ {items.length} વસ્તુઓ
        </span>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">વસ્તુઓ લોડ થઈ રહી છે...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700">કોઈ વસ્તુ મળી નથી</h4>
            <p className="text-sm text-slate-500 mt-1">નવી વસ્તુ ઉમેરવા માટે ઉપરનું બટન દબાવો.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:gap-4 p-3 sm:p-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50/70 hover:bg-amber-50/40 rounded-xl border border-slate-200/60 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base">{item.name}</h4>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="text-amber-800 font-extrabold text-sm">
                        {formatCurrency(item.price)}
                      </span>
                      <span>/ {item.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    title="સુધારો"
                    className="p-2 text-slate-500 hover:text-amber-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(item.id)}
                    title="કાઢી નાખો"
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'વસ્તુની વિગતો સુધારો' : 'નવી વસ્તુ ઉમેરો'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              વસ્તુનું નામ *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="દા.ત. અમૂલ તાઝા દૂધ"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                ભાવ / કિંમત (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="દા.ત. 60"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                એકમ (Unit)
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
              >
                {standardUnits.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
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
              {submitting ? 'સાચવી રહ્યા છીએ...' : (editingItem ? 'સુધારો સાચવો' : 'વસ્તુ ઉમેરો')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="વસ્તુ કાઢી નાખવાની પુષ્ટિ"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            શું તમે ખરેખર આ વસ્તુ કાઢી નાખવા માંગો છો? જૂની ખાતાવહીની નોંધો પર આની કોઈ ખરાબ અસર થશે નહીં.
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
              હા, કાઢી નાખો
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
