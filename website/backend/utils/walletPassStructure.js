/**
 * Wallet Pass Structure
 * 
 * This file defines the structure for both Apple Wallet and Google Wallet passes.
 * It provides a consistent format for generating passes across different platforms.
 */

/**
 * Generate a Google Wallet pass structure
 * @param {Object} appointmentDetails - Details of the appointment
 * @returns {Object} - Google Wallet pass structure
 */
export const generateGoogleWalletStructure = (appointmentDetails) => {
  const { userData, docData, slotDate, slotTime, appointmentId } = appointmentDetails;

  // Format the date for display
  let formattedDate = slotDate;
  let dateObject = null;

  if (slotDate) {
    const dateParts = slotDate.split('_');
    if (dateParts.length === 3) {
      const day = dateParts[0];
      const month = dateParts[1];
      const year = dateParts[2];
      formattedDate = `${day}/${month}/${year}`;

      // Create date object for structured data
      dateObject = new Date(year, month - 1, day);
    }
  }

  // Create a unique ID for the object
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || 'prescripto';
  const objectId = `${issuerId}.appointment-${appointmentId}`;
  const classId = `${issuerId}.appointment`;

  // Define the class structure with enhanced styling
  const genericClass = {
    id: classId,
    issuerName: 'Prescripto Healthcare',
    reviewStatus: 'UNDER_REVIEW',
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
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
      }
    }
  };

  // Build text modules with comprehensive information
  const textModules = [
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
    }
  ];

  // Add optional fields
  if (docData?.speciality) {
    textModules.push({
      id: 'speciality',
      header: 'SPECIALITY',
      body: docData.speciality
    });
  }

  if (docData?.address) {
    const fullAddress = `${docData.address.line1 || ''} ${docData.address.line2 || ''}`.trim();
    if (fullAddress) {
      textModules.push({
        id: 'address',
        header: 'CLINIC ADDRESS',
        body: fullAddress
      });
    }
  }

  if (docData?.phone) {
    textModules.push({
      id: 'phone',
      header: 'CONTACT',
      body: docData.phone
    });
  }

  // Add appointment ID for reference
  textModules.push({
    id: 'appointmentId',
    header: 'APPOINTMENT ID',
    body: appointmentId.toString().substring(0, 8).toUpperCase()
  });

  // Define the object structure with enhanced design
  const genericObject = {
    id: objectId,
    classId: classId,
    genericType: 'GENERIC_TYPE_UNSPECIFIED',
    hexBackgroundColor: '#1a73e8', // Google Blue
    logo: {
      sourceUri: {
        uri: `${process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live'}/logo.png`
      },
      contentDescription: {
        defaultValue: {
          language: 'en-US',
          value: 'Prescripto Logo'
        }
      }
    },
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
    textModulesData: textModules,
    barcode: {
      type: 'QR_CODE',
      value: `PRESCRIPTO-APPT:${appointmentId}`,
      alternateText: appointmentId.toString().substring(0, 12)
    },
    heroImage: {
      sourceUri: {
        uri: `${process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live'}/appointment-hero.png`
      },
      contentDescription: {
        defaultValue: {
          language: 'en-US',
          value: 'Appointment Details'
        }
      }
    },
    // Add valid time period if we have a date
    ...(dateObject && {
      validTimeInterval: {
        start: {
          date: dateObject.toISOString()
        }
      }
    }),
    // Add notification settings
    hasUsers: true,
    smartTapRedemptionValue: appointmentId.toString()
  };

  return {
    objectId,
    classId,
    genericClass,
    genericObject
  };
};

/**
 * Generate a JWT claims structure for Google Wallet
 * @param {string} clientEmail - The client email from Google Auth
 * @param {string} objectId - The object ID for the pass
 * @returns {Object} - JWT claims structure
 */
export const generateJwtClaims = (clientEmail, objectId) => {
  return {
    iss: clientEmail,
    aud: 'google',
    origins: [process.env.PRODUCTION_FRONTEND_URL || 'https://prescripto.live'],
    typ: 'savetowallet',
    payload: {
      genericObjects: [{ id: objectId }]
    }
  };
};

/**
 * Generate an Apple Wallet pass structure
 * @param {Object} appointmentDetails - Details of the appointment
 * @returns {Object} - Apple Wallet pass structure
 */
export const generateAppleWalletStructure = (appointmentDetails) => {
  const { userData, docData, slotDate, slotTime, appointmentId } = appointmentDetails;

  // Format the date for display
  let formattedDate = slotDate;
  if (slotDate) {
    const dateParts = slotDate.split('_');
    if (dateParts.length === 3) {
      formattedDate = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;
    }
  }

  // Create the pass template
  return {
    passTypeIdentifier: process.env.APPLE_WALLET_PASS_TYPE_IDENTIFIER,
    teamIdentifier: process.env.APPLE_WALLET_TEAM_IDENTIFIER,
    organizationName: 'Prescripto',
    description: 'Appointment Pass',
    logoText: 'Prescripto',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(74, 85, 104)',
    labelColor: 'rgb(255, 255, 255)',
    serialNumber: appointmentId || `appointment-${Date.now()}`,
    webServiceURL: process.env.APPLE_WALLET_WEB_SERVICE_URL,
    authenticationToken: process.env.APPLE_WALLET_AUTH_TOKEN,
    formatVersion: 1,
    eventTicket: {
      primaryFields: [
        {
          key: 'event',
          label: 'APPOINTMENT',
          value: `Dr. ${docData?.name || ''}`
        }
      ],
      secondaryFields: [
        {
          key: 'date',
          label: 'DATE',
          value: formattedDate
        },
        {
          key: 'time',
          label: 'TIME',
          value: slotTime || ''
        }
      ],
      auxiliaryFields: [
        {
          key: 'patient',
          label: 'PATIENT',
          value: userData?.name || ''
        },
        docData?.speciality ? {
          key: 'speciality',
          label: 'SPECIALITY',
          value: docData.speciality
        } : null
      ].filter(Boolean),
      backFields: [
        docData?.address ? {
          key: 'address',
          label: 'ADDRESS',
          value: `${docData.address.line1 || ''} ${docData.address.line2 || ''}`.trim()
        } : null
      ].filter(Boolean),
      barcodes: [
        {
          message: `APPT:${appointmentId || `${userData?.name || ''}-${slotDate}-${slotTime}`}`,
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1'
        }
      ]
    }
  };
};