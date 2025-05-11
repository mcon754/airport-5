import React, { useEffect } from 'react';
import './App.css';
import TaskListViewRedux from './components/TaskListViewRedux';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  initializeTasks,
  navigateToTask,
  navigateToParent,
} from './store/taskSlice';
import {
  selectCurrentTasks,
  selectCanNavigateBack,
  selectHeaderText,
  selectChildrenMap,
  selectTasksById,
  selectCanUndo,
  selectCanRedo,
} from './store/taskSelectors';
import { undoAction, redoAction } from './store/undoActions';
import { Task as NormalizedTask } from './types/task';
import { DEFAULT_TASKS, isStorageAvailable } from './store/localStorage';

// Define the Task interface expected by TaskListView
interface Task {
  id: string;
  text: string;
  subtasks?: Task[];
}

// Main App component
const App: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Select data from Redux store
  const normalizedTasks = useAppSelector(selectCurrentTasks);
  const childrenMap = useAppSelector(selectChildrenMap);
  const tasksById = useAppSelector(selectTasksById);
  const canNavigateBack = useAppSelector(selectCanNavigateBack);
  const headerText = useAppSelector(selectHeaderText);
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);
  
  // Convert normalized tasks to the format expected by TaskListView
  const convertToViewTask = (task: NormalizedTask): Task => {
    const childIds = childrenMap[task.id] || [];
    const subtasks = childIds.map((id: string) => convertToViewTask(tasksById[id]));
    
    return {
      id: task.id,
      text: task.text,
      subtasks: subtasks.length > 0 ? subtasks : undefined
    };
  };
  
  // Convert the current tasks
  const currentTasks = normalizedTasks.map((task: NormalizedTask) => convertToViewTask(task));
  
  // Initialize tasks from localStorage or use default
  useEffect(() => {
    // Check if storage is available
    if (!isStorageAvailable()) {
      console.warn('LocalStorage is not available. Using default tasks.');
      dispatch(initializeTasks(DEFAULT_TASKS));
      return;
    }
    
    // Initialize from Redux store (which already loads from localStorage)
    if (normalizedTasks.length === 0) {
      dispatch(initializeTasks(DEFAULT_TASKS));
    }
  }, [dispatch, normalizedTasks.length]);
  
  // Check if running in standalone mode (PWA)
  useEffect(() => {
    // Check if matchMedia is available (it's not in test environment)
    if (window.matchMedia) {
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
    }
  }, []);
  
  // Open subtasks view
  const openSubtasks = (task: Task) => {
    dispatch(navigateToTask(task.id));
  };
  
  // Go back to previous view
  const goBack = () => {
    dispatch(navigateToParent());
  };

  // Handle undo action
  const handleUndo = () => {
    dispatch(undoAction());
  };

  // Handle redo action
  const handleRedo = () => {
    dispatch(redoAction());
  };
  
  // Handle task updates
  const setTasks = (newTasksOrUpdater: React.SetStateAction<Task[]>) => {
    // Convert the updater function or new tasks array to a new array of tasks
    const newTasks = typeof newTasksOrUpdater === 'function'
      ? newTasksOrUpdater(currentTasks)
      : newTasksOrUpdater;
    
    // For each task in the new array, find the corresponding task in the current array
    // and dispatch the appropriate action if it has changed
    newTasks.forEach((newTask, index) => {
      const oldTask = currentTasks[index];
      
      // If the task text has changed, dispatch an edit action
      if (oldTask && oldTask.text !== newTask.text) {
        dispatch({
          type: 'tasks/editTask',
          payload: { id: newTask.id, text: newTask.text }
        });
      }
      
      // Note: This is a simplified implementation that doesn't handle
      // adding, removing, or reordering tasks. In a complete implementation,
      // you would need to compare the old and new arrays more thoroughly.
    });
  };
  
  return (
    <div className="app">
      <TaskListViewRedux
        tasks={currentTasks}
        setTasks={setTasks}
        onOpenSubtasks={openSubtasks}
        onBack={canNavigateBack ? goBack : undefined}
        parentTaskText={headerText}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>
  );
};

export default App;