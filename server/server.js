require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize database
require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/entries', require('./routes/entries'));
app.use('/api/customer-portal', require('./routes/customer_portal'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ખાતાવહી (KhataVahi)',
    time: new Date().toISOString()
  });
});

// Serve static frontend build if client/dist exists
const distPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Express 5 compatible SPA fallback handler
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// 404 for unmatched API requests
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'આ API રૂટ અસ્તિત્વમાં નથી.' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'સર્વરમાં આંતરિક ક્ષતિ થઈ છે. ફરી પ્રયાસ કરો.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`  📖 ખાતાવહી (KhataVahi) Server Running!`);
  console.log(`  🚀 પોર્ટ: http://localhost:${PORT}`);
  console.log(`  🔒 સુરક્ષિત બેકએન્ડ + ડેટાબેઝ સક્રિય છે`);
  console.log(`===============================================`);
});
