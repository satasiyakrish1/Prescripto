// Script to seed pharmacy inventory for testing
import mongoose from 'mongoose';
import Medicine from '../models/Medicine.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prescripto';

// Replace with a valid pharmacy ObjectId from your database
const pharmacyId = 'REPLACE_WITH_PHARMACY_OBJECT_ID';

const medicines = [
  {
    name: 'Paracetamol',
    category: 'Pain Relief',
    stock: 100,
    price: 10,
    expiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180), // 6 months from now
    description: 'Pain reliever and fever reducer',
    manufacturer: 'Acme Pharma',
    batchNumber: 'BATCH001',
    minStockLevel: 10,
    pharmacyId,
  },
  {
    name: 'Amoxicillin',
    category: 'Antibiotics',
    stock: 50,
    price: 25,
    expiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 3 months from now
    description: 'Antibiotic for bacterial infections',
    manufacturer: 'Beta Labs',
    batchNumber: 'BATCH002',
    minStockLevel: 5,
    pharmacyId,
  },
  {
    name: 'Cetirizine',
    category: 'Allergy',
    stock: 200,
    price: 5,
    expiry: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year from now
    description: 'Antihistamine for allergy relief',
    manufacturer: 'Gamma Pharma',
    batchNumber: 'BATCH003',
    minStockLevel: 20,
    pharmacyId,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    await Medicine.deleteMany({ pharmacyId });
    await Medicine.insertMany(medicines);
    console.log('Pharmacy inventory seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed(); 