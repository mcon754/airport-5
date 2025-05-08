import React, { useState, useEffect } from 'react';
import './App.css';
import TaskListView from './components/TaskListView';

// Define Task interface
interface Task {
  id: string;
  text: string;
  subtasks?: Task[];
}

// Define stack item interface for navigation
interface StackItem {
  tasks: Task[];
  parentTaskId?: string;
}

// Storage key for localStorage
const STORAGE_KEY = 'airport-task-stack';

// Main App component
const App: React.FC = () => {
  // Initialize stack from localStorage or use default
  const [stack, setStack] = useState<StackItem[]>(() => {
    try {
      // Try to load from localStorage
      const savedStack = localStorage.getItem(STORAGE_KEY);
      if (savedStack) {
        return JSON.parse(savedStack);
      }
    } catch (error) {
      console.error('Failed to load tasks from localStorage:', error);
    }
    
    // Default initial stack
    return [
      {
        tasks: [
          { id: '1', text: 'Sample Task 1' },
          { id: '2', text: 'Sample Task 2' },
        ],
        parentTaskId: undefined
      },
    ];
  });
  
  // Save to localStorage whenever stack changes
  useEffect(() => {
    try {
      // Store data in localStorage for offline use
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
      
      // Also store the last update timestamp
      localStorage.setItem(`${STORAGE_KEY}-updated`, new Date().toISOString());
      
      // Notify the user that data is saved (only in standalone mode)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Data saved for offline use');
      }
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
      
      // Show error notification if in standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        alert('Failed to save your changes. Please check your storage settings.');
      }
    }
  }, [stack]);
  
  // Check if running in standalone mode (PWA)
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      console.log('Running as installed PWA');
      
      // Listen for online/offline events
      const handleOnlineStatus = () => {
        if (navigator.onLine) {
          console.log('App is online');
        } else {
          console.log('App is offline');
        }
      };
      
      window.addEventListener('online', handleOnlineStatus);
      window.addEventListener('offline', handleOnlineStatus);
      
      // Initial check
      handleOnlineStatus();
      
      return () => {
        window.removeEventListener('online', handleOnlineStatus);
        window.removeEventListener('offline', handleOnlineStatus);
      };
    }
  }, []);

  // Current tasks are always the tasks in the last stack item
  const currentTasks = stack[stack.length - 1].tasks;

  // Update current tasks (with TypeScript fix)
  const setCurrentTasks = (newTasksOrUpdater: React.SetStateAction<Task[]>) => {
    setStack((prev) => {
      const updatedStack = [...prev];
      const lastStackItem = updatedStack[updatedStack.length - 1];
      
      const newTasks = typeof newTasksOrUpdater === 'function' 
        ? newTasksOrUpdater(lastStackItem.tasks) 
        : newTasksOrUpdater;
      
      // Update the tasks while preserving the parentTaskId
      updatedStack[updatedStack.length - 1] = {
        ...lastStackItem,
        tasks: newTasks
      };
      
      return updatedStack;
    });
  };

  // Open subtasks view
  const openSubtasks = (task: Task) => {
    // Initialize empty subtasks array if it doesn't exist
    const subtasks = task.subtasks || [];
    
    // Push subtasks to stack with reference to parent task
    setStack((prev) => {
      const newStack = [...prev];
      // Store the parent task ID so we can update it when going back
      newStack.push({
        tasks: [...subtasks],
        parentTaskId: task.id
      });
      return newStack;
    });
  };

  // Go back to previous view
  const goBack = () => {
    if (stack.length > 1) {
      // Get current stack item (contains subtasks and parentTaskId)
      const currentStackItem = stack[stack.length - 1];
      const updatedSubtasks = currentStackItem.tasks;
      const parentTaskId = currentStackItem.parentTaskId;
      
      // Update the parent task with the possibly modified subtasks
      setStack((prev) => {
        const newStack = prev.slice(0, -1);
        
        // Find and update the parent task in the previous level
        if (parentTaskId) {
          const parentLevel = newStack[newStack.length - 1];
          parentLevel.tasks = parentLevel.tasks.map(task => 
            task.id === parentTaskId ? { ...task, subtasks: updatedSubtasks } : task
          );
        }
        
        return newStack;
      });
    }
  };

  // Get the parent task text if we're in a subtask view
  const parentTaskText = stack.length > 1
    ? (() => {
        // Find the parent task in the previous stack level
        const parentId = stack[stack.length - 1].parentTaskId;
        const parentLevel = stack[stack.length - 2];
        const parentTask = parentLevel.tasks.find(task => task.id === parentId);
        return parentTask?.text || "Subtasks";
      })()
    : undefined;

  return (
    <div className="app">
      <TaskListView
        tasks={currentTasks}
        setTasks={setCurrentTasks}
        onOpenSubtasks={openSubtasks}
        onBack={stack.length > 1 ? goBack : undefined}
        parentTaskText={parentTaskText}
      />
    </div>
  );
};

export default App;