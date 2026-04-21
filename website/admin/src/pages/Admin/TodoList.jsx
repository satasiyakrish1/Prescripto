import React, { useState, useEffect, useContext } from 'react';
import { Plus, Trash2, Check, Clock, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const TodoList = () => {
  const { aToken } = useContext(AdminContext);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [gTasks, setGTasks] = useState({ connected: false, email: null, checking: true });
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  useEffect(() => {
    fetchTodos();
    fetchGoogleTasksStatus();
  }, []);

  const fetchGoogleTasksStatus = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/admin/google-tasks/status`, {
        headers: { 'aToken': aToken }
      });
      if (res.data?.success) {
        setGTasks({
          connected: !!res.data.connected,
          email: res.data.email || null,
          checking: false
        });
      } else {
        setGTasks({ connected: false, email: null, checking: false });
      }
    } catch (e) {
      setGTasks({ connected: false, email: null, checking: false });
    }
  };

  const connectGoogleTasks = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/admin/google-tasks/auth-url`, {
        headers: { 'aToken': aToken }
      });
      if (res.data?.success && res.data.authUrl) {
        window.location.href = res.data.authUrl;
      } else {
        toast.error('Failed to start Google Tasks connection');
      }
    } catch (e) {
      toast.error('Failed to start Google Tasks connection');
    }
  };

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/admin/todos`, {
        headers: {
          'Content-Type': 'application/json',
          'aToken': aToken
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
        `${backendUrl}/api/admin/todos`,
        { title: newTodo },
        {
          headers: {
            'Content-Type': 'application/json',
            'aToken': aToken
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
        `${backendUrl}/api/admin/todos/${id}`,
        { completed: !todo.completed },
        {
          headers: {
            'Content-Type': 'application/json',
            'aToken': aToken
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
      const response = await axios.delete(`${backendUrl}/api/admin/todos/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'aToken': aToken
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
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Daily Tasks</h1>
          <div className="flex items-center gap-2">
            {!gTasks.connected ? (
              <button
                onClick={connectGoogleTasks}
                className="px-2.5 py-1 text-[12px] rounded-md border border-gray-300 hover:bg-gray-50"
              >
                Connect Google Tasks
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] rounded bg-gray-100 text-gray-700">
                  Google Tasks • {gTasks.email || 'connected'}
                </span>
                <button
                  onClick={async () => {
                    try {
                      await axios.post(`${backendUrl}/api/admin/google-tasks/disconnect`, {}, {
                        headers: { 'aToken': aToken }
                      });
                      toast.success('Disconnected from Google Tasks');
                      setGTasks({ connected: false, email: null, checking: false });
                    } catch {
                      toast.error('Failed to disconnect');
                    }
                  }}
                  className="px-2 py-0.5 text-[11px] rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  Disconnect
                </button>
              </div>
            )}
            <span className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-700">{pendingCount} pending</span>
            <span className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-700">{completedCount} done</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <form onSubmit={addTodo} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a task..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
              />
              <button
                type="submit"
                disabled={!newTodo.trim()}
                className="px-3 py-2 bg-black text-white rounded-md text-sm disabled:opacity-50"
                aria-label="Add task"
                title="Add"
              >
                <Plus className="w-4 h-4 pointer-events-none" />
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all', label: 'All', icon: Circle },
              { key: 'pending', label: 'Pending', icon: Clock },
              { key: 'completed', label: 'Done', icon: CheckCircle2 }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-2.5 py-1 rounded-md text-[12px] flex items-center gap-1 border ${
                  filter === key
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {key !== 'all' && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                    {key === 'pending' ? pendingCount : completedCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-28">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-black"></div>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">
                {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTodos.map((todo) => (
                <div
                  key={todo._id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    todo.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTodo(todo._id)}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                        todo.completed
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {todo.completed && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <div className={`text-sm ${
                        todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                      }`}>
                        {todo.title}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {new Date(todo.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo._id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {todos.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[12px] text-gray-600">Progress</span>
                <span className="text-[12px] text-gray-800">
                  {Math.round((completedCount / todos.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-black h-2 rounded-full"
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
