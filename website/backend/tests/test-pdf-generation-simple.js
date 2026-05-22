import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing PDF Generation...\n');

try {
    // Test 1: Create a simple PDF
    console.log('Test 1: Creating simple PDF...');
    const doc = new jsPDF();
    doc.text('Hello World!', 10, 10);
    
    // Test 2: Get PDF as buffer
    console.log('Test 2: Converting to buffer...');
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    console.log(`✅ Buffer created: ${pdfBuffer.length} bytes`);
    
    // Test 3: Save to file
    console.log('Test 3: Saving to file...');
    const testDir = path.join(__dirname, 'uploads', 'pdf-files');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    
    const testFile = path.join(testDir, 'test-pdf.pdf');
    fs.writeFileSync(testFile, pdfBuffer);
    console.log(`✅ File saved: ${testFile}`);
    
    // Test 4: Verify file exists
    console.log('Test 4: Verifying file...');
    if (fs.existsSync(testFile)) {
        const stats = fs.statSync(testFile);
        console.log(`✅ File exists: ${stats.size} bytes`);
        
        // Clean up
        fs.unlinkSync(testFile);
        console.log('✅ Test file deleted');
    }
    
    console.log('\n🎉 All tests passed!');
    console.log('PDF generation is working correctly.');
    
} catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
