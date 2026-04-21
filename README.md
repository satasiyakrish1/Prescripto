# 🏥 Priscripto - Medical Appointment Booking System

## 🚀 Overview
**Priscripto** is an innovative, end-to-end medical appointment and healthcare management platform designed to simplify, streamline, and digitize the entire healthcare experience for patients, doctors, pharmacies, and administrators. In today's fast-paced world, the healthcare sector demands efficient solutions that ensure timely access to doctors, medicines, and healthcare services. Priscripto bridges the gap by offering a unified system that caters to all stakeholders.Built with cutting-edge technologies like React.js, Node.js, Express, MongoDB, and integrated with powerful services such as Google Maps and Stripe payments, Priscripto not only provides a seamless user experience but also ensures security, scalability, and flexibility.

---

## ✨ Features

-  **Doctor Appointment Booking System**
- **Apollo Pharmacy Integration** – Order medicines online.
- **Lenskart Collaboration** – Book eyeglasses & vision checkups.
- **Patient & Doctor Dashboards**
- **Admin Management Panel**
- **Health Care Vault - Store & Access Medical Records Securely**
- **Search Medicine by Name, Category, or Brand**
- **Real-Time Notifications & Reminders**
- **E-Prescriptions & Reports Download**
- **Secure Payment Gateway Integration**
- **Mobile-Responsive & Clean UI/UX**

---

## 🖌️ UI/UX Design

Crafted with **simplicity & usability** at the core.  
Designed in **Figma**, ensuring a seamless and intuitive experience across all devices.

### 🎨 Design Highlights:
- Effortless onboarding & login experience
- Minimal dashboards for quick access to bookings & reports
- Pharmacy & optical integration flow
- Light & dark mode support
- Fully responsive on all devices

**📂 Figma Design File:**  
[🔗 View Complete Figma Design](https://www.figma.com/design/T1Y4xjgrE7nHYJYmrXcAsh/Prescripto?node-id=12-2&t=PT3FOrhE8zWbE78G-1)

---

## 🛠️ Tech Stack

| Frontend            | Backend               | Database | Others                              |
|--------------------|----------------------|---------|------------------------------------|
| React.js (MERN)    | Node.js + Express.js  | MongoDB | Redux, JWT, Razorpay API, Bootstrap, Figma |

---

## 📂 Project Structure

---

Great question! Let me break down the **`📂 Project Structure`** section for you clearly. This part in the README gives an overview of how the folders and files are organized in your Priscripto project, so developers can easily navigate and understand the codebase.

Here's a more detailed and realistic **Project Structure** for your Priscripto project:

---

## API Documentation

### Authentication APIs

#### User Authentication
- `POST /api/user/register` - Register a new user
  - Body: `{ name, email, password }`
  - Response: `{ success, token }`

- `POST /api/user/login` - Login user
  - Body: `{ email, password }`
  - Response: `{ success, token }`

- `GET /api/user/get-profile` - Get user profile
  - Headers: `{ token }`
  - Response: `{ success, userData }`

- `POST /api/user/update-profile` - Update user profile
  - Headers: `{ token }`
  - Body: FormData with fields:
    - name
    - phone
    - address (JSON string)
    - gender
    - dob
    - socialLinks (JSON string)
    - skills (JSON string)
    - image (file)

#### Social Authentication
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/github` - GitHub OAuth login

### Doctor APIs

- `GET /api/doctor/list` - Get list of all doctors
  - Response: `{ success, doctors }`

### Appointment APIs

- `POST /api/appointment/book` - Book an appointment
  - Headers: `{ token }`
  - Body: `{ doctorId, date, time, etc. }`

- `GET /api/appointment/my-appointments` - Get user's appointments
  - Headers: `{ token }`

### Ward Management APIs

- `GET /api/ward/list` - Get all wards
- `POST /api/ward/create` - Create new ward
- `PUT /api/ward/:id` - Update ward
- `DELETE /api/ward/:id` - Delete ward
- `POST /api/ward/:wardId/admit` - Admit patient
- `POST /api/ward/:wardId/discharge` - Discharge patient

### Prescription APIs

- `GET /api/prescriptions/templates` - Get prescription templates
- `POST /api/prescriptions/templates` - Save prescription template
  - Body: `{ name, description, medicines, diagnosis }`

- `GET /api/prescriptions/history/:patientName` - Get patient prescription history

### Testimonial APIs

- `GET /api/testimonials/doctor/:doctorId` - Get doctor testimonials
  - Query params: `page`, `limit`

- `POST /api/testimonials/submit` - Submit testimonial
  - Headers: `{ token }`
  - Body: `{ doctorId, rating, content }`

### Google Fit Integration APIs

- `GET /api/user/google-fit/status` - Check Google Fit connection status
  - Headers: `{ Authorization: Bearer <token> }`

- `GET /api/user/google-fit/auth-url` - Get Google Fit authorization URL
  - Headers: `{ Authorization: Bearer <token> }`

- `GET /api/user/google-fit/data` - Get user's fitness data
  - Headers: `{ token }`

### Community APIs

- `POST /api/community/create-post` - Create community post
  - Headers: `{ Authorization: Bearer <token> }`
  - Body: `{ title, content, tags, userId }`

### Payment APIs

- `POST /api/packages/create-order` - Create payment order
  - Headers: `{ Authorization: Bearer <token> }`
  - Body: `{ packageType }`

- `POST /api/packages/verify-payment` - Verify payment
  - Headers: `{ Authorization: Bearer <token> }`
  - Body: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, packageType }`

### User Activity APIs

- `GET /api/login-history/history` - Get user login history
  - Headers: `{ token }`
  - Query params: `page`, `limit`

### Donation APIs

- `POST /api/user/get-qr-code` - Generate QR code for donation
  - Headers: `{ token }` (optional)
  - Body: `{ orderId }`

## API Response Format

All APIs follow a consistent response format:

```javascript
{
  "success": boolean,
  "message": string,
  "data": any,
  "error": string (optional)
}
```

## Authentication

Most APIs require authentication using JWT tokens. Include the token in the request headers:

```javascript
headers: {
  'Authorization': 'Bearer <token>'
  // or
  'token': '<token>'
}
```

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Error responses include a message explaining the error:
```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. Exceeding the rate limit will return a 429 (Too Many Requests) status code.

## Environment Variables

Frontend environment variables required:
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_USE_LOCAL_PROXY=true/false
```

## Development

To run the project locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start development server: `npm run dev`

## Production

For production deployment:

1. Build the project: `npm run build`
2. Set production environment variables
3. Deploy the built files

## Security Considerations

1. All sensitive routes are protected with JWT authentication
2. Passwords are hashed before storage
3. CORS is configured for security
4. Rate limiting is implemented
5. Input validation on all endpoints
6. Secure headers are implemented

---
