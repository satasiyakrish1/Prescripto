// Node.js v25+ compatibility fix for Buffer
// This must run before any other imports that depend on global Buffer
import { Buffer } from 'buffer';

// Force set global.Buffer for legacy packages
if (typeof global !== 'undefined') {
    global.Buffer = Buffer;
    console.log('✅ Global Buffer polyfill applied for Node.js v25+');
}

// Also set it on globalThis for maximum compatibility
if (typeof globalThis !== 'undefined') {
    globalThis.Buffer = Buffer;
}
