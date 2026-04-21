import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine candidate env files by environment
const devCandidates = [
  // Common dev files
  path.join(__dirname, '../.env.local'),
  path.join(__dirname, '../local.env'),
  path.join(__dirname, '../.env.development'),
  // Sometimes teams keep production-only values here; include as fallback for dev too
  path.join(__dirname, '../.env.producation'),
  path.join(__dirname, '../.env.production'),
  // Final fallback
  path.join(__dirname, '../.env')
];

const prodCandidates = [
  path.join(__dirname, '../.env.producation'), // legacy/typo support
  path.join(__dirname, '../.env.production'),
  path.join(__dirname, '../.env')
];

const isProd = process.env.NODE_ENV === 'production';
const candidates = isProd ? prodCandidates : devCandidates;

console.log('Initializing environment variables...');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Load the first existing env file
let loadedFrom = null;
for (const filePath of candidates) {
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath });
    loadedFrom = filePath;
    break;
  }
}

// As an extra safety, load .env as final fallback (won't overwrite existing keys)
const defaultEnv = path.join(__dirname, '../.env');
dotenv.config({ path: defaultEnv });

console.log(`Environment variables loaded from: ${loadedFrom || defaultEnv}`);
if (!process.env.ENV_FILE_LOADED) {
  process.env.ENV_FILE_LOADED = loadedFrom || defaultEnv;
}
