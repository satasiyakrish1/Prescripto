import React, { useMemo, useState } from 'react';

const initialTasks = [];

export default function TodoList() {
  const [tasks, setTasks] = useState(initialTasks);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'active') return tasks.filter(t => !t.completed);
    if (filter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
  }, [tasks, filter]);

  function addTask(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setTasks(prev => [{ id: Date.now(), text: value, completed: false }, ...prev]);
    setText('');
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function removeTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function clearCompleted() {
    setTasks(prev => prev.filter(t => !t.completed));
  }

  return (
    <div className="min-h-[60vh] flex items-start justify-center py-10">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-6">Tasks</h1>

        <form onSubmit={addTask} className="flex gap-2 mb-6">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Add a task"
            aria-label="Add a task"
            className="flex-1 h-11 rounded-md border border-gray-200 bg-white px-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          <button
            type="submit"
            className="h-11 px-4 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-black focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            Add
          </button>
        </form>

        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex rounded-md border border-gray-200 p-0.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 h-8 text-sm rounded ${filter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 h-8 text-sm rounded ${filter === 'active' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 h-8 text-sm rounded ${filter === 'completed' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Completed
            </button>
          </div>

          <button
            onClick={clearCompleted}
            disabled={!tasks.some(t => t.completed)}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40"
          >
            Clear completed
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-lg p-10 text-center text-gray-500">
            <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">✓</div>
            No tasks yet
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map(item => (
              <li key={item.id} className="group border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between">
                <label className="flex items-center gap-3 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleTask(item.id)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    aria-label={item.text}
                  />
                  <span className={`text-sm text-gray-900 ${item.completed ? 'line-through text-gray-500' : ''}`}>{item.text}</span>
                </label>
                <button
                  onClick={() => removeTask(item.id)}
                  className="opacity-60 group-hover:opacity-100 text-gray-500 hover:text-gray-900 transition"
                  aria-label="Delete task"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
