import express from 'express';
import {
  getInventory,
  getInventoryStats,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  searchInventory
} from '../controllers/inventoryController.js';
import authAdminOrPharmacy from '../middleware/authAdminOrPharmacy.js';

const inventoryRouter = express.Router();

// Protected routes - require authentication
inventoryRouter.use(authAdminOrPharmacy);

// GET /api/inventory - Get all inventory items with filtering and pagination
inventoryRouter.get('/', getInventory);

// GET /api/inventory/search - Search inventory items
inventoryRouter.get('/search', searchInventory);

// GET /api/inventory/stats - Get inventory statistics
inventoryRouter.get('/stats', getInventoryStats);

// POST /api/inventory - Add new inventory item
inventoryRouter.post('/', addInventoryItem);

// PUT /api/inventory/:id - Update inventory item
inventoryRouter.put('/:id', updateInventoryItem);

// DELETE /api/inventory/:id - Delete inventory item
inventoryRouter.delete('/:id', deleteInventoryItem);

export default inventoryRouter;