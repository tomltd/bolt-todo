import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, CheckCircle, Circle, GripVertical, Moon, Sun } from 'lucide-react';
import type { Todo } from './types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from './lib/supabase';

interface SortableTodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDelegateToggle: (id: string) => void;
}

function SortableTodoItem({ todo, onToggle, onDelete, onDelegateToggle }: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
        isDragging ? 'opacity-50 shadow-lg scale-105' : ''
      } active:cursor-grabbing touch-manipulation`}
    >
      <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
        <GripVertical className="w-5 h-5" />
      </div>

      <button
        onClick={() => onToggle(todo.id)}
        className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors duration-200"
      >
        {todo.completed ? (
          <CheckCircle className="w-6 h-6 text-green-500 dark:text-green-400" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </button>
      
      <span className={`flex-1 ${
        todo.completed 
          ? 'line-through text-gray-400 dark:text-gray-500' 
          : 'text-gray-700 dark:text-gray-200'
      }`}>
        {todo.text}
      </span>
      
      <button
        onClick={() => onDelegateToggle(todo.id)}
        className={`px-2 py-1 rounded text-sm font-medium transition-colors duration-200 ${
          todo.delegate === 'T'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
        }`}
      >
        {todo.delegate}
      </button>

      <button
        onClick={() => onDelete(todo.id)}
        className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-200"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isDark, setIsDark] = useState(() => {
    const theme = localStorage.getItem('theme');
    return theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [user, setUser] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Check current auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      // Fetch todos when user is authenticated
      fetchTodos();
    } else {
      // Redirect to auth page or show auth UI
      setTodos([]);
    }
  }, [user]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const fetchTodos = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('position');

    if (error) {
      console.error('Error fetching todos:', error);
      return;
    }

    setTodos(data.map(todo => ({
      ...todo,
      delegate: todo.delegate || 'T' // Set default delegate to 'T' if not set
    })));
  };

  const toggleTheme = () => setIsDark(!isDark);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || !user) return;

    const position = todos.length;
    const { data, error } = await supabase
      .from('todos')
      .insert([
        {
          text: newTodo.trim(),
          position,
          user_id: user.id,
          delegate: 'T' // Set default delegate to 'T'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding todo:', error);
      return;
    }

    setTodos(prev => [...prev, data]);
    setNewTodo('');
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const { error } = await supabase
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', id);

    if (error) {
      console.error('Error toggling todo:', error);
      return;
    }

    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const toggleDelegate = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const newDelegate = todo.delegate === 'T' ? 'K' : 'T';

    const { error } = await supabase
      .from('todos')
      .update({ delegate: newDelegate })
      .eq('id', id);

    if (error) {
      console.error('Error toggling delegate:', error);
      return;
    }

    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, delegate: newDelegate } : todo
      )
    );
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
      return;
    }

    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update positions one by one
        newItems.forEach(async (item, index) => {
          const { error } = await supabase
            .from('todos')
            .update({ position: index })
            .eq('id', item.id);

          if (error) {
            console.error('Error updating position:', error);
          }
        });

        return newItems;
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Welcome to Team Cat</h1>
          <button
            onClick={() => supabase.auth.signInWithPassword({
              email: 'user@example.com',
              password: 'password123'
            })}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 transition-colors duration-200">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            Team Cat
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
            >
              Sign Out
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            >
              {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <form onSubmit={addTodo} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-colors duration-200"
            />
            <button
              type="submit"
              className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors duration-200"
            >
              <PlusCircle className="w-6 h-6" />
            </button>
          </div>
        </form>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={todos}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {todos.map(todo => (
                <SortableTodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onDelegateToggle={toggleDelegate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {todos.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            No todos yet. Add one above!
          </div>
        )}
      </div>
    </div>
  );
}

export default App;