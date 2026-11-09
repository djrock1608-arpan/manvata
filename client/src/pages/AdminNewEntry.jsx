import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getTodayDateString } from '../utils/format';
import Toast from '../components/Toast';
import { 
  PlusCircle, 
  User, 
  Package, 
  Trash2, 
  Plus, 
  ShoppingCart, 
  Calendar, 
  Check, 
  ArrowRight,
  AlertCircle 
} from 'lucide-react';

export default function AdminNewEntry({ setActivePage, setSelectedCustomerId }) {
  const { apiFetch } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Form State
  const [selectedCustomerId, setCustomerId] = useState('');
  const [entryDate, setEntryDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');

  // Cart Items State for multi-item or single item
  const [cart, setCart] = useState([
    { id: 1, item_id: '', item_name: '', unit_price: '', quantity: 1, amount: 0 }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cList, iList] = await Promise.all([
          apiFetch('/api/customers'),
          apiFetch('/api/items')
        ]);
        setCustomers(cList);
        setItems(iList);
        if (cList.length > 0) {
          setCustomerId(cList[0].id.toString());
        }
      } catch (err) {
        setToast({ type: 'error', message: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update item in cart
  const handleItemSelect = (index, itemIdStr) => {
    const newCart = [...cart];
    if (itemIdStr === 'CUSTOM') {
      newCart[index] = {
        ...newCart[index],
        item_id: null,
        item_name: '',
        unit_price: '',
        amount: 0
      };
    } else {
      const selectedItem = items.find((i) => i.id === parseInt(itemIdStr));
      if (selectedItem) {
        const qty = parseFloat(newCart[index].quantity) || 1;
        newCart[index] = {
          ...newCart[index],
          item_id: selectedItem.id,
          item_name: selectedItem.name,
          unit_price: selectedItem.price,
          amount: qty * selectedItem.price
        };
      }
    }
    setCart(newCart);
  };

  const handleQtyChange = (index, qtyVal) => {
    const newCart = [...cart];
    const q = parseFloat(qtyVal) || 0;
    const price = parseFloat(newCart[index].unit_price) || 0;
    newCart[index].quantity = qtyVal;
    newCart[index].amount = q * price;
    setCart(newCart);
  };

  const handlePriceChange = (index, priceVal) => {
    const newCart = [...cart];
    const p = parseFloat(priceVal) || 0;
    const qty = parseFloat(newCart[index].quantity) || 0;
    newCart[index].unit_price = priceVal;
    newCart[index].amount = qty * p;
    setCart(newCart);
  };

  const handleCustomNameChange = (index, name) => {
    const newCart = [...cart];
    newCart[index].item_name = name;
    setCart(newCart);
  };

  const addItemRow = () => {
    setCart([
      ...cart,
      { id: Date.now(), item_id: '', item_name: '', unit_price: '', quantity: 1, amount: 0 }
    ]);
  };

  const removeItemRow = (index) => {
    if (cart.length === 1) return;
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const grandTotal = cart.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const selectedCustomerObj = customers.find((c) => c.id === parseInt(selectedCustomerId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setToast({ type: 'error', message: 'કૃપા કરીને ગ્રાહક પસંદ કરો.' });
      return;
    }

    // Validate cart
    for (const row of cart) {
      if (!row.item_name || row.item_name.trim() === '') {
        setToast({ type: 'error', message: 'દરેક વસ્તુનું નામ પસંદ કરો અથવા લખો.' });
        return;
      }
      if (!row.amount || row.amount <= 0) {
        setToast({ type: 'error', message: 'વસ્તુની રકમ 0 થી વધુ હોવી જોઈએ.' });
        return;
      }
    }

    setSubmitting(true);
    try {
      if (cart.length === 1) {
        // Single item entry
        const single = cart[0];
        await apiFetch('/api/entries', {
          method: 'POST',
          body: JSON.stringify({
            customer_id: parseInt(selectedCustomerId),
            type: 'UDHAR',
            item_id: single.item_id,
            item_name: single.item_name,
            quantity: single.quantity,
            unit_price: single.unit_price,
            amount: single.amount,
            notes,
            date: entryDate
          })
        });
      } else {
        // Multi-item batch bill
        await apiFetch('/api/entries', {
          method: 'POST',
          body: JSON.stringify({
            customer_id: parseInt(selectedCustomerId),
            type: 'UDHAR',
            items: cart.map((row) => ({
              item_id: row.item_id,
              item_name: row.item_name,
              quantity: row.quantity,
              unit_price: row.unit_price,
              amount: row.amount,
              notes
            })),
            notes,
            date: entryDate
          })
        });
      }

      setToast({
        type: 'success',
        message: `₹${grandTotal.toFixed(2)} ની ઉધાર નોંધ સફળતાપૂર્વક સાચવાઈ ગઈ!`
      });

      // Clear cart
      setCart([{ id: Date.now(), item_id: '', item_name: '', unit_price: '', quantity: 1, amount: 0 }]);
      setNotes('');

      // Redirect to customer detail after 800ms
      setTimeout(() => {
        if (setSelectedCustomerId) {
          setSelectedCustomerId(parseInt(selectedCustomerId));
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
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">નવી ઉધાર નોંધ</h2>
        <p className="text-sm text-slate-500">
          ગ્રાહક અને વસ્તુ પસંદ કરો, ભાવ અને જથ્થો આપોઆપ ગુણાઈને ખાતામાં ઉધાર થઈ જશે
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Customer Selection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-600" />
            1. ગ્રાહક પસંદ કરો *
          </label>

          {customers.length === 0 ? (
            <div className="p-4 bg-amber-50 rounded-xl text-xs text-amber-800">
              હજુ સુધી કોઈ ગ્રાહક નથી. પહેલા "ગ્રાહકો" પેજ પર જઈને નવો ગ્રાહક ઉમેરો.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <select
                value={selectedCustomerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - બાકી: ₹{c.balance}
                  </option>
                ))}
              </select>

              {selectedCustomerObj && (
                <div className="bg-slate-50 p-2.5 px-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">ગ્રાહકની હાલની બાકી રકમ:</span>
                  <span
                    className={`text-sm font-black ${
                      selectedCustomerObj.balance > 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatCurrency(selectedCustomerObj.balance)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Items / Cart List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-600" />
              2. સામાનની વિગત (ભાવ અને જથ્થો) *
            </label>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              બીજી વસ્તુ ઉમેરો
            </button>
          </div>

          <div className="space-y-3">
            {cart.map((row, idx) => (
              <div
                key={row.id}
                className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500">
                    વસ્તુ #{idx + 1}
                  </span>
                  {cart.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                      title="આ વસ્તુ કાઢી નાખો"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  {/* Item selector dropdown */}
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      વસ્તુ પસંદ કરો અથવા કસ્ટમ લખો
                    </label>
                    <select
                      value={row.item_id || (row.item_name ? 'CUSTOM' : '')}
                      onChange={(e) => handleItemSelect(idx, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- વસ્તુ પસંદ કરો --</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} - ₹{it.price}/{it.unit}
                        </option>
                      ))}
                      <option value="CUSTOM">✏️ અન્ય કોઈ નવી વસ્તુ લખો...</option>
                    </select>

                    {/* If custom or manual */}
                    {(!row.item_id || row.item_id === 'CUSTOM') && (
                      <input
                        type="text"
                        placeholder="વસ્તુનું નામ લખો (દા.ત. બિસ્કિટ, તેલ)"
                        value={row.item_name}
                        onChange={(e) => handleCustomNameChange(idx, e.target.value)}
                        className="mt-1.5 w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      જથ્થો (Qty)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={row.quantity}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Price */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      ભાવ (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={row.unit_price}
                      onChange={(e) => handlePriceChange(idx, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Total for this row */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      રકમ (₹) આપોઆપ
                    </label>
                    <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-right font-black text-slate-900 text-sm">
                      {formatCurrency(row.amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grand Total Box */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-900 block">કુલ ઉધાર રકમ:</span>
              <span className="text-xs text-amber-700">ભાવ × જથ્થો આપોઆપ ગણતરી</span>
            </div>
            <div className="text-2xl font-black text-amber-800">
              {formatCurrency(grandTotal)}
            </div>
          </div>
        </div>

        {/* Step 3: Date & Notes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                તારીખ
              </label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                નોંધ / વિગત (ઓપ્શનલ)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="દા.ત. સવારનો સામાન, ફોન કરીને મંગાવ્યો"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={submitting || grandTotal <= 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl shadow-md text-base font-bold text-white bg-red-600 hover:bg-red-700 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? 'નોંધાઈ રહ્યું છે...' : `ખાતામાં ₹${grandTotal.toFixed(2)} ઉધાર લખો`}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
