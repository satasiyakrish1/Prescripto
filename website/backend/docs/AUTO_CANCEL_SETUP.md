# Auto-Cancellation System - Setup Guide

## Quick Setup

Follow these steps to set up the auto-cancellation system in your existing project.

## Step 1: Run Migration

Update existing appointments and users with new fields:

```bash
cd backend
node migrations/addAutoCancelFields.js
```

This will:
- Add `status`, `scheduledAt`, `autoCancelled` fields to all appointments
- Add `autoCancelCount`, `bookingBlockedUntil`, `lastAutoCancelDate` to all users

## Step 2: Verify Server Configuration

The scheduler is automatically initialized when the server starts. Check your server logs for:

```
Server started on PORT:4000
Auto-cancellation scheduler initialized
Auto-cancellation job scheduled for 23:59 IST daily
```

## Step 3: Test the System

### Option A: Manual API Test

Trigger the job manually via API:

```bash
curl -X POST http://localhost:4000/api/auto-cancel/trigger-job \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Option B: Run Test Suite

```bash
node backend/tests/autoCancelSystem.test.js
```

## Step 4: Verify Booking Restriction

Try to book an appointment with a blocked user:

```bash
curl -X POST http://localhost:4000/api/user/book-appointment \
  -H "Content-Type: application/json" \
  -H "token: USER_TOKEN" \
  -d '{
    "userId": "USER_ID",
    "docId": "DOCTOR_ID",
    "slotDate": "15_12_2024",
    "slotTime": "10:00 AM"
  }'
```

Expected response for blocked user:
```json
{
  "success": false,
  "blocked": true,
  "message": "Your booking privileges are temporarily suspended...",
  "blockUntil": "2026-01-15T00:00:00.000Z",
  "daysRemaining": 30
}
```

## Step 5: Monitor the System

### Check Auto-Cancel Statistics

```bash
curl -X GET http://localhost:4000/api/auto-cancel/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View Blocked Users

```bash
curl -X GET http://localhost:4000/api/auto-cancel/blocked-users \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View Auto-Cancelled Appointments

```bash
curl -X GET "http://localhost:4000/api/auto-cancel/appointments?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Configuration

### Adjust Scheduler Time

Edit `backend/services/appointmentScheduler.js`:

```javascript
// Change cron expression (currently 23:59 IST)
this.job = cron.schedule('59 18 * * *', async () => {
    // Job logic
}, {
    timezone: 'Asia/Kolkata'
});
```

### Adjust Penalty Threshold

Edit `backend/services/appointmentScheduler.js`:

```javascript
// Change from 5 to your desired threshold
if (user.autoCancelCount >= 5 && !user.bookingBlockedUntil) {
    // Block user
}
```

### Adjust Block Duration

Edit `backend/services/appointmentScheduler.js`:

```javascript
// Change from 1 month to your desired duration
const blockUntil = new Date();
blockUntil.setMonth(blockUntil.getMonth() + 1); // Change this
```

## Troubleshooting

### Scheduler Not Running

1. Check server logs for initialization message
2. Verify `node-cron` is installed: `npm list node-cron`
3. Check timezone configuration

### Appointments Not Being Cancelled

1. Verify `scheduledAt` field is set on appointments
2. Check date format in database
3. Run manual trigger to test: `POST /api/auto-cancel/trigger-job`

### Users Not Getting Blocked

1. Check `autoCancelCount` in user documents
2. Verify threshold logic (>= 5)
3. Check notification creation

### Notifications Not Appearing

1. Verify notification model exists
2. Check `recipientModel` is set to 'user'
3. Ensure user has notification permissions

## Admin Tools

### Unblock a User

```bash
curl -X POST http://localhost:4000/api/auto-cancel/unblock/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View User's Auto-Cancel History

```bash
curl -X GET http://localhost:4000/api/auto-cancel/user-history/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Integration with Frontend

### Check User Booking Status

```javascript
const checkBookingStatus = async (userId) => {
  const response = await fetch('/api/auto-cancel/booking-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'token': userToken
    },
    body: JSON.stringify({ userId })
  });
  
  const data = await response.json();
  
  if (data.isBlocked) {
    alert(`You are blocked until ${data.blockDate}`);
    return false;
  }
  
  return true;
};
```

### Display Auto-Cancel Count

```javascript
const displayUserStats = async (userId) => {
  const response = await fetch(`/api/auto-cancel/user-history/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  console.log(`Auto-cancellations: ${data.user.autoCancelCount}/5`);
  console.log(`Blocked: ${data.user.isBlocked}`);
};
```

## Production Deployment

### Environment Variables

Ensure these are set:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=production
```

### Monitoring

1. Set up logging for scheduler execution
2. Monitor auto-cancel statistics daily
3. Set up alerts for high auto-cancel rates
4. Review blocked users weekly

### Backup

Before deploying:
1. Backup your database
2. Test on staging environment
3. Run migration script
4. Verify scheduler starts correctly

## Support

For issues or questions:
- Check documentation: `/backend/docs/AUTO_CANCELLATION_SYSTEM.md`
- Review test file: `/backend/tests/autoCancelSystem.test.js`
- Contact development team

## Next Steps

1. ✅ Run migration
2. ✅ Test manually
3. ✅ Verify notifications
4. ✅ Monitor for 24 hours
5. ✅ Review statistics
6. ✅ Adjust thresholds if needed
