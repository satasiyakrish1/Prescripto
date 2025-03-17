# 🏥 Priscripto - Medical Appointment Booking System

![Priscripto Banner](https://via.placeholder.com/1200x400?text=Priscripto+Medical+Booking+System)

---

## 🚀 Overview

**Priscripto** is an innovative, end-to-end medical appointment and healthcare management platform designed to simplify, streamline, and digitize the entire healthcare experience for patients, doctors, pharmacies, and administrators. In today’s fast-paced world, the healthcare sector demands efficient solutions that ensure timely access to doctors, medicines, and healthcare services. Priscripto bridges the gap by offering a unified system that caters to all stakeholders.Built with cutting-edge technologies like React.js, Node.js, Express, MongoDB, and integrated with powerful services such as Google Maps and Stripe payments, Priscripto not only provides a seamless user experience but also ensures security, scalability, and flexibility.

---

## ✨ Features

- 🔹 **Doctor Appointment Booking System**
- 🔹 **Apollo Pharmacy Integration** – Order medicines online.
- 🔹 **Lenskart Collaboration** – Book eyeglasses & vision checkups.
- 🔹 **Patient & Doctor Dashboards**
- 🔹 **Admin Management Panel**
- 🔹 **Health Care Vault - Store & Access Medical Records Securely**
- 🔹 **Search Medicine by Name, Category, or Brand**
- 🔹 **Real-Time Notifications & Reminders**
- 🔹 **E-Prescriptions & Reports Download**
- 🔹 **Secure Payment Gateway Integration**
- 🔹 **Mobile-Responsive & Clean UI/UX**

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

Here’s a more detailed and realistic **Project Structure** for your Priscripto project:

---

```markdown
## 📂 Project Structure

Priscripto/
├── client/                     # React Frontend
│   ├── public/                 # Public assets (index.html, favicon, etc.)
│   ├── src/
│   │   ├── assets/             # Images, Icons, Fonts
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Different pages (Home, Booking, Dashboard, etc.)
│   │   ├── redux/              # Redux store, actions, reducers
│   │   ├── services/           # API calls & utility functions
│   │   ├── App.js              # Root React component
│   │   └── index.js            # React DOM render
│   └── package.json            # Frontend dependencies
│
├── server/                     # Node.js + Express Backend
│   ├── config/                 # DB config, payment config, etc.
│   ├── controllers/            # Route controller logic
│   ├── models/                 # Mongoose schemas (User, Booking, Prescription)
│   ├── routes/                 # API route files
│   ├── middlewares/            # Authentication, error handling, etc.
│   ├── utils/                  # Utility functions
│   ├── .env                    # Environment variables
│   └── server.js               # Entry point of backend server
│
├── docs/                       # API Documentation & Developer Guides
│   └── api-docs.md
│
├── database/                   # Optional DB backup scripts or mock data
│
├── public/                     # Static files, if any (e.g., logo, terms pdf)
│
├── README.md                   # Project overview (this file!)
├── LICENSE                     # License file
└── .gitignore                  # Git ignored files
```

---
### 🔥 **Explanation:**
- **client/**: Entire React frontend application.
  - `components/`: Contains UI components like Navbar, BookingForm, DoctorCard, etc.
  - `pages/`: Contains full pages like Home, Dashboard, Pharmacy, etc.
  - `redux/`: Manages state like auth, bookings, and payments.
  - `services/`: API calls like login, appointment booking, etc.
  
- **server/**: Entire backend (Node.js + Express).
  - `models/`: Defines MongoDB collections (User, Doctor, Booking, Orders, etc.).
  - `controllers/`: Contains logic for routes (authentication, booking, orders).
  - `routes/`: Defines all REST API endpoints.
  - `middlewares/`: Authentication check, error handling, etc.
  - `.env`: Keeps your API keys & DB URL safe.

- **docs/**: API documentation and guides.

- **database/**: Optional folder if you want to keep MongoDB backup JSON or initial data.

