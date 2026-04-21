import express from 'express';
import authAdmin from '../middleware/authAdmin.js';
import { authRateLimiter } from '../security/security.js';
import { listAccessUsers, createAccessUser, updateAccessUser, deleteAccessUser } from '../controllers/accessUserController.js';

const router = express.Router();

// All routes require admin authentication
router.get('/', authAdmin, listAccessUsers);
router.post('/', authAdmin, authRateLimiter, createAccessUser);
router.put('/:id', authAdmin, updateAccessUser);
router.delete('/:id', authAdmin, deleteAccessUser);

export default router;
