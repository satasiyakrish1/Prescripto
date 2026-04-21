# Bed Allocation API Documentation

This document provides detailed information about the Smart Bed Allocation System API endpoints, their parameters, and responses.

## Base URL

All API endpoints are prefixed with `/api/bed-allocation`.

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Access is restricted to users with the `admin` role.

## Endpoints

### 1. Get All Departments

**Endpoint:** `GET /api/bed-allocation/departments`

**Description:** Retrieves all hospital departments.

**Response:**
```json
{
  "departments": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Cardiology",
      "description": "Heart and cardiovascular system",
      "floor": 2,
      "createdAt": "2023-01-15T10:30:00.000Z",
      "updatedAt": "2023-01-15T10:30:00.000Z"
    },
    // More departments...
  ]
}
```

### 2. Get Beds by Department

**Endpoint:** `GET /api/bed-allocation/beds/:departmentId`

**Description:** Retrieves all beds for a specific department.

**Parameters:**
- `departmentId`: MongoDB ObjectId of the department

**Response:**
```json
{
  "beds": [
    {
      "_id": "60d21b4667d0d8992e610c86",
      "bedNumber": "C-101",
      "status": "available",
      "type": "standard",
      "department": "60d21b4667d0d8992e610c85"
    },
    {
      "_id": "60d21b4667d0d8992e610c87",
      "bedNumber": "C-102",
      "status": "occupied",
      "type": "premium",
      "department": "60d21b4667d0d8992e610c85",
      "patient": {
        "_id": "60d21b4667d0d8992e610c88",
        "name": "John Doe",
        "contactNumber": "1234567890"
      }
    },
    // More beds...
  ]
}
```

### 3. Get Beds by Status

**Endpoint:** `GET /api/bed-allocation/beds/status/:status`

**Description:** Retrieves all beds with a specific status.

**Parameters:**
- `status`: One of `available`, `occupied`, `maintenance`, or `reserved`

**Response:**
```json
{
  "beds": [
    {
      "_id": "60d21b4667d0d8992e610c86",
      "bedNumber": "C-101",
      "status": "available",
      "type": "standard",
      "department": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "Cardiology"
      }
    },
    // More beds with the specified status...
  ]
}
```

### 4. Get Doctors by Department

**Endpoint:** `GET /api/bed-allocation/doctors/:departmentId`

**Description:** Retrieves all doctors assigned to a specific department.

**Parameters:**
- `departmentId`: MongoDB ObjectId of the department

**Response:**
```json
{
  "doctors": [
    {
      "_id": "60d21b4667d0d8992e610c89",
      "name": "Dr. Jane Smith",
      "email": "jane.smith@hospital.com",
      "specialization": "Cardiologist",
      "department": "60d21b4667d0d8992e610c85"
    },
    // More doctors...
  ]
}
```

### 5. Search Patients

**Endpoint:** `GET /api/bed-allocation/patients/search`

**Description:** Searches for patients by name or contact number.

**Query Parameters:**
- `query`: Search term (name or contact number)

**Response:**
```json
{
  "patients": [
    {
      "_id": "60d21b4667d0d8992e610c88",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "contactNumber": "1234567890",
      "currentAdmission": {
        "_id": "60d21b4667d0d8992e610c90",
        "admissionDate": "2023-06-15T10:30:00.000Z",
        "bed": "60d21b4667d0d8992e610c87",
        "department": "60d21b4667d0d8992e610c85",
        "departmentName": "Cardiology"
      }
    },
    // More patients matching the query...
  ]
}
```

### 6. Allocate Bed

**Endpoint:** `POST /api/bed-allocation/allocate`

**Description:** Allocates a bed to a patient and creates an admission record.

**Request Body:**
```json
{
  "patientId": "60d21b4667d0d8992e610c88",
  "bedId": "60d21b4667d0d8992e610c86",
  "departmentId": "60d21b4667d0d8992e610c85",
  "doctorId": "60d21b4667d0d8992e610c89",
  "admissionType": "scheduled",
  "admissionDate": "2023-06-20T10:00:00.000Z",
  "expectedDischargeDate": "2023-06-27T10:00:00.000Z",
  "notes": "Patient admitted for cardiac monitoring"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bed allocated successfully",
  "admission": {
    "_id": "60d21b4667d0d8992e610c91",
    "patient": "60d21b4667d0d8992e610c88",
    "bed": "60d21b4667d0d8992e610c86",
    "department": "60d21b4667d0d8992e610c85",
    "doctor": "60d21b4667d0d8992e610c89",
    "admissionType": "scheduled",
    "admissionDate": "2023-06-20T10:00:00.000Z",
    "expectedDischargeDate": "2023-06-27T10:00:00.000Z",
    "status": "active",
    "notes": "Patient admitted for cardiac monitoring",
    "createdAt": "2023-06-20T10:00:00.000Z",
    "updatedAt": "2023-06-20T10:00:00.000Z"
  }
}
```

### 7. Get All Admissions

**Endpoint:** `GET /api/bed-allocation/admissions`

**Description:** Retrieves all patient admissions.

**Query Parameters:**
- `status` (optional): Filter by admission status (`active`, `discharged`, `transferred`)
- `type` (optional): Filter by admission type (`emergency`, `scheduled`)
- `departmentId` (optional): Filter by department

**Response:**
```json
{
  "admissions": [
    {
      "_id": "60d21b4667d0d8992e610c91",
      "patient": {
        "_id": "60d21b4667d0d8992e610c88",
        "name": "John Doe",
        "contactNumber": "1234567890"
      },
      "bed": {
        "_id": "60d21b4667d0d8992e610c86",
        "bedNumber": "C-101"
      },
      "department": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "Cardiology"
      },
      "doctor": {
        "_id": "60d21b4667d0d8992e610c89",
        "name": "Dr. Jane Smith"
      },
      "admissionType": "scheduled",
      "admissionDate": "2023-06-20T10:00:00.000Z",
      "expectedDischargeDate": "2023-06-27T10:00:00.000Z",
      "actualDischargeDate": null,
      "status": "active",
      "notes": "Patient admitted for cardiac monitoring",
      "createdAt": "2023-06-20T10:00:00.000Z",
      "updatedAt": "2023-06-20T10:00:00.000Z"
    },
    // More admissions...
  ]
}
```

### 8. Get Admission by ID

**Endpoint:** `GET /api/bed-allocation/admissions/:id`

**Description:** Retrieves a specific admission by its ID.

**Parameters:**
- `id`: MongoDB ObjectId of the admission

**Response:**
```json
{
  "admission": {
    "_id": "60d21b4667d0d8992e610c91",
    "patient": {
      "_id": "60d21b4667d0d8992e610c88",
      "name": "John Doe",
      "contactNumber": "1234567890",
      "email": "john.doe@example.com"
    },
    "bed": {
      "_id": "60d21b4667d0d8992e610c86",
      "bedNumber": "C-101",
      "type": "standard"
    },
    "department": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "Cardiology",
      "floor": 2
    },
    "doctor": {
      "_id": "60d21b4667d0d8992e610c89",
      "name": "Dr. Jane Smith",
      "specialization": "Cardiologist"
    },
    "admissionType": "scheduled",
    "admissionDate": "2023-06-20T10:00:00.000Z",
    "expectedDischargeDate": "2023-06-27T10:00:00.000Z",
    "actualDischargeDate": null,
    "status": "active",
    "notes": "Patient admitted for cardiac monitoring",
    "createdAt": "2023-06-20T10:00:00.000Z",
    "updatedAt": "2023-06-20T10:00:00.000Z"
  }
}
```

### 9. Get Bed Allocation Statistics

**Endpoint:** `GET /api/bed-allocation/stats`

**Description:** Retrieves statistics about bed allocation and occupancy.

**Response:**
```json
{
  "stats": {
    "totalBeds": 120,
    "occupiedBeds": 78,
    "availableBeds": 35,
    "maintenanceBeds": 5,
    "reservedBeds": 2,
    "occupancyRate": 65,
    "admissionTypeDistribution": {
      "emergency": 28,
      "scheduled": 50
    },
    "admissionStatusDistribution": {
      "active": 78,
      "discharged": 245,
      "transferred": 12
    },
    "departmentStats": [
      {
        "departmentId": "60d21b4667d0d8992e610c85",
        "departmentName": "Cardiology",
        "totalBeds": 20,
        "occupiedBeds": 15,
        "availableBeds": 4,
        "maintenanceBeds": 1,
        "reservedBeds": 0,
        "occupancyRate": 75
      },
      // More department statistics...
    ]
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "message": "Not authorized, no token"
}
```

### 403 Forbidden
```json
{
  "message": "Not authorized, admin access required"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 400 Bad Request
```json
{
  "message": "Invalid input data",
  "errors": [
    "patientId is required",
    "bedId is required"
  ]
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error",
  "error": "Error details..."
}
```

## Data Models

### Department
```json
{
  "_id": "ObjectId",
  "name": "String",
  "description": "String",
  "floor": "Number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Bed
```json
{
  "_id": "ObjectId",
  "bedNumber": "String",
  "status": "String (available, occupied, maintenance, reserved)",
  "type": "String (standard, premium, icu, etc.)",
  "department": "ObjectId (reference to Department)",
  "patient": "ObjectId (reference to User, only when occupied)"
}
```

### Admission
```json
{
  "_id": "ObjectId",
  "patient": "ObjectId (reference to User)",
  "bed": "ObjectId (reference to Bed)",
  "department": "ObjectId (reference to Department)",
  "doctor": "ObjectId (reference to User with role 'doctor')",
  "admissionType": "String (emergency, scheduled)",
  "admissionDate": "Date",
  "expectedDischargeDate": "Date",
  "actualDischargeDate": "Date (null until discharged)",
  "status": "String (active, discharged, transferred)",
  "notes": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### User (Patient/Doctor)
```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String",
  "contactNumber": "String",
  "role": "String (patient, doctor, admin, etc.)",
  "department": "ObjectId (reference to Department, for doctors)",
  "specialization": "String (for doctors)"
}
```