import ActiveSession from '../models/activeSessionModel.js';
import { v4 as uuidv4 } from 'uuid';

export const listAdminSessions = async (req, res) => {
  try {
    const adminId = req.admin.id || req.admin._id;
    let sessions = await ActiveSession.find({ adminId }).sort({ lastSeen: -1 });
    // Seed a session for legacy tokens without sessionId if none exist
    if (!sessions.length) {
      const now = new Date();
      const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const session = await ActiveSession.create({
        adminId,
        sessionId: uuidv4(),
        issuedAt: now,
        expiresAt: expires,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown IP',
        userAgent: req.headers['user-agent'] || 'Unknown User Agent',
        deviceInfo: req.headers['user-agent']?.split('(')[1]?.split(')')[0] || 'Unknown Device'
      });
      sessions = [session];
    }
    res.json({ success: true, data: sessions });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const revokeAdminSession = async (req, res) => {
  try {
    const adminId = req.admin.id || req.admin._id;
    const { id } = req.params;
    const session = await ActiveSession.findOne({ _id: id, adminId });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    session.revoked = true;
    session.revokedAt = new Date();
    await session.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const revokeOtherAdminSessions = async (req, res) => {
  try {
    const adminId = req.admin.id || req.admin._id;
    const currentSessionId = req.session?.id || req.admin.sessionId || null;
    await ActiveSession.updateMany(
      currentSessionId
        ? { adminId, sessionId: { $ne: currentSessionId }, revoked: false }
        : { adminId, revoked: false },
      { $set: { revoked: true, revokedAt: new Date() } }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const heartbeatAdminSession = async (req, res) => {
  try {
    const adminId = req.admin.id || req.admin._id;
    const currentSessionId = req.session?.id || req.admin.sessionId || null;
    if (!currentSessionId) {
      // Legacy token without sessionId; accept heartbeat but do nothing
      return res.json({ success: true, legacy: true });
    }
    const session = await ActiveSession.findOne({ adminId, sessionId: currentSessionId });
    if (!session || session.revoked) return res.status(401).json({ success: false, message: 'Session invalid' });
    session.lastSeen = new Date();
    await session.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
