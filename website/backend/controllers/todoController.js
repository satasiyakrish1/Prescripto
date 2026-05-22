import Todo from '../models/Todo.js';
import adminModel from '../models/adminModel.js';
import { insertGoogleTaskForAdmin, updateGoogleTaskStatusForAdmin, deleteGoogleTaskForAdmin } from './googleTasksController.js';

// Get all todos
export const getTodos = async (req, res) => {
  try {
    // Scope todos to admin if available
    let query = {};
    const adminId = req.user?._id || req.admin?.id || req.admin?._id;
    if (adminId) {
      query = { $or: [{ admin: adminId }, { admin: null }, { admin: { $exists: false } }] };
    }
    const todos = await Todo.find(query).sort({ createdAt: -1 });
    res.json({ success: true, todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch todos' });
  }
};

// Create a new todo
export const createTodo = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const adminId = req.user?._id || req.admin?.id || req.admin?._id || null;
    const doc = { title };
    if (adminId) doc.admin = adminId;

    const todo = new Todo(doc);
    await todo.save();

    // Try to sync to Google Tasks if admin connected
    if (adminId) {
      try {
        const taskId = await insertGoogleTaskForAdmin(adminId, title);
        if (taskId) {
          todo.googleTaskId = taskId;
          await todo.save();
        }
      } catch (e) {
        console.warn('Google Tasks sync failed on create:', e.message);
      }
    }
    res.status(201).json({ success: true, todo });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ success: false, message: 'Failed to create todo' });
  }
};

// Update a todo
export const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
    todo.completed = !!completed;
    await todo.save();

    // Sync status to Google Tasks if linked
    const adminId = todo.admin?.toString() || (req.user?._id || req.admin?.id || req.admin?._id);
    if (adminId && todo.googleTaskId) {
      try {
        await updateGoogleTaskStatusForAdmin(adminId, todo.googleTaskId, todo.completed);
      } catch (e) {
        console.warn('Google Tasks sync failed on update:', e.message);
      }
    }

    res.json({ success: true, todo });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ success: false, message: 'Failed to update todo' });
  }
};

// Delete a todo
export const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
    const adminId = todo.admin?.toString() || (req.user?._id || req.admin?.id || req.admin?._id);
    // Delete from DB
    await Todo.findByIdAndDelete(id);
    // Try to delete from Google Tasks
    if (adminId && todo.googleTaskId) {
      try {
        await deleteGoogleTaskForAdmin(adminId, todo.googleTaskId);
      } catch (e) {
        console.warn('Google Tasks delete failed:', e.message);
      }
    }

    res.json({ success: true, message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ success: false, message: 'Failed to delete todo' });
  }
}; 
