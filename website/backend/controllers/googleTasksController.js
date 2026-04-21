import { google } from 'googleapis';
import adminModel from '../models/adminModel.js';

const TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks';
const EMAIL_SCOPE = 'https://www.googleapis.com/auth/userinfo.email';

const getTasksRedirectUri = () => {
  if (process.env.GOOGLE_TASKS_REDIRECT_URI) return process.env.GOOGLE_TASKS_REDIRECT_URI;
  // If a generic Google redirect is provided, reuse its origin and point to our tasks callback
  if (process.env.GOOGLE_REDIRECT_URI) {
    try {
      const url = new URL(process.env.GOOGLE_REDIRECT_URI);
      return `${url.origin}/api/admin/google-tasks/callback`;
    } catch {
      // ignore parsing error
    }
  }
  const base = process.env.PRODUCTION_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:4000';
  return `${base}/api/admin/google-tasks/callback`;
};

const createOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getTasksRedirectUri()
  );
};

export const getAuthUrl = async (req, res) => {
  try {
    if (!req.admin || !(req.admin.id || req.admin._id)) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' });
    }
    const adminId = req.admin.id || req.admin._id;
    const oauth2Client = createOAuthClient();
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [TASKS_SCOPE, EMAIL_SCOPE],
      state: `admin_${adminId}`,
      prompt: 'consent',
      include_granted_scopes: true
    });
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Error generating Google Tasks auth URL:', error);
    res.status(500).json({ success: false, message: 'Failed to generate authorization URL' });
  }
};

export const handleCallback = async (req, res) => {
  const frontendUrl = process.env.NODE_ENV === 'production'
    ? (process.env.PRODUCTION_FRONTEND_URL || process.env.FRONTEND_URL || 'https://prescripto.live')
    : (process.env.FRONTEND_URL || 'http://localhost:5173');
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect(`${frontendUrl}/todo-list?error=${encodeURIComponent('Missing authorization code or state')}`);
    }
    const adminId = state.replace('admin_', '');
    const admin = await adminModel.findById(adminId);
    if (!admin) {
      return res.redirect(`${frontendUrl}/todo-list?error=${encodeURIComponent('Admin not found')}`);
    }
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens?.access_token) {
      throw new Error('Failed to obtain access token');
    }
    oauth2Client.setCredentials(tokens);
    // Get email
    const oauth2 = google.oauth2('v2');
    const { data: googleUser } = await oauth2.userinfo.get({ auth: oauth2Client });
    // Preserve existing refresh_token if Google didn't return a new one
    const existing = admin.googleTasksTokens || {};
    const mergedTokens = {
      ...tokens,
      refresh_token: tokens.refresh_token || existing.refresh_token || null
    };
    admin.googleTasksTokens = { ...mergedTokens, obtained_at: Date.now(), scopes: [TASKS_SCOPE, EMAIL_SCOPE] };
    admin.googleTasksEmail = googleUser?.email || null;
    admin.googleTasksConnectedAt = new Date();
    admin.googleTasksDefaultListId = '@default';
    await admin.save();
    return res.redirect(`${frontendUrl}/todo-list?status=google_tasks_connected`);
  } catch (error) {
    console.error('Error handling Google Tasks callback:', error);
    return res.redirect(`${frontendUrl}/todo-list?error=${encodeURIComponent('Google Tasks connection failed')}`);
  }
};

export const getStatus = async (req, res) => {
  try {
    const adminId = req.admin?.id || req.admin?._id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const admin = await adminModel.findById(adminId).select('googleTasksEmail googleTasksTokens googleTasksConnectedAt');
    let connected = false;
    let reason = null;
    if (admin?.googleTasksTokens?.access_token || admin?.googleTasksTokens?.refresh_token) {
      try {
        const { tasks } = await getAuthedTasksClient(admin);
        // Lightweight check: fetch default list metadata
        await tasks.tasklists.get({ tasklist: admin.googleTasksDefaultListId || '@default' });
        connected = true;
      } catch (e) {
        reason = e.message || 'Token invalid';
      }
    }
    res.json({
      success: true,
      connected,
      email: admin?.googleTasksEmail || null,
      connectedAt: admin?.googleTasksConnectedAt || null,
      reason
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get Google Tasks status' });
  }
};

// Internal helper: returns authed tasks client and persists refreshed tokens
const getAuthedTasksClient = async (admin) => {
  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(admin.googleTasksTokens || {});
  oauth2Client.on('tokens', async (tokens) => {
    try {
      const a = await adminModel.findById(admin._id);
      a.googleTasksTokens = {
        ...(a.googleTasksTokens || {}),
        ...tokens,
        obtained_at: Date.now()
      };
      await a.save();
    } catch (e) {
      console.warn('Failed to persist refreshed Google tokens:', e.message);
    }
  });
  const tasks = google.tasks({ version: 'v1', auth: oauth2Client });
  return { oauth2Client, tasks };
};

// Helper to insert a task for the admin
export const insertGoogleTaskForAdmin = async (adminId, title) => {
  const admin = await adminModel.findById(adminId);
  if (!admin?.googleTasksTokens) return null;
  try {
    const { tasks } = await getAuthedTasksClient(admin);
    const { data } = await tasks.tasks.insert({
      tasklist: admin.googleTasksDefaultListId || '@default',
      requestBody: { title }
    });
    return data?.id || null;
  } catch (e) {
    if (String(e.message).includes('invalid_grant') || String(e.message).includes('401')) {
      // Invalidate tokens to force reconnect
      admin.googleTasksTokens = null;
      await admin.save();
    }
    throw e;
  }
};

export const updateGoogleTaskStatusForAdmin = async (adminId, taskId, completed) => {
  const admin = await adminModel.findById(adminId);
  if (!admin?.googleTasksTokens || !taskId) return false;
  try {
    const { tasks } = await getAuthedTasksClient(admin);
    await tasks.tasks.patch({
      tasklist: admin.googleTasksDefaultListId || '@default',
      task: taskId,
      requestBody: {
        status: completed ? 'completed' : 'needsAction',
        completed: completed ? (new Date()).toISOString() : null
      }
    });
    return true;
  } catch (e) {
    if (String(e.message).includes('invalid_grant') || String(e.message).includes('401')) {
      admin.googleTasksTokens = null;
      await admin.save();
    }
    throw e;
  }
};

export const deleteGoogleTaskForAdmin = async (adminId, taskId) => {
  const admin = await adminModel.findById(adminId);
  if (!admin?.googleTasksTokens || !taskId) return false;
  try {
    const { tasks } = await getAuthedTasksClient(admin);
    await tasks.tasks.delete({
      tasklist: admin.googleTasksDefaultListId || '@default',
      task: taskId
    });
    return true;
  } catch (e) {
    if (String(e.message).includes('invalid_grant') || String(e.message).includes('401')) {
      admin.googleTasksTokens = null;
      await admin.save();
    }
    throw e;
  }
};

export const disconnect = async (req, res) => {
  try {
    const adminId = req.admin?.id || req.admin?._id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const admin = await adminModel.findById(adminId);
    admin.googleTasksTokens = null;
    admin.googleTasksEmail = null;
    admin.googleTasksConnectedAt = null;
    await admin.save();
    res.json({ success: true, message: 'Disconnected from Google Tasks' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to disconnect' });
  }
};
