/**
 * Google Wallet Pass Configuration
 * 
 * This file contains all configuration options for Google Wallet passes.
 * Customize these settings to match your branding and requirements.
 * 
 * Reference: https://developers.google.com/wallet/generic/rest/v1/genericclass
 */

import 'dotenv/config';

/**
 * Complete Google Wallet Pass Configuration
 * All fields from Google Wallet API with descriptions and examples
 */
export const googleWalletConfig = {

    // ============================================================
    // BASIC CLASS INFORMATION
    // ============================================================

    /**
     * Issuer Name (REQUIRED)
     * The name of the organization issuing the pass
     * This appears on the pass and in the Google Wallet app
     */
    issuerName: 'Prescripto Healthcare',

    /**
     * Class ID (REQUIRED)
     * Unique identifier for this pass class
     * Format: {issuerId}.{className}
     * Example: 3388000000123456789.appointment
     */
    classId: `${process.env.GOOGLE_WALLET_ISSUER_ID || 'prescripto'}.appointment`,

    /**
     * Status
     * Review status of the class
     * Values: UNDER_REVIEW | APPROVED | REJECTED | DRAFT
     */
    reviewStatus: 'UNDER_REVIEW',

    /**
     * Multiple Devices and Holders Allowed
     * Whether the pass can be shared across multiple devices
     */
    multipleDevicesAndHoldersAllowedStatus: 'MULTIPLE_HOLDERS',
    // Options: ONE_USER_ALL_DEVICES | ONE_USER_ONE_DEVICE | MULTIPLE_HOLDERS

    // ============================================================
    // LOCATION & GEOGRAPHIC SETTINGS
    // ============================================================

    /**
     * Geo Locations
     * Array of latitude/longitude pairs where the pass is relevant
     * Triggers location-based notifications
     */
    locations: [
        {
            kind: 'walletobjects#latLongPoint',
            latitude: 28.7041,  // Example: Delhi, India
            longitude: 77.1025
        }
        // Add more locations as needed
    ],

    /**
     * Country Code
     * ISO 3166-1 alpha-2 country code
     * Example: US, IN, GB, etc.
     */
    countryCode: 'IN',

    // ============================================================
    // VISUAL DESIGN & BRANDING
    // ============================================================

    /**
     * Card Art
     * Full card background image
     * Recommended size: 1032x336 pixels
     */
    cardArt: {
        sourceUri: {
            uri: `${process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live'}/assets/card-art.png`,
            description: 'Card background artwork'
        }
    },

    /**
     * Logo Image URL (REQUIRED)
     * Your organization's logo
     * Recommended size: 660x660 pixels
     * Displayed in top-left corner of the pass
     */
    logo: {
        sourceUri: {
            uri: `${process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live'}/logo.png`,
            description: 'Prescripto Logo'
        },
        contentDescription: {
            defaultValue: {
                language: 'en-US',
                value: 'Prescripto Healthcare Logo'
            }
        }
    },

    /**
     * Hero Image URL
     * Large banner image at the top of the pass
     * Recommended size: 1032x336 pixels
     */
    heroImage: {
        sourceUri: {
            uri: `${process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live'}/assets/appointment-hero.png`,
            description: 'Appointment hero banner'
        },
        contentDescription: {
            defaultValue: {
                language: 'en-US',
                value: 'Medical Appointment Banner'
            }
        }
    },

    /**
     * Word Mark Image URL
     * Text-based logo or brand name
     * Recommended size: 1860x480 pixels
     */
    wordMark: {
        sourceUri: {
            uri: `${process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live'}/assets/wordmark.png`,
            description: 'Prescripto wordmark'
        },
        contentDescription: {
            defaultValue: {
                language: 'en-US',
                value: 'Prescripto Healthcare'
            }
        }
    },

    /**
     * Background Color (Hex)
     * Hex color code for the pass background
     * Format: #RRGGBB
     */
    hexBackgroundColor: '#1a73e8', // Google Blue

    // ============================================================
    // HOMEPAGE & LINKS
    // ============================================================

    /**
     * Homepage URL
     * Link to your organization's website
     */
    homepageUri: {
        uri: process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live',
        description: 'Prescripto Homepage',
        localizedDescription: {
            defaultValue: {
                language: 'en-US',
                value: 'Visit Prescripto Healthcare'
            }
        }
    },

    /**
     * URL Label
     * Label for the homepage link
     */
    urlLabel: 'Visit Website',

    /**
     * Additional URLs
     * Array of additional links to display on the pass
     */
    linksModuleData: {
        uris: [
            {
                uri: `${process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live'}/appointments`,
                description: 'View All Appointments',
                localizedDescription: {
                    defaultValue: {
                        language: 'en-US',
                        value: 'Manage your appointments'
                    }
                }
            },
            {
                uri: `${process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live'}/contact`,
                description: 'Contact Support',
                localizedDescription: {
                    defaultValue: {
                        language: 'en-US',
                        value: 'Get help and support'
                    }
                }
            }
        ]
    },

    // ============================================================
    // CALLBACK SETTINGS
    // ============================================================

    /**
     * Callback URL
     * URL to receive notifications about pass events
     * Google will POST to this URL when pass events occur
     */
    callbackOptions: {
        url: `${process.env.PRODUCTION_BACKEND_URL || 'https://api.prescripto.live'}/api/wallet/callback`,
        updateRequestUrl: `${process.env.PRODUCTION_BACKEND_URL || 'https://api.prescripto.live'}/api/wallet/update-request`
    },

    // ============================================================
    // REDEMPTION SETTINGS
    // ============================================================

    /**
     * Redemption Issuers
     * List of issuer IDs that can redeem this pass
     */
    redemptionIssuers: [
        process.env.GOOGLE_WALLET_ISSUER_ID || 'prescripto'
    ],

    // ============================================================
    // SMART TAP SETTINGS
    // ============================================================

    /**
     * Enable Smart Tap
     * Allows pass to be used with NFC/contactless readers
     */
    enableSmartTap: true,

    /**
     * Smart Tap Redemption Value
     * Value transmitted during Smart Tap redemption
     * Will be set per-object (appointment ID)
     */
    // smartTapRedemptionValue: 'APPOINTMENT_ID', // Set per object

    // ============================================================
    // IMAGE MODULES
    // ============================================================

    /**
     * Image Modules
     * Additional images to display on the pass
     * Maximum 10 images
     */
    imageModulesData: [
        {
            id: 'image_module_1',
            mainImage: {
                sourceUri: {
                    uri: `${process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live'}/assets/healthcare-icon.png`,
                    description: 'Healthcare services icon'
                },
                contentDescription: {
                    defaultValue: {
                        language: 'en-US',
                        value: 'Quality Healthcare Services'
                    }
                }
            }
        }
    ],

    // ============================================================
    // LINK MODULES
    // ============================================================

    /**
     * Link Modules
     * Additional links with labels
     * These appear as buttons on the pass
     */
    linkModules: [
        {
            id: 'link_module_1',
            uri: {
                uri: `${process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live'}/reschedule`,
                description: 'Reschedule Appointment',
                localizedDescription: {
                    defaultValue: {
                        language: 'en-US',
                        value: 'Change your appointment time'
                    }
                }
            }
        },
        {
            id: 'link_module_2',
            uri: {
                uri: `${process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live'}/directions`,
                description: 'Get Directions',
                localizedDescription: {
                    defaultValue: {
                        language: 'en-US',
                        value: 'Navigate to clinic'
                    }
                }
            }
        }
    ],

    // ============================================================
    // TEXT MODULES
    // ============================================================

    /**
     * Text Modules
     * Key-value pairs of information to display
     * These are set per-object (appointment-specific)
     */
    textModulesTemplate: [
        {
            id: 'patient',
            header: 'PATIENT NAME',
            body: 'Will be set per appointment'
        },
        {
            id: 'date',
            header: 'APPOINTMENT DATE',
            body: 'Will be set per appointment'
        },
        {
            id: 'time',
            header: 'APPOINTMENT TIME',
            body: 'Will be set per appointment'
        },
        {
            id: 'speciality',
            header: 'SPECIALITY',
            body: 'Will be set per appointment'
        },
        {
            id: 'address',
            header: 'CLINIC ADDRESS',
            body: 'Will be set per appointment'
        },
        {
            id: 'phone',
            header: 'CONTACT',
            body: 'Will be set per appointment'
        },
        {
            id: 'appointmentId',
            header: 'APPOINTMENT ID',
            body: 'Will be set per appointment'
        }
    ],

    // ============================================================
    // MESSAGES
    // ============================================================

    /**
     * Messages
     * Notifications to display to users
     * Can be time-based (start/end display times)
     */
    messages: [
        {
            id: 'welcome_message',
            header: 'Welcome to Prescripto',
            body: 'Thank you for choosing Prescripto Healthcare. Your appointment details are saved in this pass.',
            messageType: 'TEXT', // TEXT | EXPIRATION_NOTIFICATION
            displayInterval: {
                start: {
                    date: new Date().toISOString()
                }
                // No end date - displays indefinitely
            }
        },
        {
            id: 'reminder_message',
            header: 'Appointment Reminder',
            body: 'Please arrive 15 minutes before your scheduled appointment time.',
            messageType: 'TEXT',
            displayInterval: {
                start: {
                    date: new Date().toISOString()
                }
                // Set end date per appointment
            }
        }
    ],

    /**
     * Message Types
     * TEXT - General informational message
     * EXPIRATION_NOTIFICATION - Shown when pass is about to expire
     */

    // ============================================================
    // INFO MODULES (DEPRECATED - Use Text Modules instead)
    // ============================================================

    /**
     * Info Modules are deprecated
     * Use textModulesData instead
     * Kept here for reference only
     */
    // infoModuleData: {
    //   labelValueRows: [
    //     {
    //       columns: [
    //         {
    //           label: 'Label',
    //           value: 'Value'
    //         }
    //       ]
    //     }
    //   ]
    // },

    // ============================================================
    // EVENT TICKET DATA (For Event-Type Passes)
    // ============================================================

    /**
     * Event Ticket Data
     * Use this section if creating event-type passes
     * For medical appointments, this is optional
     */
    eventTicketData: {
        /**
         * Event Name (REQUIRED for event tickets)
         */
        eventName: {
            defaultValue: {
                language: 'en-US',
                value: 'Medical Appointment'
            }
        },

        /**
         * Event ID
         * Unique identifier for the event
         */
        eventId: 'APPOINTMENT_ID', // Will be set per appointment

        /**
         * Venue Information
         */
        venue: {
            name: {
                defaultValue: {
                    language: 'en-US',
                    value: 'Prescripto Healthcare Clinic'
                }
            },
            address: {
                defaultValue: {
                    language: 'en-US',
                    value: 'Will be set per appointment'
                }
            }
        },

        /**
         * Venue Place ID
         * Google Maps Place ID for the venue
         */
        // venuePlaceId: 'ChIJ...',

        /**
         * Timing Information
         */
        doorsOpen: {
            // Set per appointment - 15 minutes before appointment time
        },

        startDateTime: {
            // Set per appointment - actual appointment time
        },

        endDateTime: {
            // Set per appointment - estimated end time
        },

        /**
         * Fine Print
         * Terms and conditions, policies, etc.
         */
        finePrint: {
            defaultValue: {
                language: 'en-US',
                value: 'Please bring a valid ID and insurance card. Arrive 15 minutes early for check-in.'
            }
        },

        /**
         * Custom Labels
         */
        customDoorsOpenLabel: {
            defaultValue: {
                language: 'en-US',
                value: 'Check-in Time'
            }
        },

        customConfirmationCodeLabel: {
            defaultValue: {
                language: 'en-US',
                value: 'Appointment ID'
            }
        },

        customSeatLabel: {
            defaultValue: {
                language: 'en-US',
                value: 'Room'
            }
        },

        customRowLabel: {
            defaultValue: {
                language: 'en-US',
                value: 'Floor'
            }
        },

        customSectionLabel: {
            defaultValue: {
                language: 'en-US',
                value: 'Department'
            }
        },

        customGateLabel: {
            defaultValue: {
                language: 'en-US',
                value: 'Entrance'
            }
        }
    },

    // ============================================================
    // SECURITY SETTINGS
    // ============================================================

    /**
     * Security Animation
     * Type of animation shown during redemption
     */
    securityAnimation: {
        animationType: 'FOIL_SHIMMER'
        // Options: FOIL_SHIMMER | FOIL_RIPPLE
    },

    // ============================================================
    // NOTIFICATION SETTINGS
    // ============================================================

    /**
     * Enable Notifications
     * Whether to send push notifications for this pass
     */
    enableNotifications: true,

    /**
     * Notification Settings
     */
    notificationSettings: {
        // Notify when pass is first saved
        notifyOnSave: true,

        // Notify when pass is updated
        notifyOnUpdate: true,

        // Notify before expiration
        notifyBeforeExpiration: true,
        expirationNotificationDays: 7 // Days before expiration
    },

    // ============================================================
    // BARCODE SETTINGS
    // ============================================================

    /**
     * Barcode Configuration
     * QR code, barcode, etc.
     */
    barcodeConfig: {
        type: 'QR_CODE',
        // Options: QR_CODE | AZTEC | CODE_128 | CODE_39 | EAN_8 | EAN_13 | ITF_14 | PDF_417 | UPC_A | TEXT_ONLY

        renderEncoding: 'UTF_8',

        // Show alternate text below barcode
        showCodeText: true,

        // Barcode value will be set per appointment
        // Format: PRESCRIPTO-APPT:{appointmentId}
    },

    // ============================================================
    // GROUPING SETTINGS
    // ============================================================

    /**
     * Grouping Info
     * How passes are grouped in Google Wallet
     */
    classTemplateInfo: {
        cardTemplateOverride: {
            cardRowTemplateInfos: [
                {
                    twoItems: {
                        startItem: {
                            firstValue: {
                                fields: [
                                    {
                                        fieldPath: "object.textModulesData['date']"
                                    }
                                ]
                            }
                        },
                        endItem: {
                            firstValue: {
                                fields: [
                                    {
                                        fieldPath: "object.textModulesData['time']"
                                    }
                                ]
                            }
                        }
                    }
                },
                {
                    oneItem: {
                        item: {
                            firstValue: {
                                fields: [
                                    {
                                        fieldPath: "object.textModulesData['patient']"
                                    }
                                ]
                            }
                        }
                    }
                }
            ]
        },

        /**
         * Details Template Override
         * Customize the details view layout
         */
        detailsTemplateOverride: {
            detailsItemInfos: [
                {
                    item: {
                        firstValue: {
                            fields: [
                                {
                                    fieldPath: "class.localScheduledDepartureDateTime"
                                }
                            ]
                        }
                    }
                }
            ]
        }
    },

    // ============================================================
    // LOCALIZATION
    // ============================================================

    /**
     * Localized Information
     * Support for multiple languages
     */
    localizedIssuerName: {
        defaultValue: {
            language: 'en-US',
            value: 'Prescripto Healthcare'
        },
        translatedValues: [
            {
                language: 'hi-IN',
                value: 'प्रेस्क्रिप्टो हेल्थकेयर'
            },
            {
                language: 'es-ES',
                value: 'Prescripto Salud'
            }
        ]
    },

    // ============================================================
    // VIEW UNLOCK REQUIREMENT
    // ============================================================

    /**
     * View Unlock Requirement
     * Security requirement to view pass details
     */
    viewUnlockRequirement: 'UNLOCK_NOT_REQUIRED',
    // Options: UNLOCK_NOT_REQUIRED | UNLOCK_REQUIRED_TO_VIEW

    // ============================================================
    // WIDE LOGO
    // ============================================================

    /**
     * Wide Logo
     * Alternative logo for wider displays
     * Recommended size: 1860x480 pixels
     */
    wideLogo: {
        sourceUri: {
            uri: `${process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live'}/assets/wide-logo.png`,
            description: 'Wide Prescripto logo'
        },
        contentDescription: {
            defaultValue: {
                language: 'en-US',
                value: 'Prescripto Healthcare Wide Logo'
            }
        }
    }
};

/**
 * Helper function to generate a complete class definition
 * Combines the configuration with dynamic values
 */
export function generateClassDefinition(overrides = {}) {
    return {
        id: googleWalletConfig.classId,
        issuerName: googleWalletConfig.issuerName,
        reviewStatus: googleWalletConfig.reviewStatus,
        multipleDevicesAndHoldersAllowedStatus: googleWalletConfig.multipleDevicesAndHoldersAllowedStatus,
        locations: googleWalletConfig.locations,
        countryCode: googleWalletConfig.countryCode,
        hexBackgroundColor: googleWalletConfig.hexBackgroundColor,
        logo: googleWalletConfig.logo,
        heroImage: googleWalletConfig.heroImage,
        wordMark: googleWalletConfig.wordMark,
        homepageUri: googleWalletConfig.homepageUri,
        linksModuleData: googleWalletConfig.linksModuleData,
        callbackOptions: googleWalletConfig.callbackOptions,
        redemptionIssuers: googleWalletConfig.redemptionIssuers,
        enableSmartTap: googleWalletConfig.enableSmartTap,
        imageModulesData: googleWalletConfig.imageModulesData,
        messages: googleWalletConfig.messages,
        securityAnimation: googleWalletConfig.securityAnimation,
        classTemplateInfo: googleWalletConfig.classTemplateInfo,
        localizedIssuerName: googleWalletConfig.localizedIssuerName,
        viewUnlockRequirement: googleWalletConfig.viewUnlockRequirement,
        wideLogo: googleWalletConfig.wideLogo,
        genericType: 'GENERIC_TYPE_UNSPECIFIED',
        ...overrides
    };
}

/**
 * Helper function to generate object-specific data
 * This is called for each individual appointment
 */
export function generateObjectData(appointmentDetails, overrides = {}) {
    const { userData, docData, slotDate, slotTime, appointmentId } = appointmentDetails;

    // Format date
    let formattedDate = slotDate;
    let dateObject = null;

    if (slotDate) {
        const dateParts = slotDate.split('_');
        if (dateParts.length === 3) {
            const day = dateParts[0];
            const month = dateParts[1];
            const year = dateParts[2];
            formattedDate = `${day}/${month}/${year}`;
            dateObject = new Date(year, month - 1, day);
        }
    }

    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || 'prescripto';
    const objectId = `${issuerId}.appointment-${appointmentId}`;

    return {
        id: objectId,
        classId: googleWalletConfig.classId,
        genericType: 'GENERIC_TYPE_UNSPECIFIED',
        hexBackgroundColor: googleWalletConfig.hexBackgroundColor,
        logo: googleWalletConfig.logo,
        cardTitle: {
            defaultValue: {
                language: 'en-US',
                value: 'Medical Appointment'
            }
        },
        subheader: {
            defaultValue: {
                language: 'en-US',
                value: 'Healthcare Appointment'
            }
        },
        header: {
            defaultValue: {
                language: 'en-US',
                value: `Dr. ${docData?.name || 'Doctor'}`
            }
        },
        textModulesData: [
            {
                id: 'patient',
                header: 'PATIENT NAME',
                body: userData?.name || 'Patient'
            },
            {
                id: 'date',
                header: 'APPOINTMENT DATE',
                body: formattedDate
            },
            {
                id: 'time',
                header: 'APPOINTMENT TIME',
                body: slotTime || 'TBD'
            },
            docData?.speciality && {
                id: 'speciality',
                header: 'SPECIALITY',
                body: docData.speciality
            },
            docData?.address && {
                id: 'address',
                header: 'CLINIC ADDRESS',
                body: `${docData.address.line1 || ''} ${docData.address.line2 || ''}`.trim()
            },
            docData?.phone && {
                id: 'phone',
                header: 'CONTACT',
                body: docData.phone
            },
            {
                id: 'appointmentId',
                header: 'APPOINTMENT ID',
                body: appointmentId.toString().substring(0, 8).toUpperCase()
            }
        ].filter(Boolean),
        barcode: {
            type: googleWalletConfig.barcodeConfig.type,
            value: `PRESCRIPTO-APPT:${appointmentId}`,
            alternateText: appointmentId.toString().substring(0, 12)
        },
        heroImage: googleWalletConfig.heroImage,
        ...(dateObject && {
            validTimeInterval: {
                start: {
                    date: dateObject.toISOString()
                }
            }
        }),
        hasUsers: true,
        smartTapRedemptionValue: appointmentId.toString(),
        ...overrides
    };
}

export default googleWalletConfig;
