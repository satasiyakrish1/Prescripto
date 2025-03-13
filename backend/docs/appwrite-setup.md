# Appwrite Email Notification Setup Guide

## Overview
This guide explains how to set up Appwrite to enable login email notifications for the Prescripto application.

## Prerequisites
- An Appwrite account (sign up at [cloud.appwrite.io](https://cloud.appwrite.io) if you don't have one)
- Access to the Prescripto backend codebase

## Setup Steps

### 1. Create an Appwrite Project
1. Log in to your Appwrite Console
2. Create a new project named "Prescripto"
3. Note down the Project ID

### 2. Create an API Key
1. In your Appwrite project, go to "API Keys" section
2. Create a new API key with the following permissions:
   - `functions.read`
   - `functions.write`
   - `execution.write`
3. Save the API key securely

### 3. Create an Email Function
1. Go to the "Functions" section in your Appwrite project
2. Create a new function with the following settings:
   - **Name**: SendEmailNotification
   - **Runtime**: Node.js 16.0 (or latest available)
   - **Entrypoint**: index.js
   - **Commands**: `npm install node-fetch@2`

3. Replace the function code with the following:

```javascript
const fetch = require('node-fetch');

module.exports = async function(req, res) {
  const payload = JSON.parse(req.payload || '{}');
  
  // Validate required fields
  if (!payload.to || !payload.subject || !payload.content) {
    return res.json({
      success: false,
      message: 'Missing required fields: to, subject, or content'
    }, 400);
  }
  
  // You can use any email service API here
  // This example uses a generic email service API
  try {
    // Replace with your actual email service API
    const emailResponse = await fetch('https://your-email-service-api.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_EMAIL_SERVICE_API_KEY'
      },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        html: payload.content
      })
    });
    
    const data = await emailResponse.json();
    
    return res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    return res.json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    }, 500);
  }
};
```

4. Deploy the function
5. Note down the Function ID

### 4. Update Environment Variables
Update the following variables in your `.env` file:

```
APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
APPWRITE_PROJECT_ID="your-project-id"
APPWRITE_API_KEY="your-api-key"
APPWRITE_EMAIL_FUNCTION_ID="your-function-id"
```

### 5. Email Service Integration
In the function code above, replace the placeholder email service API with an actual email service like:
- SendGrid
- Mailgun
- Amazon SES
- or any other email service provider

## Testing
1. Restart your backend server
2. Try logging in with a valid user account
3. Check the email associated with the account for the login notification

## Troubleshooting
- Check the server logs for any errors related to email sending
- Verify that all environment variables are correctly set
- Ensure the API key has the necessary permissions
- Check the Appwrite function logs for execution details