import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, checkTableExists } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { Todo, TodoContextType } from '../types';

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  // Load todos from Supabase
  const loadTodos = async () => {
    if (!user) {
      setTodos([]);
      setLoading(false);
      return;
    }

    // Check if the table exists first
    const tableExists = await checkTableExists('todos');
    if (!tableExists) {
      console.warn('todos table does not exist, using localStorage');
      try {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
          setTodos(JSON.parse(savedTodos));
        }
        toast('Using local todos. Database tables not found.', { icon: '⚠️' });
      } catch {
        setTodos([]);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTodos(data || []);
    } catch (error: any) {
      console.error('Error loading todos:', error);
      
      // Fallback to localStorage
      try {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
          setTodos(JSON.parse(savedTodos));
        }
        toast.error('Using offline todos. Please check your connection.');
      } catch {
        setTodos([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save todos to localStorage as backup
  const saveToLocalStorage = (todosToSave: Todo[]) => {
    try {
      localStorage.setItem('todos', JSON.stringify(todosToSave));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Add new todo
  const addTodo = async (title: string, description?: string, dueDate?: Date): Promise<void> => {
    if (!user) {
      toast.error('Please sign in to add todos');
      return;
    }

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title,
      description: description || null,
      status: 'todo',
      due_date: dueDate || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistically update UI
    const updatedTodos = [newTodo, ...todos];
    setTodos(updatedTodos);
    saveToLocalStorage(updatedTodos);

    try {
      const { error } = await supabase
        .from('todos')
        .insert({
          id: newTodo.id,
          user_id: newTodo.user_id,
          title: newTodo.title,
          description: newTodo.description,
          status: newTodo.status,
          due_date: newTodo.due_date,
        });

      if (error) throw error;

      toast.success('Todo added successfully!');
    } catch (error: any) {
      console.error('Error adding todo:', error);
      toast.error('Failed to sync todo. Saved locally.');
    }
  };

  // Update todo
  const updateTodo = async (id: string, updates: Partial<Todo>): Promise<void> => {
    if (!user) {
      toast.error('Please sign in to update todos');
      return;
    }

    // Optimistically update UI
    const updatedTodos = todos.map(todo =>
      todo.id === id
        ? { ...todo, ...updates, updated_at: new Date().toISOString() }
        : todo
    );
    setTodos(updatedTodos);
    saveToLocalStorage(updatedTodos);

    try {
      const { error } = await supabase
        .from('todos')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Todo updated successfully!');
    } catch (error: any) {
      console.error('Error updating todo:', error);
      toast.error('Failed to sync todo update. Saved locally.');
    }
  };

  // Delete todo
  const deleteTodo = async (id: string): Promise<void> => {
    if (!user) {
      toast.error('Please sign in to delete todos');
      return;
    }

    // Optimistically update UI
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    saveToLocalStorage(updatedTodos);

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Todo deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to sync todo deletion. Removed locally.');
    }
  };

  // Move todo to different status
  const moveTodoToStatus = async (id: string, status: 'todo' | 'in_progress' | 'done'): Promise<void> => {
    await updateTodo(id, { status });
  };

  // Migrate localStorage todos to Supabase
  const migrateTodos = async () => {
    if (!user) return;

    try {
      const savedTodos = localStorage.getItem('todos');
      if (savedTodos) {
        const localTodos: Todo[] = JSON.parse(savedTodos);
        
        if (localTodos.length > 0) {
          // Check if user already has todos in Supabase
          const { data: existingTodos } = await supabase
            .from('todos')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          if (!existingTodos || existingTodos.length === 0) {
            // Migrate local todos to Supabase
            const todosToInsert = localTodos.map(todo => ({
              id: todo.id,
              user_id: user.id,
              title: todo.title,
              description: todo.description,
              status: todo.status,
              due_date: todo.due_date,
              created_at: todo.created_at,
              updated_at: todo.updated_at,
            }));

            const { error } = await supabase
              .from('todos')
              .insert(todosToInsert);

            if (error) throw error;

            toast.success('Migrated local todos to database');
            localStorage.removeItem('todos');
          }
        }
      }
    } catch (error) {
      console.error('Error migrating todos:', error);
    }
  };

  // Load todos when user changes
  useEffect(() => {
    if (user) {
      loadTodos().then(() => {
        // Auto-migrate on first load
        migrateTodos();
      });
    } else {
      setTodos([]);
      setLoading(false);
    }
  }, [user]);

  // Get todos by status
  const getTodosByStatus = (status: 'todo' | 'in_progress' | 'done') => {
    return todos.filter(todo => todo.status === status);
  };

  // Get overdue todos
  const getOverdueTodos = () => {
    const now = new Date();
    return todos.filter(todo => 
      todo.due_date && 
      new Date(todo.due_date) < now && 
      todo.status !== 'done'
    );
  };

  return (
    <TodoContext.Provider
      value={{
        todos,
        loading,
        addTodo,
        updateTodo,
        deleteTodo,
        moveTodoToStatus,
        getTodosByStatus,
        getOverdueTodos,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};