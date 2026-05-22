import { Vonage } from '@vonage/server-sdk';

// Initialize Vonage client
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY || '',
  apiSecret: process.env.VONAGE_API_SECRET || '',
  privateKey: process.env.VONAGE_PRIVATE_KEY || 'dummy_path'
});

/**
 * Format phone number to international format
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Add country code if not present
  if (!cleaned.startsWith('91')) {
    return `91${cleaned}`;
  }
  return cleaned;
};

/**
 * Send appointment confirmation SMS to patient
 * @param {Object} appointmentDetails - Details of the appointment
 * @returns {Promise<void>}
 */
export const sendAppointmentConfirmationSMS = async (appointmentDetails) => {
  try {
    const { userData, docData, slotDate, slotTime } = appointmentDetails;

    // Format the date for SMS
    const [day, month, year] = slotDate.split('_');
    const formattedDate = `${day}/${month}/${year}`;

    // Prepare SMS content
    const message = `Dear ${userData.name}, your appointment with Dr. ${docData.name} is confirmed for ${formattedDate} at ${slotTime}. Location: ${docData.address.line1}, ${docData.address.line2}. - Prescripto`;

    // Send SMS only if user has a phone number
    if (userData.phone) {
      const to = formatPhoneNumber(userData.phone);
      const from = "Prescripto";

      await vonage.sms.send({ to, from, text: message })
        .then(resp => {
          console.log('Appointment confirmation SMS sent successfully');
          console.log(resp);
        })
        .catch(err => {
          console.error('Error sending appointment confirmation SMS:', err);
          // Don't throw error to prevent appointment booking failure
        });
    }
  } catch (error) {
    console.error('SMS Service Error:', error);
    // Don't throw error to prevent appointment booking failure
  }
};

/**
 * Send appointment reminder SMS to patient
 * @param {Object} appointmentDetails - Details of the appointment
 * @returns {Promise<void>}
 */
export const sendAppointmentReminderSMS = async (appointmentDetails) => {
  try {
    const { userData, docData, slotDate, slotTime } = appointmentDetails;

    // Format the date for SMS
    const [day, month, year] = slotDate.split('_');
    const formattedDate = `${day}/${month}/${year}`;

    // Prepare reminder message
    const message = `Reminder: Dear ${userData.name}, you have an appointment tomorrow with Dr. ${docData.name} at ${slotTime}. Location: ${docData.address.line1}. Please arrive 10 minutes early. - Prescripto`;

    // Send SMS only if user has a phone number
    if (userData.phone) {
      const to = formatPhoneNumber(userData.phone);
      const from = "Prescripto";

      await vonage.sms.send({ to, from, text: message })
        .then(resp => {
          console.log('Appointment reminder SMS sent successfully');
          console.log(resp);
        })
        .catch(err => {
          console.error('Error sending appointment reminder SMS:', err);
        });
    }
  } catch (error) {
    console.error('SMS Reminder Service Error:', error);
  }
};