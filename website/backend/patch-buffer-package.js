// Patch for buffer-equal-constant-time to work with Node.js v25+
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const targetFile = path.join(__dirname, 'node_modules', 'buffer-equal-constant-time', 'index.js');

if (fs.existsSync(targetFile)) {
    let content = fs.readFileSync(targetFile, 'utf8');

    // Check if already patched
    if (!content.includes('// PATCHED FOR NODE v25+')) {
        // Add Buffer polyfill at the top of the file
        const patch = `// PATCHED FOR NODE v25+
if (typeof Buffer === 'undefined') {
    global.Buffer = require('buffer').Buffer;
}

`;
        content = patch + content;
        fs.writeFileSync(targetFile, content, 'utf8');
        console.log('✅ Patched buffer-equal-constant-time for Node.js v25+');
    } else {
        console.log('ℹ️ buffer-equal-constant-time already patched');
    }
} else {
    console.log('⚠️ buffer-equal-constant-time not found, skipping patch');
}
