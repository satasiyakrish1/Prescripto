# Zoho Flow Webhook Integration

## Overview
This integration automatically sends appointment-related data to Zoho Flow for automation workflows. All appointment events (booking confirmations, cancellations, payments, and completions) are sent in JSON format to your Zoho webhook endpoint.

## Setup Instructions

### 1. Add Webhook URL to Environment Variables
Add the following line to your `.env` file:

```env
ZOHO_WEBHOOK_URL=https://flow.zoho.in/60054140556/flow/webhook/incoming?zapikey=1001.5f4224cdd6e0666a6ecbf651ba23d963.6b89d745f66eb4f6fb9dc39434aaa3aa&isdebug=true
```

**Note:** The webhook URL is already configured in `backend/ADD_TO_ENV.txt`

### 2. Webhook Events
The system sends data for the following events:

1. **booking_confirmed** - When a new appointment is booked
2. **appointment_cancelled** - When an appointment is cancelled
3. **payment_completed** - When appointment payment is verified
4. **appointment_completed** - When doctor marks appointment as completed

## Webhook Payload Structure

All webhook requests contain the following JSON structure:

```json
{
  "event_type": "booking_confirmed",
  "timestamp": "2025-10-13T10:30:00.000Z",
  "appointment_id": "507f1f77bcf86cd799439011",
  "appointment_details": {
    // Patient Information
    "patient_name": "John Doe",
    "patient_email": "john.doe@example.com",
    "patient_phone": "+91 9876543210",
    
    // Doctor Information
    "doctor_name": "Dr. Jane Smith",
    "doctor_speciality": "Cardiologist",
    "doctor_email": "jane.smith@hospital.com",
    
    // Appointment Details
    "slot_date": "15_10_2025",
    "slot_time": "10:30 AM",
    "booking_date": "2025-10-13T10:15:00.000Z",
    "booking_mode": "default",
    "is_emergency": false,
    
    // Payment & Status
    "amount": 500,
    "currency": "INR",
    "payment_status": "paid",
    "is_cancelled": false,
    "is_completed": false,
    
    // Additional Info
    "custom_slot_id": null
  }
}
```

## Event Details

### 1. Booking Confirmed
**Event Type:** `booking_confirmed`  
**Triggered When:** New appointment is created  
**Controller:** `userController.js` → `bookAppointment()`  
**Payload Includes:** All appointment details with initial status

### 2. Appointment Cancelled
**Event Type:** `appointment_cancelled`  
**Triggered When:** User or admin cancels appointment  
**Controller:** `userController.js` → `cancelAppointment()`  
**Payload Includes:** Appointment details with `is_cancelled: true`

### 3. Payment Completed
**Event Type:** `payment_completed`  
**Triggered When:** Payment verification succeeds (Razorpay, Stripe, or Zoho)  
**Controllers:**
- `userController.js` → `verifyRazorpay()`
- `userController.js` → `verifyStripe()`
- `userController.js` → `verifyZoho()`  
**Payload Includes:** Appointment details with `payment_status: "paid"`

### 4. Appointment Completed
**Event Type:** `appointment_completed`  
**Triggered When:** Doctor marks appointment as completed  
**Controller:** `doctorController.js` → `appointmentComplete()`  
**Payload Includes:** Appointment details with `is_completed: true`

## Implementation Files

### Core Files
1. **`backend/utils/zohoWebhookService.js`**
   - Main webhook service with all helper functions
   - Handles HTTP POST requests to Zoho webhook
   - Includes error handling and logging

2. **`backend/controllers/userController.js`**
   - Integration in `bookAppointment()` - line ~293-303
   - Integration in `cancelAppointment()` - line ~360-367
   - Integration in payment verification functions

3. **`backend/controllers/doctorController.js`**
   - Integration in `appointmentComplete()` - line ~134-145

## Usage in Zoho Flow

In your Zoho Flow workflow, you can:

1. **Filter by Event Type**
   - Check `event_type` field to handle different events
   
2. **Extract Data**
   - Use `appointment_details.patient_email` for notifications
   - Use `appointment_details.doctor_name` for scheduling
   - Use `appointment_details.amount` for accounting

3. **Example Automations**
   - Send confirmation SMS/Email when `booking_confirmed`
   - Update CRM when `payment_completed`
   - Generate reports when `appointment_completed`
   - Trigger refund workflow when `appointment_cancelled`

## Testing

### Test Webhook with Sample Data
You can test the webhook manually using curl:

```bash
curl -X POST "https://flow.zoho.in/60054140556/flow/webhook/incoming?zapikey=1001.5f4224cdd6e0666a6ecbf651ba23d963.6b89d745f66eb4f6fb9dc39434aaa3aa&isdebug=true" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "booking_confirmed",
    "timestamp": "2025-10-13T10:30:00.000Z",
    "appointment_id": "test_appointment_123",
    "appointment_details": {
      "patient_name": "Test Patient",
      "patient_email": "test@example.com",
      "doctor_name": "Dr. Test",
      "amount": 500,
      "payment_status": "pending"
    }
  }'
```

### Check Logs
The webhook service logs all activities:
- **Success:** `Zoho webhook sent successfully for event: {event_type}`
- **Warning:** `Failed to send {event} to Zoho webhook: {error}`
- **Error:** `Error sending to Zoho webhook: {details}`

## Error Handling

The webhook integration is designed to be **non-blocking**:
- If webhook fails, the main operation (booking, cancellation, etc.) still succeeds
- Errors are logged but don't affect user experience
- 10-second timeout prevents hanging requests

## Security Considerations

1. **Webhook URL Security**
   - Keep your webhook URL in `.env` file
   - Never commit `.env` to version control
   - The URL includes an API key (`zapikey`) for authentication

2. **Data Privacy**
   - Only necessary appointment data is sent
   - Passwords and sensitive fields are excluded
   - Use HTTPS for secure transmission

## Troubleshooting

### Webhook Not Receiving Data
1. Check if `ZOHO_WEBHOOK_URL` is set in `.env`
2. Verify webhook URL is correct and active
3. Check backend logs for error messages
4. Test webhook URL manually with curl

### Data Not Appearing in Zoho Flow
1. Verify your Zoho Flow is active and published
2. Check if data structure matches your Flow configuration
3. Use `isdebug=true` parameter for testing
4. Check Zoho Flow execution history

### Common Errors
- **"Webhook URL not configured"** - Add `ZOHO_WEBHOOK_URL` to `.env`
- **Timeout errors** - Check your internet connection or Zoho service status
- **401/403 errors** - Verify the `zapikey` in webhook URL is valid

## Advanced Configuration

### Customize Webhook Payload
Edit `backend/utils/zohoWebhookService.js` and modify the `webhookPayload` object:

```javascript
const webhookPayload = {
  event_type: eventType,
  timestamp: new Date().toISOString(),
  // Add your custom fields here
  custom_field: 'custom_value'
};
```

### Add New Event Types
1. Create a new function in `zohoWebhookService.js`
2. Call it from the appropriate controller
3. Follow the existing pattern for error handling

## Support

For issues related to:
- **Webhook Service**: Check `backend/utils/zohoWebhookService.js`
- **Integration**: Check controller files mentioned above
- **Zoho Flow**: Contact Zoho support or check Zoho Flow documentation
