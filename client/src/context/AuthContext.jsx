import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('khata_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('khata_token') || null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Verify token with backend
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Expired');
          return res.json();
        })
        .then(data => {
          setUser(data.user);
          localStorage.setItem('khata_user', JSON.stringify(data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginAdmin = async (username, password) => {
    const res = await fetch('/api/auth/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'લૉગિન નિષ્ફળ રહ્યું.');
    }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('khata_token', data.token);
    localStorage.setItem('khata_user', JSON.stringify(data.user));
    return data.user;
  };

  const loginCustomer = async (phone, pin) => {
    const res = await fetch('/api/auth/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'લૉગિન નિષ્ફળ રહ્યું.');
    }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('khata_token', data.token);
    localStorage.setItem('khata_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('khata_token');
    localStorage.removeItem('khata_user');
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem('khata_user', JSON.stringify(merged));
  };

  // Helper fetch with auth header
  const apiFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };

    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      logout();
      throw new Error('લૉગિન સમાપ્ત થઈ ગયું છે. કૃપા કરીને ફરી લૉગિન કરો.');
    }

    if (!res.ok) {
      throw new Error(data.error || 'ક્ષતિ આવી છે.');
    }

    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin: user?.role === 'admin',
        isCustomer: user?.role === 'customer',
        loginAdmin,
        loginCustomer,
        logout,
        updateUser,
        apiFetch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
