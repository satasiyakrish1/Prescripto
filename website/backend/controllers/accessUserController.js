import AccessUser from '../models/accessUserModel.js';
import { validate, passwordHasher } from '../security/security.js';

export const listAccessUsers = async (req, res) => {
  try {
    const { role, active, search } = req.query;
    const filter = {};
    if (role && ['viewer', 'editor'].includes(role)) filter.role = role;
    if (active !== undefined) filter.active = active === 'true';
    if (search) {
      filter.email = { $regex: search.trim(), $options: 'i' };
    }
    const users = await AccessUser.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch access users' });
  }
};

export const createAccessUser = async (req, res) => {
  try {
    const email = validate.email(req.body.email);
    const password = String(req.body.password || '').trim();
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }
    const role = req.body.role === 'editor' ? 'editor' : 'viewer';
    const allowedRoutes = Array.isArray(req.body.allowedRoutes) ? req.body.allowedRoutes : [];
    const active = req.body.active !== false;

    const exists = await AccessUser.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    const passwordHash = await passwordHasher.hash(password);
    const user = await AccessUser.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      allowedRoutes,
      active
    });
    res.status(201).json({ success: true, user: { ...user.toObject(), passwordHash: undefined } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to create access user' });
  }
};

export const updateAccessUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, role, allowedRoutes, active } = req.body;
    const updates = {};
    if (role === 'viewer' || role === 'editor') updates.role = role;
    if (Array.isArray(allowedRoutes)) updates.allowedRoutes = allowedRoutes;
    if (typeof active === 'boolean') updates.active = active;
    if (password) {
      updates.passwordHash = await passwordHasher.hash(String(password));
    }
    const user = await AccessUser.findByIdAndUpdate(id, updates, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: { ...user.toObject(), passwordHash: undefined } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to update access user' });
  }
};

export const deleteAccessUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await AccessUser.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete access user' });
  }
};

export const loginAccessUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = await AccessUser.findOne({ email: email.toLowerCase().trim(), active: true });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    // Defer token creation to dedicated route to keep controller pure (we’ll sign in route)
    res.json({ success: true, user: { id: user._id, email: user.email, role: user.role, allowedRoutes: user.allowedRoutes } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};
