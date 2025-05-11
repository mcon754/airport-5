// Local storage keys
export const STORAGE_KEY = 'airport-tasks';

// Default tasks to use if no saved state exists
export const DEFAULT_TASKS = [
  { id: '1', text: 'Sample Task 1', parentId: null },
  { id: '2', text: 'Sample Task 2', parentId: null },
];

// Load state from localStorage
export const loadState = () => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return undefined; // If no state in localStorage, return undefined to use initial state
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return undefined; // On error, return undefined to use initial state
  }
};

// Get all tasks from the state
export const getAllTasks = (state: any) => {
  if (state && state.tasks && state.tasks.present) {
    return Object.values(state.tasks.present.byId);
  }
  return [];
};

// Save state to localStorage
export const saveState = (state: any) => {
  try {
    // Only save the present state from the undoable reducer
    const stateToSave = {
      tasks: state.tasks.present
    };
    
    const serializedState = JSON.stringify(stateToSave);
    localStorage.setItem(STORAGE_KEY, serializedState);
    
    // Also store the last update timestamp
    localStorage.setItem(`${STORAGE_KEY}-updated`, new Date().toISOString());
    
    // Notify if in standalone mode
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Data saved for offline use');
    }
    
    return true;
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
    
    // Show error notification if in standalone mode
    if (window.matchMedia && typeof window.matchMedia === 'function') {
      try {
        if (window.matchMedia('(display-mode: standalone)').matches) {
          console.error('Failed to save changes to local storage');
        }
      } catch (e) {
        // Ignore matchMedia errors in test environment
      }
    }
    
    return false;
  }
};

// Create a middleware to save state to localStorage after each action
export const localStorageMiddleware = (store: any) => (next: any) => (action: any) => {
  // Call the next dispatch method in the middleware chain
  const result = next(action);
  
  // Save the state to localStorage after the action has been processed
  saveState(store.getState());
  
  return result;
};

// Check if storage is available and working
export const isStorageAvailable = () => {
  try {
    const testKey = `${STORAGE_KEY}-test`;
    localStorage.setItem(testKey, 'test');
    const result = localStorage.getItem(testKey) === 'test';
    localStorage.removeItem(testKey);
    return result;
  } catch (e) {
    return false;
  }
};