const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Define the Doctor schema
const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  specialization: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Doctor = mongoose.model('Doctor', doctorSchema);

const sampleDoctors = [
  {
    name: 'Dr. John Smith',
    email: 'john.smith@example.com',
    specialization: 'Cardiology',
    password: 'password123',
    phoneNumber: '+1234567890',
    address: '123 Medical Center Dr.'
  },
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@example.com',
    specialization: 'Pediatrics',
    password: 'password123',
    phoneNumber: '+1234567891',
    address: '456 Healthcare Ave.'
  },
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@example.com',
    specialization: 'Neurology',
    password: 'password123',
    phoneNumber: '+1234567892',
    address: '789 Hospital Blvd.'
  },
  {
    name: 'Dr. Emily Brown',
    email: 'emily.brown@example.com',
    specialization: 'Dermatology',
    password: 'password123',
    phoneNumber: '+1234567893',
    address: '321 Clinic St.'
  }
];

const seedDoctors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing doctors
    await Doctor.deleteMany({});
    console.log('Cleared existing doctors');

    // Hash passwords and create doctors
    const doctorsWithHashedPasswords = await Promise.all(
      sampleDoctors.map(async (doctor) => {
        const hashedPassword = await bcrypt.hash(doctor.password, 10);
        return { ...doctor, password: hashedPassword };
      })
    );

    // Insert new doctors
    const createdDoctors = await Doctor.insertMany(doctorsWithHashedPasswords);
    console.log('Successfully added sample doctors:', createdDoctors.map(d => d.name).join(', '));

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding doctors:', error);
    process.exit(1);
  }
};

seedDoctors(); 