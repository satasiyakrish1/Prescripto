import React, { useState, useEffect, useContext } from 'react';
import { Plus, Trash2, Check, Clock, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { DoctorContext } from '../../context/DoctorContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const TodoList = () => {
  const { dToken } = useContext(DoctorContext);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/doctor/todos`, {
        headers: {
          'Content-Type': 'application/json',
          'dToken': dToken
        }
      });

      if (response.data.success) {
        setTodos(response.data.todos);
      } else {
        toast.error(response.data.message || 'Failed to fetch todos');
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const response = await axios.post(
        `${backendUrl}/api/doctor/todos`,
        { title: newTodo },
        {
          headers: {
            'Content-Type': 'application/json',
            'dToken': dToken
          }
        }
      );

      if (response.data.success) {
        setTodos([response.data.todo, ...todos]);
        setNewTodo('');
        toast.success('Task added successfully');
      } else {
        toast.error(response.data.message || 'Failed to add task');
      }
    } catch (error) {
      console.error('Error adding todo:', error);
      toast.error(error.response?.data?.message || 'Failed to add task');
    }
  };

  const toggleTodo = async (id) => {
    try {
      const todo = todos.find(t => t._id === id);
      const response = await axios.put(
        `${backendUrl}/api/doctor/todos/${id}`,
        { completed: !todo.completed },
        {
          headers: {
            'Content-Type': 'application/json',
            'dToken': dToken
          }
        }
      );

      if (response.data.success) {
        setTodos(todos.map(t => 
          t._id === id ? { ...t, completed: !t.completed } : t
        ));
        toast.success('Task updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const deleteTodo = async (id) => {
    try {
      const response = await axios.delete(`${backendUrl}/api/doctor/todos/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'dToken': dToken
        }
      });

      if (response.data.success) {
        setTodos(todos.filter(t => t._id !== id));
        toast.success('Task deleted successfully');
      } else {
        toast.error(response.data.message || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'completed') return todo.completed;
    if (filter === 'pending') return !todo.completed;
    return true;
  });

  const pendingCount = todos.filter(todo => !todo.completed).length;
  const completedCount = todos.filter(todo => todo.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Daily Tasks</h1>
          <p className="text-gray-600">Stay organized and productive</p>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
              <span className="text-gray-600">{pendingCount} Pending</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-600">{completedCount} Completed</span>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
          {/* Add Todo Form */}
          <form onSubmit={addTodo} className="mb-8">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={!newTodo.trim()}
                className="px-8 py-4 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center gap-3 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Task</span>
              </button>
            </div>
          </form>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { key: 'all', label: 'All Tasks', icon: Circle },
              { key: 'pending', label: 'Pending', icon: Clock },
              { key: 'completed', label: 'Completed', icon: CheckCircle2 }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium transform hover:scale-105 ${
                  filter === key
                    ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-white shadow-md border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {key !== 'all' && (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    filter === key 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {key === 'pending' ? pendingCount : completedCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Todo List */}
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent absolute top-0"></div>
              </div>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">No tasks found</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "Add your first task to get started!"
                  : `No ${filter} tasks at the moment.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTodos.map((todo, index) => (
                <div
                  key={todo._id}
                  className={`group flex items-center justify-between p-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                    todo.completed
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:shadow-md'
                      : 'bg-white/80 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleTodo(todo._id)}
                      className={`relative w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                        todo.completed
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-500 text-white shadow-lg'
                          : 'border-gray-300 hover:border-blue-500 hover: #5f6FFF'
                      }`}
                    >
                      {todo.completed && <Check className="w-4 h-4" />}
                    </button>
                    <div className="flex flex-col">
                      <span
                        className={`text-lg transition-all duration-200 ${
                          todo.completed 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-800 font-medium'
                        }`}
                      >
                        {todo.title}
                      </span>
                      <span className="text-sm text-gray-500 mt-1">
                        {new Date(todo.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo._id)}
                    className="p-3 text-gray-400 hover:text-red-500 transition-all duration-200 rounded-xl hover:bg-red-50 transform hover:scale-110 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          {todos.length > 0 && (
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-primary-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-bold text-blue-600">
                  {Math.round((completedCount / todos.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-primary to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(completedCount / todos.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoList; 