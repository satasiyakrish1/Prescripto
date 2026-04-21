# Auto-Cancellation and Penalty System

## Overview

This system automatically cancels appointments where patients don't show up and implements a penalty system to discourage no-shows.

## Features

### 1. Auto-Cancellation Logic
- **Schedule**: Runs daily at 23:59 IST
- **Target**: Appointments scheduled for the current day (00:00-23:59 IST) with status "booked" and not completed
- **Action**: Updates appointments to:
  - `status = "auto_cancelled"`
  - `autoCancelled = true`
  - `autoCancelReason = "no-show-end-of-day"`
  - `autoCancelledAt = current timestamp`

### 2. User Penalty System
- Each auto-cancelled appointment increments the user's `autoCancelCount`
- When a user reaches **5 auto-cancellations**:
  - User is blocked from booking for **1 month**
  - `bookingBlockedUntil` is set to current date + 1 month
  - Block notification is sent to the user

### 3. Booking Restrictions
- Middleware checks if `bookingBlockedUntil > now`
- Blocked users receive a clear error message with:
  - Block expiration date
  - Days remaining
  - Reason for block
- Block automatically expires after the duration

### 4. Notifications
- **Auto-cancellation notification**: Sent for each cancelled appointment
- **Block notification**: Sent when user is blocked (5 auto-cancels)
- **Unblock notification**: Can be sent when privileges are restored
- All notifications appear in the user's notification page

## Database Schema Updates

### Appointment Model
```javascript
{
  status: { 
    type: String, 
    enum: ['booked', 'completed', 'cancelled', 'auto_cancelled'], 
    default: 'booked' 
  },
  autoCancelled: { type: Boolean, default: false },
  autoCancelReason: { 
    type: String, 
    enum: ['no-show-end-of-day', 'doctor-unavailable', 'system-error', null],
    default: null 
  },
  autoCancelledAt: { type: Date, default: null },
  scheduledAt: { type: Date, required: true } // IST timestamp
}
```

### User Model
```javascript
{
  autoCancelCount: { type: Number, default: 0 },
  bookingBlockedUntil: { type: Date, default: null },
  lastAutoCancelDate: { type: Date, default: null }
}
```

## API Endpoints

### User Endpoints

#### Check Booking Status
```
POST /api/auto-cancel/booking-status
Body: { userId: "user_id" }
Response: {
  success: true,
  autoCancelCount: 3,
  isBlocked: false,
  canBook: true
}
```

#### Get User Auto-Cancel History
```
GET /api/auto-cancel/user-history/:userId
Response: {
  success: true,
  user: { ... },
  appointments: [...],
  total: 3
}
```

### Admin Endpoints

#### Get Auto-Cancelled Appointments
```
GET /api/auto-cancel/appointments?page=1&limit=20&userId=xxx&startDate=xxx&endDate=xxx
Response: {
  success: true,
  appointments: [...],
  totalPages: 5,
  currentPage: 1,
  total: 100
}
```

#### Get Blocked Users
```
GET /api/auto-cancel/blocked-users
Response: {
  success: true,
  users: [...],
  count: 10
}
```

#### Unblock User
```
POST /api/auto-cancel/unblock/:userId
Response: {
  success: true,
  message: "User unblocked successfully"
}
```

#### Get Statistics
```
GET /api/auto-cancel/stats?startDate=xxx&endDate=xxx
Response: {
  success: true,
  stats: {
    totalAutoCancelled: 150,
    currentlyBlocked: 10,
    usersWithAutoCancels: 45,
    reasonDistribution: [...]
  }
}
```

#### Trigger Auto-Cancel Job Manually
```
POST /api/auto-cancel/trigger-job
Response: {
  success: true,
  message: "Auto-cancellation job executed",
  result: { cancelled: 5, blocked: 1, errors: [] }
}
```

## Scheduler Configuration

### Cron Schedule
- **Time**: 23:59 IST (18:29 UTC)
- **Frequency**: Daily
- **Timezone**: Asia/Kolkata

### Manual Execution
```javascript
import appointmentScheduler from './services/appointmentScheduler.js';

// Start scheduler
appointmentScheduler.start();

// Stop scheduler
appointmentScheduler.stop();

// Run manually (for testing)
await appointmentScheduler.runNow();
```

## Middleware Usage

### Booking Restriction Middleware
```javascript
import { checkBookingRestriction } from './middleware/bookingRestriction.js';

// Apply to booking endpoint
router.post('/book-appointment', authUser, checkBookingRestriction, bookAppointment);
```

### Response When Blocked
```json
{
  "success": false,
  "blocked": true,
  "message": "Your booking privileges are temporarily suspended due to multiple no-shows. You can book again after 15 January 2026.",
  "blockUntil": "2026-01-15T00:00:00.000Z",
  "daysRemaining": 30,
  "autoCancelCount": 5
}
```

## Notification Helper Functions

```javascript
import { 
  createAutoCancelNotification, 
  createBlockNotification,
  createUnblockNotification 
} from './utils/notificationHelper.js';

// Create auto-cancel notification
await createAutoCancelNotification(userId, appointment);

// Create block notification
await createBlockNotification(userId, blockUntil);

// Create unblock notification
await createUnblockNotification(userId);
```

## Error Handling

### Idempotency
- The auto-cancellation job is idempotent
- Running multiple times won't duplicate cancellations
- Uses `status: 'booked'` filter to prevent re-processing

### Error Logging
- All errors are logged with context
- Failed appointments are tracked in results
- System continues processing even if individual appointments fail

### Timezone Handling
- All dates are stored in UTC in MongoDB
- Conversions to IST are done in the scheduler
- `scheduledAt` field uses proper Date objects

## Testing

### Manual Testing
```bash
# Trigger the job manually via API
curl -X POST http://localhost:4000/api/auto-cancel/trigger-job \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Check user booking status
curl -X POST http://localhost:4000/api/auto-cancel/booking-status \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID"}'

# Get auto-cancel statistics
curl -X GET http://localhost:4000/api/auto-cancel/stats
```

### Unit Testing Considerations
- Mock the date/time for consistent testing
- Test timezone conversions
- Test idempotency
- Test notification creation
- Test block expiration logic

## Best Practices

1. **Timezone Awareness**: Always use IST for appointment scheduling
2. **Idempotency**: Ensure operations can be safely retried
3. **Error Handling**: Log errors but continue processing
4. **Notifications**: Always notify users of auto-cancellations and blocks
5. **Admin Override**: Provide admin tools to unblock users manually
6. **Monitoring**: Track auto-cancel statistics regularly

## Future Enhancements

1. **Grace Period**: Add a grace period before auto-cancellation
2. **Warning System**: Send warnings before blocking
3. **Appeal Process**: Allow users to appeal blocks
4. **Graduated Penalties**: Increase block duration for repeat offenders
5. **Email Notifications**: Send email in addition to in-app notifications
6. **SMS Alerts**: Send SMS for critical notifications
7. **Analytics Dashboard**: Visualize auto-cancel trends

## Troubleshooting

### Scheduler Not Running
- Check if server started successfully
- Verify cron expression is correct
- Check timezone configuration
- Look for errors in server logs

### Appointments Not Being Cancelled
- Verify `scheduledAt` field is set correctly
- Check timezone conversions
- Ensure appointments have `status: 'booked'`
- Run manual trigger to test

### Users Not Getting Blocked
- Verify `autoCancelCount` is incrementing
- Check block logic (>= 5 cancellations)
- Ensure `bookingBlockedUntil` is being set
- Check notification creation

### Notifications Not Appearing
- Verify notification model is correct
- Check `recipientModel` is set to 'user'
- Ensure `createdBy` field has valid ObjectId
- Check user's notification settings

## Support

For issues or questions, contact the development team or refer to:
- Main documentation: `/backend/docs/`
- API documentation: `/backend/docs/API.md`
- Notification system: `/backend/docs/NOTIFICATIONS.md`
