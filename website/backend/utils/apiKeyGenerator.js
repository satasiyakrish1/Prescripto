import crypto from 'crypto';

export const generateApiKey = () => {
  const buffer = crypto.randomBytes(32);
  return buffer.toString('base64').replace(/[+/=]/g, '').substring(0, 32);
};