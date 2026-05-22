import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import csrf from 'csurf';
import validator from 'validator';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import winston from 'winston';
import { randomBytes } from 'node:crypto';
import process from 'node:process';

// Winston logger for security and auth events
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      handleExceptions: true
    })
  ]
});

// Morgan stream focused on failed/abusive requests
export const morganSecurity = morgan('combined', {
  skip: (req, res) => res.statusCode < 400,
  stream: {
    write: (message) => logger.warn(message.trim())
  }
});

// Global rate limiter to reduce abuse
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Stricter rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' }
});

// CSRF protection (cookie-based tokens). Clients send X-CSRF-Token header
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
});

// Input validation helpers using validator
export const validate = {
  email(input) {
    const value = String(input ?? '').trim();
    const normalized = validator.normalizeEmail(value, { gmail_remove_dots: false }) || '';
    if (!validator.isEmail(normalized)) throw new Error('Invalid email address');
    return normalized;
  },
  password(input) {
    const value = String(input ?? '');
    const ok = validator.isStrongPassword(value, {
      minLength: 10,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    });
    if (!ok) throw new Error('Password does not meet complexity requirements');
    return value;
  },
  safeString(input, { min = 1, max = 120 } = {}) {
    let value = String(input ?? '').trim();
    value = validator.stripLow(validator.escape(value), true);
    if (!validator.isLength(value, { min, max })) throw new Error('String length out of bounds');
    return value;
  },
  int(input, { min, max } = {}) {
    const value = String(input ?? '').trim();
    if (!validator.isInt(value, { min, max })) throw new Error('Invalid integer');
    return parseInt(value, 10);
  },
  oneOf(input, allowed = []) {
    const value = String(input ?? '').trim();
    if (!allowed.includes(value)) throw new Error('Value not allowed');
    return value;
  }
};

// Password hashing helpers (bcrypt)
export const passwordHasher = {
  async hash(plain) {
    const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
    return bcrypt.hash(plain, rounds);
  },
  async verify(plain, hash) {
    return bcrypt.compare(plain, hash);
  }
};

// Apply global security middleware to an Express app
export function applySecurity(app) {
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }

  // Parse cookies for CSRF cookie and other flows
  app.use(cookieParser());

  // Global rate limiter
  app.use(globalRateLimiter);

  // Sanitize request data to prevent NoSQL injection
  app.use(mongoSanitize());

  // Sanitize user input to prevent stored/reflected XSS
  app.use(xss());

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Add a small request ID for correlation
  app.use((req, _res, next) => {
    req.id = req.headers['x-request-id'] || cryptoRandomId();
    next();
  });

  // Security logging for failed/abusive requests
  app.use(morganSecurity);
}

// CSRF error translator (use after routes that mount csrfProtection)
export function csrfErrorHandler(err, _req, res, next) {
  if (err && err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid or missing CSRF token' });
  }
  return next(err);
}

function cryptoRandomId() {
  return randomBytes(8).toString('hex');
}


