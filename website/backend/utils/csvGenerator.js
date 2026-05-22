// Utility function to generate CSV data from appointments
const generateAppointmentsCSV = (appointments) => {
  // CSV header
  let csvContent = 'ID,Patient Name,Patient Email,Doctor Name,Doctor Speciality,Appointment Date,Appointment Time,Amount,Status\n';
  
  // Add each appointment as a row
  appointments.forEach(appointment => {
    const status = appointment.cancelled ? 'Cancelled' : appointment.isCompleted ? 'Completed' : 'Scheduled';
    
    // Format each field and escape commas in text fields
    const row = [
      appointment._id,
      `"${appointment.userData.name}"`,
      `"${appointment.userData.email}"`,
      `"${appointment.docData.name}"`,
      `"${appointment.docData.speciality}"`,
      appointment.slotDate,
      appointment.slotTime,
      appointment.amount,
      status
    ].join(',');
    
    csvContent += row + '\n';
  });
  
  return csvContent;
};

export { generateAppointmentsCSV };