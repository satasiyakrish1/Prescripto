# Certificate Files for Apple Wallet Pass

This directory should contain the following certificate files:

1. `certificate.pem` - Your Apple Wallet Pass Type certificate
2. `key.pem` - Your private key for the certificate
3. `wwdr.pem` - Apple's WWDR (Worldwide Developer Relations) certificate

## How to obtain these files

1. Generate a Certificate Signing Request (CSR) using OpenSSL
2. Create a Pass Type ID in your Apple Developer account
3. Generate a certificate using the CSR
4. Download and convert the certificate to PEM format
5. Download Apple's WWDR certificate and convert it to PEM format

For detailed instructions, see Apple's documentation: https://developer.apple.com/documentation/walletpasses

Without these files, the wallet pass generation will fail with certificate-related errors.