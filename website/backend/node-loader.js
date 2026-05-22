// Node.js v25+ compatibility loader
// This file must be loaded with --import flag before the main application

import { Buffer } from 'buffer';

// Polyfill global Buffer for Node.js v25+
if (!global.Buffer) {
    global.Buffer = Buffer;
}

if (!globalThis.Buffer) {
    globalThis.Buffer = Buffer;
}

console.log('✅ Node.js v25+ Buffer polyfill loaded');
