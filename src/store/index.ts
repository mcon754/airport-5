import { configureStore, PayloadAction } from '@reduxjs/toolkit';
import undoable, { includeAction } from 'redux-undo';
import taskReducer from './taskSlice';
import { loadState, localStorageMiddleware } from './localStorage';

// Define action payload types for type safety
interface EditTaskPayload {
  id: string;
  text: string;
}

// Load state from localStorage
const preloadedState = loadState();

// Configure the Redux store
export const store = configureStore({
  reducer: {
    tasks: undoable(taskReducer, {
      // Configure which actions should be added to history
      filter: (action) => {
        // Only include specific task modification actions
        const includedActions = [
          'tasks/addTask',
          'tasks/editTask',
          'tasks/removeTask',
          'tasks/reorderTasks'
        ];
        
        // Explicitly exclude UI state and navigation actions
        const excludedActions = [
          'tasks/navigateToTask',
          'tasks/navigateToParent',
          'tasks/setEditingTaskId'
        ];
        
        return includedActions.includes(action.type) && !excludedActions.includes(action.type);
      },
      
      // Group related actions together as a single undoable action
      groupBy: (action: any, currentState: any, previousHistory: any) => {
        // For task creation, we want to group the addTask action with any subsequent
        // actions that might be related to the same task (like editing it immediately after)
        if (action.type === 'tasks/addTask') {
          // Generate a unique group ID for this task creation that includes a timestamp
          const timestamp = Date.now();
          const groupId = `task-creation-${timestamp}`;
          // Store the group ID on the action for later reference
          action._groupID = groupId;
          return groupId;
        }
        
        // For task editing, we want to group multiple edits to the same task
        // that happen within a short time period
        if (action.type === 'tasks/editTask') {
          // Type assertion to access payload properties safely
          const payload = action.payload as EditTaskPayload;
          if (payload && payload.id) {
            // Round to the nearest 2 seconds to group edits that happen close together
            const timestamp = Math.floor(Date.now() / 2000);
            return `task-edit-${payload.id}-${timestamp}`;
          }
        }
        
        // Default: no grouping
        return null;
      },
      
      // Limit history size to prevent memory issues
      // Set to 100 to ensure user can perform ~50 undos without hitting the limit
      limit: 100,
      // Debug to help during development
      debug: process.env.NODE_ENV === 'development',
    }),
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(localStorageMiddleware),
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;