// src/utils/emailTemplates.js
// This file can be used by both frontend for rendering and backend for data structure

export const generateAppleWalletPass = (userData, docData, slotDate, slotTime, appointmentId) => {
    return {
        formatVersion: 1,
        passTypeIdentifier: "pass.com.prescripto.appointment",
        serialNumber: appointmentId,
        teamIdentifier: "PRESCRIPTO",
        webServiceURL: "https://prescripto.com/api/passes/",
        authenticationToken: "vxwxd7J8AlNNFPS8k0a0FfUFtq0ewzFdc",
        relevantDate: `${slotDate}T${slotTime}:00-07:00`,
        locations: [
            {
                latitude: 37.6189722,
                longitude: -122.3748889,
                relevantText: "Your appointment is today!"
            }
        ],
        barcode: {
            message: appointmentId,
            format: "PKBarcodeFormatQR",
            messageEncoding: "iso-8859-1"
        },
        organizationName: "Prescripto",
        description: "Medical Appointment",
        logoText: "Prescripto",
        foregroundColor: "rgb(255, 255, 255)",
        backgroundColor: "rgb(74, 85, 104)",
        labelColor: "rgb(255, 255, 255)",
        generic: {
            primaryFields: [
                {
                    key: "doctor",
                    label: "Doctor",
                    value: `Dr. ${docData.name}`
                }
            ],
            secondaryFields: [
                {
                    key: "date",
                    label: "Date",
                    value: slotDate
                },
                {
                    key: "time",
                    label: "Time",
                    value: slotTime
                }
            ],
            auxiliaryFields: [
                {
                    key: "specialty",
                    label: "Specialty",
                    value: docData.speciality
                },
                {
                    key: "patient",
                    label: "Patient",
                    value: userData.name
                }
            ],
            backFields: [
                {
                    key: "address",
                    label: "Address",
                    value: docData.address
                },
                {
                    key: "phone",
                    label: "Contact",
                    value: userData.phone || "Not provided"
                },
                {
                    key: "instructions",
                    label: "Instructions",
                    value: "Please arrive 15 minutes early. Bring valid ID and insurance card."
                }
            ]
        }
    };
};

/**
 * Generate Google Pay Pass data
 */
export const generateGooglePayPass = (userData, docData, slotDate, slotTime, appointmentId) => {
    return {
        // iss, aud, typ, iat are usually handled by the server-side JWT generation
        // These are placeholders for the *data* that will be signed by the server
        payload: {
            genericObjects: [
                {
                    id: `${appointmentId}.appointment`, // This ID will be prefixed with issuer ID on server
                    classId: "prescripto.appointment.class", // This will be prefixed with issuer ID on server
                    genericType: "GENERIC_TYPE_UNSPECIFIED",
                    hexBackgroundColor: "#4a5568",
                    logo: {
                        sourceUri: {
                            uri: "https://prescripto.com/assets/logo-white.png"
                        }
                    },
                    cardTitle: {
                        defaultValue: {
                            language: "en",
                            value: "Medical Appointment"
                        }
                    },
                    subheader: {
                        defaultValue: {
                            language: "en",
                            value: "Prescripto"
                        }
                    },
                    header: {
                        defaultValue: {
                            language: "en",
                            value: `Dr. ${docData.name}`
                        }
                    },
                    textModulesData: [
                        {
                            id: "date_time",
                            header: "Date & Time",
                            body: `${slotDate} at ${slotTime}`
                        },
                        {
                            id: "specialty",
                            header: "Specialty",
                            body: docData.speciality
                        },
                        {
                            id: "patient",
                            header: "Patient",
                            body: userData.name
                        },
                        {
                            id: "location",
                            header: "Location",
                            body: docData.address
                        }
                    ],
                    barcode: {
                        type: "QR_CODE",
                        value: appointmentId
                    }
                }
            ]
        }
    };
};

export const getAppointmentConfirmationTemplate = (userData, docData, slotDate, slotTime, appointmentId, applePassLink, googlePassLink) => {
    // Pass links generated by backend
    const applePassData = generateAppleWalletPass(userData, docData, slotDate, slotTime, appointmentId);
    const googlePassData = generateGooglePayPass(userData, docData, slotDate, slotTime, appointmentId);

    return {
        user: {
            subject: 'Appointment Confirmed - Prescripto',
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; color: #333333;">
                    
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <img src="https://krishsatasiya-prescriptosystem.onrender.com/assets/logo-BNCDj_dh.svg" alt="Prescripto" style="height: 30px; width: auto;">
                    </div>

                    <!-- Main Content -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 500; margin-bottom: 10px; margin-top: 0;">Appointment Confirmed</h1>
                        <p style="color: #666666; font-size: 16px; margin: 0;">We look forward to seeing you, ${userData.name}.</p>
                    </div>

                    <!-- Details Card -->
                    <div style="background-color: #fafafa; border: 1px solid #eeeeee; border-radius: 12px; padding: 30px; margin-bottom: 40px;">
                        <div style="margin-bottom: 25px;">
                            <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Doctor</p>
                            <p style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 500;">Dr. ${docData.name}</p>
                        </div>
                        <div style="margin-bottom: 25px;">
                            <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Date & Time</p>
                            <p style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 500;">${slotDate} at ${slotTime}</p>
                        </div>
                        <div>
                            <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Location</p>
                            <p style="color: #1a1a1a; font-size: 16px; margin: 0; line-height: 1.5;">${docData.address.line1 || ''} ${docData.address.line2 ? ', ' + docData.address.line2 : ''}</p>
                        </div>
                    </div>

                    <!-- Wallet Buttons -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <p style="color: #999999; font-size: 13px; margin-bottom: 20px;">Save to your wallet</p>
                        <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                            <a href="${applePassLink}" style="display: inline-block; text-decoration: none;">
                                <img src="https://developer.apple.com/wallet/Add_to_Apple_Wallet_rgb_US-UK.svg" alt="Add to Apple Wallet" style="height: 40px;">
                            </a>
                            <a href="${googlePassLink}" style="display: inline-block; text-decoration: none;">
                                <img src="https://developers.google.com/pay/api/images/brand-guidelines/save-to-google-pay.png" alt="Save to Google Pay" style="height: 40px;">
                            </a>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; border-top: 1px solid #eeeeee; padding-top: 30px;">
                        <p style="color: #999999; font-size: 13px; margin-bottom: 10px; line-height: 1.5;">Please arrive 10 minutes before your scheduled time.</p>
                        <p style="color: #cccccc; font-size: 12px; margin-top: 20px;">Prescripto Inc.</p>
                    </div>
                </div>
            `
        },
        doctor: {
            subject: 'New Appointment Scheduled - Prescripto',
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; color: #333333;">
                    
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <img src="https://krishsatasiya-prescriptosystem.onrender.com/assets/logo-BNCDj_dh.svg" alt="Prescripto" style="height: 30px; width: auto;">
                    </div>

                    <!-- Main Content -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 500; margin-bottom: 10px; margin-top: 0;">New Appointment</h1>
                        <p style="color: #666666; font-size: 16px; margin: 0;">You have a new booking, Dr. ${docData.name}.</p>
                    </div>

                    <!-- Details Card -->
                    <div style="background-color: #fafafa; border: 1px solid #eeeeee; border-radius: 12px; padding: 30px; margin-bottom: 40px;">
                        <div style="margin-bottom: 25px;">
                            <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Patient</p>
                            <p style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 500;">${userData.name}</p>
                        </div>
                        <div style="margin-bottom: 25px;">
                            <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Date & Time</p>
                            <p style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 500;">${slotDate} at ${slotTime}</p>
                        </div>
                        <div style="margin-bottom: 25px;">
                             <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Contact</p>
                             <p style="color: #1a1a1a; font-size: 16px; margin: 0; line-height: 1.5;">${userData.phone || 'Not provided'}</p>
                         </div>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; border-top: 1px solid #eeeeee; padding-top: 30px;">
                        <a href="https://prescripto.com/doctor/dashboard" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500;">View Dashboard</a>
                        <p style="color: #cccccc; font-size: 12px; margin-top: 30px;">Prescripto Inc.</p>
                    </div>
                </div>
            `
        },
        walletPasses: {
            apple: applePassData,
            google: googlePassData
        }
    };
};

export const getAppointmentReminderTemplate = (userData, docData, slotDate, slotTime, appointmentId, applePassLink) => {
    // googlePassLink is not typically included in reminders if already saved
    return {
        subject: '⏰ Appointment Reminder - Tomorrow at ' + slotTime,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Appointment Reminder</title>
                <style>
                    /* Basic Reset & Body */
                    body { margin: 0; padding: 0; background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
                    a { text-decoration: none; color: inherit; }
                    img { max-width: 100%; border: 0; }
                    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }

                    /* Main Container */
                    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }

                    /* Header */
                    .header { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); padding: 40px 30px; text-align: center; }
                    .header-content { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 20px; display: inline-block; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; }
                    .header p { color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px; }

                    /* Content Section */
                    .content { padding: 40px 30px; }
                    .content-heading { text-align: center; margin-bottom: 30px; }
                    .content-heading h2 { color: #2d3748; margin: 0 0 10px 0; font-size: 24px; font-weight: 600; }
                    .content-heading p { color: #718096; margin: 0; font-size: 16px; line-height: 1.5; }

                    /* Appointment Card */
                    .appointment-card { background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
                    .appointment-card::before { content: ''; position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: linear-gradient(135deg, #ed8936, #dd6b20); border-radius: 50%; opacity: 0.1; }
                    .doctor-info { display: flex; align-items: center; margin-bottom: 20px; }
                    .doctor-avatar { width: 60px; height: 60px; background: linear-gradient(135deg, #ed8936, #dd6b20); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-right: 15px; }
                    .doctor-avatar span { color: white; font-size: 24px; }
                    .doctor-details h3 { color: #2d3748; margin: 0; font-size: 20px; font-weight: 600; }
                    .doctor-details p { color: #718096; margin: 5px 0 0 0; font-size: 14px; }
                    .appointment-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                    .detail-item { color: #4a5568; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
                    .detail-value { color: #2d3748; font-size: 16px; font-weight: 600; }
                    .location-info { border-top: 1px solid #e2e8f0; padding-top: 15px; }
                    .location-info .detail-value { font-size: 14px; line-height: 1.4; }

                    /* Checklist */
                    .checklist { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #f59e0b; }
                    .checklist h4 { color: #92400e; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; display: flex; align-items: center; }
                    .checklist ul { color: #92400e; margin: 0; padding-left: 20px; line-height: 1.8; }

                    /* Wallet Button */
                    .wallet-button-wrapper { text-align: center; margin: 30px 0; }
                    .wallet-button-wrapper p { color: #4a5568; margin-bottom: 15px; font-size: 14px; }
                    .apple-wallet-button-reminder { background: #000000; color: white; padding: 12px 20px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-flex; align-items: center; }
                    .apple-wallet-button-reminder img { height: 40px; margin-right: 10px; }

                    /* Footer */
                    .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
                    .footer p { color: #4a5568; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; }
                    .footer div { color: #718096; font-size: 12px; line-height: 1.6; }

                    /* Responsive */
                    @media only screen and (max-width: 480px) {
                        .content, .header, .footer { padding: 20px; }
                        .header h1 { font-size: 28px; }
                        .content-heading h2 { font-size: 20px; }
                        .appointment-card, .checklist { padding: 20px; }
                        .appointment-details { grid-template-columns: 1fr; }
                        .apple-wallet-button-reminder { width: 100%; justify-content: center; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    
                    <div class="header">
                        <div class="header-content">
                            <h1>⏰ Reminder</h1>
                            <p>Your appointment is tomorrow!</p>
                        </div>
                    </div>

                    <div class="content">
                        <div class="content-heading">
                            <h2>Hello ${userData.name}! 👋</h2>
                            <p>Don't forget about your upcoming appointment</p>
                        </div>

                        <div class="appointment-card">
                            <div class="doctor-info">
                                <div class="doctor-avatar">
                                    <span>👨‍⚕️</span>
                                </div>
                                <div class="doctor-details">
                                    <h3>Dr. ${docData.name}</h3>
                                    <p>${docData.speciality}</p>
                                </div>
                            </div>

                            <div class="appointment-details">
                                <div>
                                    <div class="detail-item">Date</div>
                                    <div class="detail-value">📅 ${slotDate}</div>
                                </div>
                                <div>
                                    <div class="detail-item">Time</div>
                                    <div class="detail-value">🕐 ${slotTime}</div>
                                </div>
                            </div>

                            <div class="location-info">
                                <div class="detail-item">Location</div>
                                <div class="detail-value">📍 ${docData.address}</div>
                            </div>
                        </div>

                        <div class="checklist">
                            <h4><span>📋</span> Pre-Appointment Checklist</h4>
                            <ul>
                                <li>Arrive 15 minutes early</li>
                                <li>Bring valid ID and insurance card</li>
                                <li>Prepare list of current medications</li>
                                <li>Gather relevant medical history</li>
                            </ul>
                        </div>

                        <div class="wallet-button-wrapper">
                            <p>Quick access from your wallet</p>
                            <a href="${applePassLink}"
                               class="apple-wallet-button-reminder">
                                <img src="https://developer.apple.com/wallet/Add_to_Apple_Wallet_rgb_US-UK.svg" alt="Add to Apple Wallet">
                            </a>
                        </div>
                    </div>

                    <div class="footer">
                        <p>See you tomorrow! 😊</p>
                        <div>
                            <p>Need to reschedule? Contact us at least 24 hours in advance.</p>
                            <p>&copy; ${new Date().getFullYear()} Prescripto. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    };
};

export const getAppointmentCancellationTemplate = (userData, docData, slotDate, slotTime) => {
    return {
        user: {
            subject: 'Appointment Cancelled - Prescripto',
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; color: #333333;">
                    
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <img src="https://krishsatasiya-prescriptosystem.onrender.com/assets/logo-BNCDj_dh.svg" alt="Prescripto" style="height: 30px; width: auto;">
                    </div>

                    <!-- Main Content -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 500; margin-bottom: 10px; margin-top: 0;">Appointment Cancelled</h1>
                        <p style="color: #666666; font-size: 16px; margin: 0;">It's sad to see you go, ${userData.name}.</p>
                    </div>

                    <!-- Details Card -->
                    <div style="background-color: #fafafa; border: 1px solid #eeeeee; border-radius: 12px; padding: 30px; margin-bottom: 40px;">
                        <div style="margin-bottom: 20px;">
                             <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Doctor</p>
                            <p style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 500;">Dr. ${docData.name}</p>
                        </div>
                         <div>
                             <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Date & Time</p>
                            <p style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 500;">${slotDate} at ${slotTime}</p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; border-top: 1px solid #eeeeee; padding-top: 30px;">
                        <a href="https://prescripto.com/book-appointment" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500;">Book New Appointment</a>
                        <p style="color: #cccccc; font-size: 12px; margin-top: 30px;">Prescripto Inc.</p>
                    </div>
                </div>
            `
        },
        doctor: {
            subject: 'Appointment Cancelled by Patient - Prescripto',
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; color: #333333;">
                    
                    <!-- Header -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <img src="https://krishsatasiya-prescriptosystem.onrender.com/assets/logo-BNCDj_dh.svg" alt="Prescripto" style="height: 30px; width: auto;">
                    </div>

                    <!-- Main Content -->
                    <div style="text-align: center; margin-bottom: 40px;">
                        <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 500; margin-bottom: 10px; margin-top: 0;">Appointment Cancelled</h1>
                        <p style="color: #666666; font-size: 16px; margin: 0;">An appointment has been cancelled.</p>
                    </div>

                    <!-- Details Card -->
                    <div style="background-color: #fafafa; border: 1px solid #eeeeee; border-radius: 12px; padding: 30px; margin-bottom: 40px;">
                         <div style="margin-bottom: 25px;">
                             <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Patient</p>
                            <p style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 500;">${userData.name}</p>
                        </div>
                        <div>
                             <p style="color: #999999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 5px 0;">Date & Time</p>
                            <p style="color: #1a1a1a; font-size: 18px; margin: 0; font-weight: 500;">${slotDate} at ${slotTime}</p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; border-top: 1px solid #eeeeee; padding-top: 30px;">
                        <a href="https://prescripto.com/doctor/dashboard" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500;">View Dashboard</a>
                        <p style="color: #cccccc; font-size: 12px; margin-top: 30px;">Prescripto Inc.</p>
                    </div>
                </div>
            `
        }
    };
};

export const getAppointmentCompletionTemplate = (userData, docData, slotDate, slotTime) => {
    return {
        user: {
            subject: '✅ Appointment Completed - Prescripto',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Appointment Completed</title>
                    <style>
                        /* Basic Reset & Body */
                        body { margin: 0; padding: 0; background: linear-gradient(135deg, #38a169 0%, #2f855a 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
                        a { text-decoration: none; color: inherit; }
                        img { max-width: 100%; border: 0; }
                        table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }

                        /* Main Container */
                        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }

                        /* Header */
                        .header { background: linear-gradient(135deg, #38a169 0%, #2f855a 100%); padding: 40px 30px; text-align: center; }
                        .header-content { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 20px; display: inline-block; }
                        .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; }
                        .header p { color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px; }

                        /* Content Section */
                        .content { padding: 40px 30px; }
                        .content-heading { text-align: center; margin-bottom: 30px; }
                        .content-heading h2 { color: #2d3748; margin: 0 0 10px 0; font-size: 24px; font-weight: 600; }
                        .content-heading p { color: #718096; margin: 0; font-size: 16px; line-height: 1.5; }

                        /* Completed Appointment Card */
                        .completed-card { background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
                        .completed-badge { position: absolute; top: 10px; right: 15px; background: #38a169; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                        .doctor-info { display: flex; align-items: center; margin-bottom: 20px; }
                        .doctor-avatar { width: 60px; height: 60px; background: linear-gradient(135deg, #38a169, #2f855a); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-right: 15px; }
                        .doctor-avatar span { color: white; font-size: 24px; }
                        .doctor-details h3 { color: #2d3748; margin: 0; font-size: 20px; font-weight: 600; }
                        .doctor-details p { color: #718096; margin: 5px 0 0 0; font-size: 14px; }
                        .appointment-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                        .detail-item { color: #4a5568; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
                        .detail-value { color: #2d3748; font-size: 16px; font-weight: 600; }
                        .location-info { border-top: 1px solid #e2e8f0; padding-top: 15px; }
                        .location-info .detail-value { font-size: 14px; line-height: 1.4; }

                        /* Feedback CTA */
                        .feedback-cta { background: linear-gradient(135deg, #ebf8ff 0%, #e6fffa 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; border-left: 4px solid #4299e1; }
                        .feedback-cta p { color: #2c5282; margin: 0 0 15px 0; font-size: 14px; font-weight: 500; }
                        .feedback-button { background: linear-gradient(135deg, #4299e1, #63b3ed); color: white; padding: 12px 25px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 4px 10px rgba(66,153,225,0.3); transition: all 0.3s ease; }

                        /* Next Steps */
                        .next-steps { background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%); border-radius: 12px; padding: 20px; margin: 30px 0; border-left: 4px solid #48bb78; }
                        .next-steps h4 { color: #2f855a; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; display: flex; align-items: center; }
                        .next-steps ul { color: #2f855a; margin: 0; padding-left: 20px; line-height: 1.8; }

                        /* Footer */
                        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
                        .footer p { color: #4a5568; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; }
                        .footer div { color: #718096; font-size: 12px; line-height: 1.6; }

                        /* Responsive */
                        @media only screen and (max-width: 480px) {
                            .content, .header, .footer { padding: 20px; }
                            .header h1 { font-size: 28px; }
                            .content-heading h2 { font-size: 20px; }
                            .completed-card, .feedback-cta, .next-steps { padding: 20px; }
                            .appointment-details { grid-template-columns: 1fr; }
                            .feedback-button { width: 100%; box-sizing: border-box; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        
                        <div class="header">
                            <div class="header-content">
                                <h1>✅ Completed</h1>
                                <p>Your appointment has been completed</p>
                            </div>
                        </div>

                        <div class="content">
                            <div class="content-heading">
                                <h2>Hello ${userData.name}!</h2>
                                <p>Thank you for visiting Dr. ${docData.name}</p>
                            </div>

                            <div class="completed-card">
                                <div class="completed-badge">COMPLETED</div>
                                
                                <div class="doctor-info">
                                    <div class="doctor-avatar">
                                        <span>👨‍⚕️</span>
                                    </div>
                                    <div class="doctor-details">
                                        <h3>Dr. ${docData.name}</h3>
                                        <p>${docData.speciality}</p>
                                    </div>
                                </div>

                                <div class="appointment-details">
                                    <div>
                                        <div class="detail-item">Date</div>
                                        <div class="detail-value">📅 ${slotDate}</div>
                                    </div>
                                    <div>
                                        <div class="detail-item">Time</div>
                                        <div class="detail-value">🕐 ${slotTime}</div>
                                    </div>
                                </div>

                                <div class="contact-info">
                                    <div class="detail-item">Contact</div>
                                    <div class="detail-value">📞 ${userData.phone || 'Not provided'}</div>
                                </div>
                            </div>

                            <div class="next-steps">
                                <h4><span>🔍</span> Next Steps</h4>
                                <ul>
                                    <li>Your prescription and medical notes are available in your patient portal</li>
                                    <li>Follow the treatment plan as discussed with your doctor</li>
                                    <li>Schedule any follow-up appointments as recommended</li>
                                    <li>Contact the clinic if you have any questions about your treatment</li>
                                </ul>
                            </div>

                            <div class="feedback-cta">
                                <p>How was your experience? Your feedback helps us improve our services.</p>
                                <a href="https://prescripto.com/feedback"
                                   class="feedback-button">
                                    Share Your Feedback →
                                </a>
                            </div>
                        </div>

                        <div class="footer">
                            <p>We wish you good health! 💚</p>
                            <div>
                                <p>This is an automated message, please do not reply.</p>
                                <p>&copy; ${new Date().getFullYear()} Prescripto. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        },
        doctor: {
            subject: '✓ Appointment Marked as Completed - Prescripto',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Appointment Completed</title>
                    <style>
                        /* Basic Reset & Body */
                        body { margin: 0; padding: 0; background: linear-gradient(135deg, #38a169 0%, #2f855a 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
                        a { text-decoration: none; color: inherit; }
                        img { max-width: 100%; border: 0; }
                        table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }

                        /* Main Container */
                        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }

                        /* Header */
                        .header { background: linear-gradient(135deg, #38a169 0%, #2f855a 100%); padding: 40px 30px; text-align: center; }
                        .header-content { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 15px; padding: 20px; display: inline-block; }
                        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
                        .header p { color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px; }

                        /* Content Section */
                        .content { padding: 40px 30px; }
                        .content-heading { text-align: center; margin-bottom: 30px; }
                        .content-heading h2 { color: #2d3748; margin: 0 0 10px 0; font-size: 24px; font-weight: 600; }

                        /* Completed Patient Card */
                        .completed-patient-card { background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 16px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0; }
                        .patient-info { display: flex; align-items: center; margin-bottom: 20px; }
                        .patient-avatar { width: 60px; height: 60px; background: linear-gradient(135deg, #38a169, #2f855a); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-right: 15px; }
                        .patient-avatar span { color: white; font-size: 24px; }
                        .patient-details h3 { color: #2d3748; margin: 0; font-size: 20px; font-weight: 600; }
                        .patient-details p { color: #718096; margin: 5px 0 0 0; font-size: 14px; }
                        .appointment-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                        .detail-item { color: #4a5568; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
                        .detail-value { color: #2d3748; font-size: 16px; font-weight: 600; }
                        .contact-info { border-top: 1px solid #e2e8f0; padding-top: 15px; }
                        .contact-info .detail-value { font-size: 14px; }

                        /* Action Button */
                        .action-button-wrapper { text-align: center; margin: 30px 0; }
                        .action-button { background: linear-gradient(135deg, #4c51bf, #667eea); color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(76,81,191,0.3); transition: all 0.3s ease; }

                        /* Notification */
                        .notification { background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; border-left: 4px solid #48bb78; }
                        .notification p { color: #2f855a; margin: 0; font-size: 14px; font-weight: 500; }

                        /* Footer */
                        .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
                        .footer p { color: #4a5568; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; }
                        .footer div { color: #718096; font-size: 12px; line-height: 1.6; }

                        /* Responsive */
                        @media only screen and (max-width: 480px) {
                            .content, .header, .footer { padding: 20px; }
                            .header h1 { font-size: 24px; }
                            .content-heading h2 { font-size: 20px; }
                            .completed-patient-card, .notification { padding: 20px; }
                            .appointment-details { grid-template-columns: 1fr; }
                            .action-button { width: 100%; box-sizing: border-box; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        
                        <div class="header">
                            <div class="header-content">
                                <h1>✓ Completed</h1>
                                <p>Appointment has been marked as completed</p>
                            </div>
                        </div>

                        <div class="content">
                            <div class="content-heading">
                                <h2>Hello Dr. ${docData.name}!</h2>
                                <p>The following appointment has been marked as completed.</p>
                            </div>

                            <div class="completed-patient-card">
                                <div class="patient-info">
                                    <div class="patient-avatar">
                                        <span>👤</span>
                                    </div>
                                    <div class="patient-details">
                                        <h3>${userData.name}</h3>
                                        <p>Patient</p>
                                    </div>
                                </div>

                                <div class="appointment-details">
                                    <div>
                                        <div class="detail-item">Date</div>
                                        <div class="detail-value">📅 ${slotDate}</div>
                                    </div>
                                    <div>
                                        <div class="detail-item">Time</div>
                                        <div class="detail-value">🕐 ${slotTime}</div>
                                    </div>
                                </div>

                                <div class="contact-info">
                                    <div class="detail-item">Contact</div>
                                    <div class="detail-value">📞 ${userData.phone || 'Not provided'}</div>
                                </div>
                            </div>

                            <div class="action-button-wrapper">
                                <a href="https://prescripto.com/doctor/dashboard"
                                   class="action-button">
                                    View Dashboard →
                                </a>
                            </div>

                            <div class="notification">
                                <p>The patient has been notified that their appointment is complete.</p>
                            </div>
                        </div>

                        <div class="footer">
                            <p>Thank you for using Prescripto! 💙</p>
                            <div>
                                <p>This is an automated message, please do not reply.</p>
                                <p>&copy; ${new Date().getFullYear()} Prescripto. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        }
    };
};