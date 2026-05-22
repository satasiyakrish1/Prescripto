# Patient Testimonials System

## Overview
The Patient Testimonials system allows patients to write reviews for doctors they have had completed appointments with. All testimonials are stored with user ID and doctor ID, and require admin approval before being displayed publicly.

## Database Schema

### Testimonial Model
```javascript
{
    doctor: ObjectId (ref: 'doctor'),      // Doctor being reviewed
    patient: ObjectId (ref: 'user'),       // Patient who wrote the review
    patientName: String,                   // Patient's name
    content: String (max 1000 chars),      // Review text
    rating: Number (1-5),                  // Star rating
    status: String (pending/approved/rejected), // Approval status
    createdAt: Date,                       // Creation timestamp
    updatedAt: Date                        // Last update timestamp
}
```

## API Endpoints

### Patient Endpoints

#### Submit a Testimonial
```
POST /api/testimonials/submit
Headers: { token: <user-token> }
Body: {
    doctorId: String,
    content: String,
    rating: Number (1-5)
}
```

**Validation:**
- User must be logged in
- User must have a completed appointment with the doctor
- User can only submit one review per doctor
- Rating must be between 1 and 5
- Content is required

#### Get User's Testimonials
```
GET /api/testimonials/user/my-testimonials
Headers: { token: <user-token> }
```

Returns all testimonials submitted by the logged-in user.

#### Get Doctor's Testimonials
```
GET /api/testimonials/doctor/:doctorId?page=1&limit=10
```

Returns approved testimonials for a specific doctor with pagination and statistics.

**Response includes:**
- List of testimonials
- Average rating
- Total reviews count
- Pagination info

### Admin Endpoints

#### Get All Testimonials
```
GET /api/testimonials/all?page=1&limit=20&status=all
Headers: { token: <admin-token> }
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (all/pending/approved/rejected)

#### Update Testimonial Status
```
PUT /api/testimonials/:testimonialId/status
Headers: { token: <admin-token> }
Body: {
    status: String (approved/rejected/pending)
}
```

#### Delete Testimonial
```
DELETE /api/testimonials/:testimonialId
Headers: { token: <admin-token> }
```

## Frontend Pages

### Main Testimonials Page
**Route:** `/testimonials` or `/testimonials/:doctorId`

**Features:**
- Two tabs: "View All Reviews" and "Write a Review"
- Doctor selection with search
- Star rating display
- Pagination
- Review statistics (average rating, total reviews)
- User's own testimonials with status badges

### Write Review Button
Appears on completed appointments in the "My Appointments" page.

**Location:** MyAppointments.jsx
- Only visible for completed appointments
- Navigates to testimonials page with pre-selected doctor

## User Flow

1. **Patient completes an appointment**
2. **"Write Review" button appears** on the appointment card
3. **Patient clicks button** → Redirected to testimonials page with doctor pre-selected
4. **Patient writes review** with rating and text
5. **Review submitted** → Status: "Pending"
6. **Admin reviews** → Approves or rejects
7. **If approved** → Review appears on doctor's testimonials page

## Security Features

- Authentication required for submitting reviews
- Users can only review doctors they've had appointments with
- One review per doctor per user
- Admin approval required before public display
- Input validation and sanitization

## Usage Examples

### Submit a Review (Frontend)
```javascript
const submitReview = async () => {
    const response = await axios.post(
        `${backendUrl}/api/testimonials/submit`,
        {
            doctorId: 'doctor123',
            content: 'Great doctor, very professional!',
            rating: 5
        },
        { headers: { token: userToken } }
    );
};
```

### Fetch Doctor Reviews (Frontend)
```javascript
const fetchReviews = async (doctorId, page = 1) => {
    const response = await axios.get(
        `${backendUrl}/api/testimonials/doctor/${doctorId}?page=${page}&limit=6`
    );
    
    console.log('Average Rating:', response.data.averageRating);
    console.log('Total Reviews:', response.data.totalReviews);
    console.log('Reviews:', response.data.data);
};
```

## Admin Management

Admins can:
- View all testimonials (pending, approved, rejected)
- Filter by status
- Approve or reject testimonials
- Delete inappropriate testimonials
- See patient and doctor information

## Best Practices

1. **Encourage Reviews:** Add prominent "Write Review" buttons on completed appointments
2. **Moderate Promptly:** Review pending testimonials regularly
3. **Display Statistics:** Show average ratings and review counts on doctor profiles
4. **Respond to Reviews:** Consider adding a feature for doctors to respond to reviews
5. **Monitor Quality:** Reject spam, inappropriate, or fake reviews

## Future Enhancements

- Doctor responses to reviews
- Helpful/unhelpful voting on reviews
- Review editing (within time limit)
- Photo uploads with reviews
- Verified purchase badges
- Review reminders via email/SMS
