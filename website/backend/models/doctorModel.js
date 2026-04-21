import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fees: { type: Number, required: true },
    slots_booked: { type: Object, default: {} },
    address: { type: Object, required: true },
    date: { type: Number, required: true },
    isVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' },

    // Professional Details
    professionalDetails: {
        // Medical Registration
        medicalRegistration: {
            registrationNumber: { type: String },
            registrationCouncil: { type: String }, // e.g., "Medical Council of India", "State Medical Council"
            registrationYear: { type: String },
            registrationExpiryDate: { type: Date },
            registrationCertificateUrl: { type: String }, // Cloudinary URL
            isActive: { type: Boolean, default: true }
        },

        // Medical Licenses
        licenses: [{
            licenseNumber: { type: String },
            licenseType: { type: String }, // e.g., "Practice License", "Specialist License"
            issuingAuthority: { type: String },
            issueDate: { type: Date },
            expiryDate: { type: Date },
            licenseDocumentUrl: { type: String }, // Cloudinary URL
            status: { type: String, enum: ['active', 'expired', 'suspended'], default: 'active' }
        }],

        // Education & Qualifications
        education: [{
            degree: { type: String }, // e.g., "MBBS", "MD", "MS"
            institution: { type: String },
            university: { type: String },
            yearOfCompletion: { type: String },
            certificateUrl: { type: String }, // Cloudinary URL
            specialization: { type: String }
        }],

        // Additional Certifications
        certifications: [{
            certificationName: { type: String },
            issuingOrganization: { type: String },
            issueDate: { type: Date },
            expiryDate: { type: Date },
            certificateUrl: { type: String }, // Cloudinary URL
            credentialId: { type: String }
        }],

        // Professional Memberships
        memberships: [{
            organizationName: { type: String },
            membershipId: { type: String },
            membershipType: { type: String }, // e.g., "Fellow", "Member", "Associate"
            joinDate: { type: Date },
            expiryDate: { type: Date },
            certificateUrl: { type: String }, // Cloudinary URL
            status: { type: String, enum: ['active', 'inactive'], default: 'active' }
        }],

        // Languages Spoken
        languages: [{ type: String }], // e.g., ["English", "Hindi", "Tamil"]

        // Awards & Recognition
        awards: [{
            awardName: { type: String },
            issuingOrganization: { type: String },
            yearReceived: { type: String },
            description: { type: String },
            certificateUrl: { type: String } // Cloudinary URL
        }],

        // Publications & Research
        publications: [{
            title: { type: String },
            journal: { type: String },
            publicationDate: { type: Date },
            doi: { type: String },
            url: { type: String },
            coAuthors: [{ type: String }]
        }]
    },

    // Verification Details
    verification: {
        // Basic Verification Info
        verificationStatus: {
            type: String,
            enum: ['pending', 'in_progress', 'verified', 'rejected', 'expired'],
            default: 'pending'
        },
        verifiedBy: { type: String }, // Admin/Verifier name
        verifiedAt: { type: Date },

        // NMC/IMR Verification
        nmcVerification: {
            submitted_name: { type: String },
            registration_number: { type: String },
            state_council: { type: String },
            portal_name: { type: String },
            portal_registration_number: { type: String },
            qualification: { type: String },
            registered_year: { type: String },
            documents_match: { type: Boolean },
            verified: { type: Boolean, default: false },
            source: { type: String, default: 'NMC IMR' },
            checkedAt: { type: Date }
        },

        // Identity Verification
        identityVerification: {
            governmentIdType: { type: String }, // e.g., "Aadhaar", "PAN", "Passport"
            governmentIdNumber: { type: String },
            governmentIdUrl: { type: String }, // Cloudinary URL
            verified: { type: Boolean, default: false },
            verifiedAt: { type: Date }
        },

        // Address Verification
        addressVerification: {
            proofType: { type: String }, // e.g., "Utility Bill", "Rental Agreement"
            proofUrl: { type: String }, // Cloudinary URL
            verified: { type: Boolean, default: false },
            verifiedAt: { type: Date }
        },

        // Background Check
        backgroundCheck: {
            criminalRecordCheck: { type: Boolean, default: false },
            criminalRecordClear: { type: Boolean },
            malpracticeClaims: { type: Boolean, default: false },
            malpracticeDetails: { type: String },
            checkedAt: { type: Date }
        },

        // Verification Documents
        verificationDocuments: [{
            documentType: { type: String }, // e.g., "Registration Certificate", "Degree", "ID Proof"
            documentName: { type: String },
            documentUrl: { type: String }, // Cloudinary URL
            uploadedAt: { type: Date, default: Date.now },
            verifiedStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
        }],

        // Verification Notes & History
        notes: { type: String },
        rejectionReason: { type: String },
        verificationHistory: [{
            action: { type: String }, // e.g., "submitted", "verified", "rejected"
            performedBy: { type: String },
            performedAt: { type: Date, default: Date.now },
            notes: { type: String }
        }],

        // Audit Trail
        auditLogIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'verificationLog' }]
    },

    // Legacy fields (for backward compatibility)
    registrationNumber: { type: String },
    stateCouncil: { type: String },
    registrationYear: { type: String },
    qualificationFromPortal: { type: String },
    verificationStatus: { type: String, enum: ['active', 'inactive', 'unknown'], default: 'unknown' },
    portalRegistrationNumber: { type: String },
    documentUrls: {
        registrationCertificateUrl: { type: String },
        degreeCertificateUrl: { type: String },
        governmentIdUrl: { type: String }
    },

    // Booking mode settings
    bookingMode: {
        type: String,
        enum: ['instant', 'custom', 'default'],
        default: 'default'
    },
    customSlots: [{
        id: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        price: { type: Number, required: true },
        isPaymentRequired: { type: Boolean, default: true }
    }],
    emergencyFee: { type: Number, default: 0 },
    // Instant booking settings
    instantBookingSettings: {
        enabled: { type: Boolean, default: false },
        normalFee: { type: Number, default: 0 },
        emergencyFeeMultiplier: { type: Number, default: 1.5 }
    }
}, { minimize: false })

const doctorModel = mongoose.models.doctor || mongoose.model("doctor", doctorSchema);
export default doctorModel;