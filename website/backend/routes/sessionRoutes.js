import express from 'express';
import authAdmin from '../middleware/authAdmin.js';
import { listAdminSessions, revokeAdminSession, revokeOtherAdminSessions, heartbeatAdminSession } from '../controllers/sessionController.js';

const router = express.Router();

router.get('/admin/sessions', authAdmin, listAdminSessions);
router.post('/admin/sessions/:id/revoke', authAdmin, revokeAdminSession);
router.post('/admin/sessions/revoke-others', authAdmin, revokeOtherAdminSessions);
router.post('/admin/sessions/heartbeat', authAdmin, heartbeatAdminSession);

export default router;
