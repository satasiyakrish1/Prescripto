// Test script for booking modes functionality
import mongoose from 'mongoose';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';

// Connect to MongoDB (replace with your connection string)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/prescripto';

async function testBookingModes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test 1: Create a doctor with booking settings
    console.log('\n=== Test 1: Creating doctor with booking settings ===');
    const testDoctor = new doctorModel({
      name: 'Dr. Test Booking',
      email: 'test.booking@example.com',
      password: 'hashedpassword',
      image: 'https://example.com/image.jpg',
      speciality: 'Cardiology',
      degree: 'MBBS, MD',
      experience: '10 years',
      about: 'Test doctor for booking modes',
      available: true,
      fees: 1000,
      slots_booked: {},
      address: { line1: 'Test Address', line2: 'Test City' },
      date: Date.now(),
      bookingMode: 'instant',
      customSlots: [
        {
          id: 'slot1',
          startTime: '09:00',
          endTime: '09:30',
          price: 1200,
          isPaymentRequired: true
        },
        {
          id: 'slot2',
          startTime: '14:00',
          endTime: '14:30',
          price: 1500,
          isPaymentRequired: true
        }
      ],
      emergencyFee: 1500,
      instantBookingSettings: {
        enabled: true,
        normalFee: 1000,
        emergencyFeeMultiplier: 1.5
      }
    });

    const savedDoctor = await testDoctor.save();
    console.log('✅ Doctor created with booking settings:', {
      id: savedDoctor._id,
      bookingMode: savedDoctor.bookingMode,
      customSlots: savedDoctor.customSlots.length,
      emergencyFee: savedDoctor.emergencyFee
    });

    // Test 2: Test instant booking
    console.log('\n=== Test 2: Testing instant booking ===');
    const instantAppointment = new appointmentModel({
      userId: 'test-user-id',
      docId: savedDoctor._id.toString(),
      slotDate: 'instant',
      slotTime: 'instant',
      userData: { name: 'Test User', email: 'user@example.com' },
      docData: { name: savedDoctor.name, email: savedDoctor.email },
      amount: savedDoctor.fees,
      date: Date.now(),
      bookingMode: 'instant',
      isEmergency: false
    });

    const savedInstantAppointment = await instantAppointment.save();
    console.log('✅ Instant appointment created:', {
      id: savedInstantAppointment._id,
      bookingMode: savedInstantAppointment.bookingMode,
      amount: savedInstantAppointment.amount
    });

    // Test 3: Test emergency booking
    console.log('\n=== Test 3: Testing emergency booking ===');
    const emergencyAppointment = new appointmentModel({
      userId: 'test-user-id-2',
      docId: savedDoctor._id.toString(),
      slotDate: 'instant',
      slotTime: 'instant',
      userData: { name: 'Emergency User', email: 'emergency@example.com' },
      docData: { name: savedDoctor.name, email: savedDoctor.email },
      amount: savedDoctor.emergencyFee,
      date: Date.now(),
      bookingMode: 'instant',
      isEmergency: true
    });

    const savedEmergencyAppointment = await emergencyAppointment.save();
    console.log('✅ Emergency appointment created:', {
      id: savedEmergencyAppointment._id,
      bookingMode: savedEmergencyAppointment.bookingMode,
      isEmergency: savedEmergencyAppointment.isEmergency,
      amount: savedEmergencyAppointment.amount
    });

    // Test 4: Test custom slot booking
    console.log('\n=== Test 4: Testing custom slot booking ===');
    const customAppointment = new appointmentModel({
      userId: 'test-user-id-3',
      docId: savedDoctor._id.toString(),
      slotDate: 'custom_slot1',
      slotTime: '09:00',
      userData: { name: 'Custom User', email: 'custom@example.com' },
      docData: { name: savedDoctor.name, email: savedDoctor.email },
      amount: 1200,
      date: Date.now(),
      bookingMode: 'custom',
      customSlotId: 'slot1'
    });

    const savedCustomAppointment = await customAppointment.save();
    console.log('✅ Custom slot appointment created:', {
      id: savedCustomAppointment._id,
      bookingMode: savedCustomAppointment.bookingMode,
      customSlotId: savedCustomAppointment.customSlotId,
      amount: savedCustomAppointment.amount
    });

    // Test 5: Fetch doctor with booking settings
    console.log('\n=== Test 5: Fetching doctor with booking settings ===');
    const fetchedDoctor = await doctorModel.findById(savedDoctor._id);
    console.log('✅ Doctor fetched with booking settings:', {
      bookingMode: fetchedDoctor.bookingMode,
      customSlots: fetchedDoctor.customSlots.length,
      emergencyFee: fetchedDoctor.emergencyFee,
      instantBookingSettings: fetchedDoctor.instantBookingSettings
    });

    // Test 6: Fetch appointments with booking modes
    console.log('\n=== Test 6: Fetching appointments with booking modes ===');
    const appointments = await appointmentModel.find({ docId: savedDoctor._id.toString() });
    console.log('✅ Appointments fetched:', appointments.map(apt => ({
      id: apt._id,
      bookingMode: apt.bookingMode,
      isEmergency: apt.isEmergency,
      customSlotId: apt.customSlotId,
      amount: apt.amount
    })));

    console.log('\n🎉 All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testBookingModes(); 