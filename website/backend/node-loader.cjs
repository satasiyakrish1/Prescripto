// CommonJS Buffer polyfill for Node.js v25+
// This file uses CommonJS to ensure it loads before any ES modules

const { Buffer: BufferPolyfill } = require('buffer');

// Set on global
if (typeof global.Buffer === 'undefined') {
    global.Buffer = BufferPolyfill;
}

// Set on globalThis
if (typeof globalThis.Buffer === 'undefined') {
    globalThis.Buffer = BufferPolyfill;
}

// CRITICAL: Also make Buffer available as a global variable
// This is needed for legacy packages that expect Buffer to be globally available
if (typeof Buffer === 'undefined') {
    global.Buffer = BufferPolyfill;
    // Force it into the global scope
    Object.defineProperty(global, 'Buffer', {
        value: BufferPolyfill,
        writable: false,
        enumerable: false,
        configurable: false
    });
}

console.log('✅ Global Buffer polyfill applied (CommonJS loader)');
console.log('Buffer is now:', typeof Buffer !== 'undefined' ? 'defined' : 'STILL UNDEFINED');

