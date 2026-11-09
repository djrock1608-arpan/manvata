import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { Settings, Lock, Store, Phone, ShieldCheck, Check } from 'lucide-react';

export default function AdminSettings() {
  const { apiFetch, user, updateUser } = useAuth();
  const [toast, setToast] = useState(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Shop profile state
  const [shopName, setShopName] = useState(user?.shop_name || '');
  const [shopPhone, setShopPhone] = useState(user?.phone || '');
  const [submittingProfile, setSubmittingProfile] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'નવો પાસવર્ડ અને કન્ફર્મ પાસવર્ડ મેળ ખાતા નથી.' });
      return;
    }

    if (newPassword.length < 4) {
      setToast({ type: 'error', message: 'પાસવર્ડ ઓછામાં ઓછો 4 અક્ષરનો હોવો જોઈએ.' });
      return;
    }

    setSubmittingPassword(true);
    try {
      const res = await apiFetch('/api/auth/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setToast({ type: 'success', message: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleProfileChange = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);
    try {
      const res = await apiFetch('/api/auth/admin/profile', {
        method: 'PUT',
        body: JSON.stringify({ shop_name: shopName, phone: shopPhone })
      });
      updateUser({ shop_name: shopName, phone: shopPhone });
      setToast({ type: 'success', message: res.message });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmittingProfile(false);
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
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">દુકાન અને ખાતાની સેટિંગ્સ</h2>
        <p className="text-sm text-slate-500">
          દુકાનનું નામ અને એડમિન પાસવર્ડ બદલવાની સુવિધા
        </p>
      </div>

      {/* Card 1: Shop Profile Info */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Store className="w-5 h-5 text-amber-600" />
          દુકાનની વિગતો
        </h3>

        <form onSubmit={handleProfileChange} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              દુકાનનું નામ *
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="દા.ત. શ્રી ગણેશ પ્રોવિઝન સ્ટોર"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
            <p className="text-[11px] text-slate-500 mt-1">આ નામ ગ્રાહકના પોર્ટલ અને WhatsApp મેસેજમાં દેખાશે.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              દુકાનદારનો મોબાઈલ નંબર
            </label>
            <input
              type="tel"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              placeholder="દા.ત. 9898098980"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submittingProfile}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {submittingProfile ? 'સાચવી રહ્યા છીએ...' : 'દુકાનની વિગતો સાચવો'}
            </button>
          </div>
        </form>
      </div>

      {/* Card 2: Change Password */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-600" />
          એડમિન પાસવર્ડ બદલો
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              હાલનો જૂનો પાસવર્ડ *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                નવો પાસવર્ડ *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="ઓછામાં ઓછા 4 અક્ષર"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                નવો પાસવર્ડ ફરીથી લખો *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="કન્ફર્મ કરો"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submittingPassword}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {submittingPassword ? 'બદલાઈ રહ્યો છે...' : 'પાસવર્ડ બદલો'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
