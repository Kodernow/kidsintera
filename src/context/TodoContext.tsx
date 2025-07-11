import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Todo, TodoStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface TodoContextType {
  todos: Todo[];
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  getTodosByStatus: (status: TodoStatus) => Todo[];
  moveTodoToStatus: (id: string, newStatus: TodoStatus) => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load todos from Supabase
  const loadTodos = async () => {
    if (!user) {
      setTodos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert Supabase data to Todo format
      const formattedTodos: Todo[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status as TodoStatus,
        createdAt: new Date(item.created_at).getTime(),
        dueDate: item.due_date ? new Date(item.due_date).getTime() : undefined,
      }));

      setTodos(formattedTodos);
    } catch (error: any) {
      console.error('Error loading todos:', error);
      
      // Fallback to localStorage
      try {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
          setTodos(JSON.parse(savedTodos));
          toast.error('Using offline todos. Please check your connection.');
        }
      } catch {
        toast.error('Failed to load todos');
      }
    } finally {
      setLoading(false);
    }
  };

  // Migrate localStorage todos to Supabase
  const migrateTodos = async () => {
    if (!user) return;

    try {
      const savedTodos = localStorage.getItem('todos');
      if (savedTodos) {
        const localTodos: Todo[] = JSON.parse(savedTodos);
        
        for (const todo of localTodos) {
          await supabase
            .from('todos')
            .insert({
              id: todo.id,
              user_id: user.id,
              title: todo.title,
              description: todo.description,
              status: todo.status,
              due_date: todo.dueDate ? new Date(todo.dueDate).toISOString() : null,
              created_at: new Date(todo.createdAt).toISOString(),
            });
        }
        
        // Remove from localStorage after successful migration
        localStorage.removeItem('todos');
        toast.success('Migrated todos to database');
        
        // Reload todos from Supabase
        await loadTodos();
      }
    } catch (error) {
      console.error('Error migrating todos:', error);
    }
  };

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

  const addTodo = async (todo: Omit<Todo, 'id' | 'createdAt'>) => {
    if (!user) {
      toast.error('Please sign in to add todos');
      return;
    }

    const newTodo: Todo = {
      ...todo,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    
    try {
      const { error } = await supabase
        .from('todos')
        .insert({
          id: newTodo.id,
          user_id: user.id,
          title: newTodo.title,
          description: newTodo.description,
          status: newTodo.status,
          due_date: newTodo.dueDate ? new Date(newTodo.dueDate).toISOString() : null,
        });

      if (error) throw error;

      setTodos(prevTodos => [...prevTodos, newTodo]);
      toast.success('Todo added successfully');
    } catch (error: any) {
      console.error('Error adding todo:', error);
      toast.error('Failed to add todo');
    }
  };

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    if (!user) {
      toast.error('Please sign in to update todos');
      return;
    }

    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.dueDate !== undefined) {
        updateData.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null;
      }

      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === id 
            ? { ...todo, ...updates } 
            : todo
        )
      );
      toast.success('Todo updated successfully');
    } catch (error: any) {
      console.error('Error updating todo:', error);
      toast.error('Failed to update todo');
    }
  };

  const deleteTodo = async (id: string) => {
    if (!user) {
      toast.error('Please sign in to delete todos');
      return;
    }

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
      toast.success('Todo deleted successfully');
    } catch (error: any) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete todo');
    }
  };

  const getTodosByStatus = (status: TodoStatus) => {
    return todos.filter(todo => todo.status === status);
  };

  const moveTodoToStatus = async (id: string, newStatus: TodoStatus) => {
    await updateTodo(id, { status: newStatus });
  };

  return (
    <TodoContext.Provider 
      value={{ 
        todos,
        loading,
        addTodo, 
        updateTodo, 
        deleteTodo, 
        getTodosByStatus,
        moveTodoToStatus,
        loadTodos
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};