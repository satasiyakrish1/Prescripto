import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  // Optional references to either admin or doctor
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  googleTaskId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add a compound index to ensure a todo belongs to either an admin or a doctor, but not both
todoSchema.index({ admin: 1, doctor: 1 }, { unique: true, sparse: true });

// Check if the model exists before creating it
const Todo = mongoose.models.Todo || mongoose.model('Todo', todoSchema);

export default Todo; 
