import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskState, initialTaskState, ROOT_TASK_ID } from '../types/task';

// Create the task slice
const taskSlice = createSlice({
  name: 'tasks',
  initialState: initialTaskState,
  reducers: {
    // Add a new task (without setting edit mode)
    addTask: (state, action: PayloadAction<{ text: string; setEditMode?: boolean }>) => {
      const newTaskId = Date.now().toString();
      const parentId = state.currentTaskId;
      
      // Create the new task
      state.byId[newTaskId] = {
        id: newTaskId,
        text: action.payload.text,
        parentId,
      };
      
      // Add to children map
      if (!state.childrenMap[parentId]) {
        state.childrenMap[parentId] = [];
      }
      state.childrenMap[parentId].push(newTaskId);
      
      // Always set edit mode for new tasks to ensure a single undo action
      // This makes the UX more intuitive as creating and editing a task
      // is considered a single operation from the user's perspective
      state.editingTaskId = newTaskId;
    },
    
    // Edit an existing task
    editTask: (state, action: PayloadAction<{ id: string; text: string }>) => {
      const { id, text } = action.payload;
      if (state.byId[id]) {
        state.byId[id].text = text;
      }
    },
    
    // Remove a task
    removeTask: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      const task = state.byId[taskId];
      
      if (task) {
        // Remove from parent's children
        const parentId = task.parentId || state.rootTaskId;
        state.childrenMap[parentId] = state.childrenMap[parentId].filter(
          (id) => id !== taskId
        );
        
        // Remove task and its children recursively
        const removeTaskAndChildren = (id: string) => {
          // Remove all children first
          if (state.childrenMap[id]) {
            [...state.childrenMap[id]].forEach((childId) => {
              removeTaskAndChildren(childId);
            });
            delete state.childrenMap[id];
          }
          // Remove the task itself
          delete state.byId[id];
        };
        
        removeTaskAndChildren(taskId);
      }
    },
    
    // Reorder tasks
    reorderTasks: (
      state,
      action: PayloadAction<{ oldIndex: number; newIndex: number }>
    ) => {
      const { oldIndex, newIndex } = action.payload;
      const parentId = state.currentTaskId;
      const childIds = state.childrenMap[parentId] || [];
      
      if (
        oldIndex >= 0 &&
        oldIndex < childIds.length &&
        newIndex >= 0 &&
        newIndex < childIds.length
      ) {
        const [removed] = childIds.splice(oldIndex, 1);
        childIds.splice(newIndex, 0, removed);
        state.childrenMap[parentId] = childIds;
      }
    },
    
    // Navigate to a task's subtasks
    navigateToTask: (state, action: PayloadAction<string>) => {
      state.currentTaskId = action.payload;
    },
    
    // Navigate back to parent
    navigateToParent: (state) => {
      const task = state.byId[state.currentTaskId];
      // Check if task exists and has a parentId
      if (task && task.parentId) {
        state.currentTaskId = task.parentId;
      } else {
        // If no parent (or task doesn't exist), go to root
        state.currentTaskId = state.rootTaskId;
      }
    },
    
    // Set the task being edited
    setEditingTaskId: (state, action: PayloadAction<string | null>) => {
      state.editingTaskId = action.payload;
    },
    
    // Initialize tasks from localStorage or default
    initializeTasks: (state, action: PayloadAction<Task[]>) => {
      // Reset state but keep the root task
      const rootTask = state.byId[state.rootTaskId];
      state.byId = {
        [state.rootTaskId]: rootTask
      };
      state.childrenMap = {
        [state.rootTaskId]: []
      };
      
      // Process each task
      action.payload.forEach(task => {
        // Skip if this is trying to overwrite the root task
        if (task.id === state.rootTaskId) return;
        
        // Add to byId
        state.byId[task.id] = {
          id: task.id,
          text: task.text,
          parentId: task.parentId // Preserve parent-child relationships
        };
        
        // Add to appropriate children map
        if (task.parentId === null) {
          // Root level task
          state.childrenMap[state.rootTaskId].push(task.id);
        } else {
          // Child task
          if (!state.childrenMap[task.parentId]) {
            state.childrenMap[task.parentId] = [];
          }
          state.childrenMap[task.parentId].push(task.id);
        }
      });
    },
    
    // Export tasks as JSON
    exportTasks: (state) => {
      // This is just a marker action that doesn't modify state
      // The actual export will be handled by a middleware or component
      return state;
    },
    
    // Import tasks from JSON
    importTasks: (state, action: PayloadAction<Task[]>) => {
      // Reset state but keep the root task
      const rootTask = state.byId[state.rootTaskId];
      state.byId = {
        [state.rootTaskId]: rootTask
      };
      state.childrenMap = {
        [state.rootTaskId]: []
      };
      
      // Process each task from the imported data
      action.payload.forEach(task => {
        // Skip if this is trying to overwrite the root task
        if (task.id === state.rootTaskId) return;
        
        // Add to byId
        state.byId[task.id] = {
          id: task.id,
          text: task.text,
          parentId: task.parentId // Preserve parent-child relationships
        };
        
        // Add to appropriate children map
        if (task.parentId === null) {
          // Root level task
          state.childrenMap[state.rootTaskId].push(task.id);
        } else {
          // Child task
          if (!state.childrenMap[task.parentId]) {
            state.childrenMap[task.parentId] = [];
          }
          state.childrenMap[task.parentId].push(task.id);
        }
      });
    }
  },
});

// Export actions
export const {
  addTask,
  editTask,
  removeTask,
  reorderTasks,
  navigateToTask,
  navigateToParent,
  setEditingTaskId,
  initializeTasks,
  exportTasks,
  importTasks,
} = taskSlice.actions;

// Export reducer
export default taskSlice.reducer;