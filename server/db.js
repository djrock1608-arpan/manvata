const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'khata.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
function initDB() {
  // Admins table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      shop_name TEXT DEFAULT 'મારી દુકાન - ખાતાવહી',
      phone TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Customers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      pin_hash TEXT NOT NULL,
      address TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      unit TEXT DEFAULT 'નંગ',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Entries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
      item_name TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('UDHAR', 'JAMA')),
      payment_mode TEXT DEFAULT 'CASH',
      notes TEXT DEFAULT '',
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Indexes for high performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_entries_customer_id ON entries(customer_id);
    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  `);

  // Seed default admin if none exists
  const adminCheck = db.prepare('SELECT COUNT(*) as count FROM admins').get();
  if (!adminCheck || adminCheck.count === 0) {
    const defaultPasswordHash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO admins (username, password_hash, shop_name, phone)
      VALUES (?, ?, ?, ?)
    `).run('admin', defaultPasswordHash, 'શ્રી ગણેશ પ્રોવિઝન સ્ટોર', '9898098980');
    console.log('✅ Default Admin created: username="admin", password="admin123"');
  }

  // Seed standard grocery items if none exists
  const itemsCheck = db.prepare('SELECT COUNT(*) as count FROM items').get();
  if (!itemsCheck || itemsCheck.count === 0) {
    const defaultItems = [
      { name: 'દૂધ (અમૂલ ગોલ્ડ)', price: 66, unit: 'લીટર' },
      { name: 'દૂધ (અમૂલ તાઝા)', price: 54, unit: 'લીટર' },
      { name: 'ખાંડ (ઉત્તમ)', price: 42, unit: 'કિલો' },
      { name: 'ચા પત્તી (વાઘ બકરી)', price: 130, unit: 'પેકેટ (250g)' },
      { name: 'સિંગતેલ (ડબ્બો/કિલો)', price: 160, unit: 'લીટર' },
      { name: 'કપાસિયા તેલ', price: 135, unit: 'લીટર' },
      { name: 'ઘઉંનો લોટ', price: 38, unit: 'કિલો' },
      { name: 'ચોખા (બાસમતી/જીરાસાર)', price: 55, unit: 'કિલો' },
      { name: 'તુવેર દાળ', price: 150, unit: 'કિલો' },
      { name: 'મગ દાળ', price: 120, unit: 'કિલો' },
      { name: 'મીઠું (ટાટા સોલ્ટ)', price: 28, unit: 'પેકેટ' },
      { name: 'સાબુ (લાઈફબોય/ડવ)', price: 35, unit: 'નંગ' },
      { name: 'શેમ્પૂ', price: 5, unit: 'પાઉચ' },
      { name: 'બિસ્કિટ (પાર્લે-જી)', price: 10, unit: 'પેકેટ' }
    ];

    const insertItem = db.prepare('INSERT INTO items (name, price, unit) VALUES (?, ?, ?)');
    for (const it of defaultItems) {
      insertItem.run(it.name, it.price, it.unit);
    }
    console.log(`✅ ${defaultItems.length} default items seeded.`);
  }

  // Seed demo customer if none exists
  const customerCheck = db.prepare('SELECT COUNT(*) as count FROM customers').get();
  if (!customerCheck || customerCheck.count === 0) {
    const pinHash = bcrypt.hashSync('1234', 10);
    const today = new Date().toISOString().split('T')[0];

    const res = db.prepare(`
      INSERT INTO customers (name, phone, pin_hash, address)
      VALUES (?, ?, ?, ?)
    `).run('રમેશભાઈ પટેલ', '9876543210', pinHash, 'પ્લોટ નં. 12, સ્ટેશન રોડ');

    const customerId = res.lastInsertRowid;

    // Add 2 sample entries
    db.prepare(`
      INSERT INTO entries (customer_id, item_name, quantity, unit_price, amount, type, notes, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(customerId, 'દૂધ (અમૂલ ગોલ્ડ)', 2, 66, 132, 'UDHAR', 'સવારનું દૂધ', today);

    db.prepare(`
      INSERT INTO entries (customer_id, item_name, quantity, unit_price, amount, type, notes, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(customerId, 'ખાંડ (ઉત્તમ)', 2, 42, 84, 'UDHAR', 'સાંજનો સામાન', today);

    db.prepare(`
      INSERT INTO entries (customer_id, item_name, quantity, unit_price, amount, type, payment_mode, notes, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(customerId, 'રોકડ જમા', 1, 100, 100, 'JAMA', 'CASH', 'ગૂગલ પે દ્વારા જમા', today);

    console.log('✅ Demo Customer created: Phone="9876543210", PIN="1234"');
  }
}

initDB();

module.exports = db;
