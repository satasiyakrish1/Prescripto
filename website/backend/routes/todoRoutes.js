import express from 'express';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../controllers/todoController.js';
import authAdmin from '../middleware/authAdmin.js';

const router = express.Router();

// Apply admin authentication middleware to all routes
router.use(authAdmin);

// Get all todos
router.get('/', getTodos);

// Create a new todo
router.post('/', createTodo);

// Update a todo
router.put('/:id', updateTodo);

// Delete a todo
router.delete('/:id', deleteTodo);

export default router; 