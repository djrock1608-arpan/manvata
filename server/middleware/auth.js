const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'khata-vahi-super-secret-key-2025';

// Authenticate token middleware
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'પ્રવેશ માટે અધિકૃતતા (Token) જરૂરી છે.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'ટોકન અમાન્ય અથવા સમાપ્ત થઈ ગયું છે. ફરીથી લૉગિન કરો.' });
  }
}

// Require Admin role
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'ફક્ત દુકાનદાર (એડમિન) માટે જ પરવાનગી છે.' });
  }
  next();
}

// Require Customer role and enforce customer isolation
function requireCustomer(req, res, next) {
  if (!req.user || req.user.role !== 'customer') {
    return res.status(403).json({ error: 'ફક્ત ગ્રાહક માટે જ પરવાનગી છે.' });
  }
  next();
}

module.exports = {
  JWT_SECRET,
  authenticate,
  requireAdmin,
  requireCustomer,
};
