import { createSelector } from '@reduxjs/toolkit';
import { Task, ROOT_TASK_ID } from '../types/task';

// Define RootState type inline to avoid circular dependencies
interface RootState {
  tasks: {
    past: any[];
    present: {
      byId: { [id: string]: Task };
      childrenMap: { [parentId: string]: string[] };
      currentTaskId: string;
      editingTaskId: string | null;
      rootTaskId: string;
    };
    future: any[];
  };
}

// Basic selectors - updated for redux-undo structure with null checks for safety
export const selectTasksState = (state: RootState) => state.tasks?.present || {};
export const selectTasksById = (state: RootState) => state.tasks?.present?.byId || {};
export const selectChildrenMap = (state: RootState) => state.tasks?.present?.childrenMap || {};
export const selectCurrentTaskId = (state: RootState) => state.tasks?.present?.currentTaskId || '';
export const selectEditingTaskId = (state: RootState) => state.tasks?.present?.editingTaskId || null;
export const selectRootTaskId = (state: RootState) => state.tasks?.present?.rootTaskId || '';

// Undo/Redo selectors with null checks
export const selectCanUndo = (state: RootState) => state?.tasks?.past?.length > 0 || false;
export const selectCanRedo = (state: RootState) => state?.tasks?.future?.length > 0 || false;

// Get the current task
export const selectCurrentTask = createSelector(
  [selectTasksById, selectCurrentTaskId],
  (tasksById, currentTaskId) => {
    return tasksById[currentTaskId] || null;
  }
);

// Get tasks at the current level
export const selectCurrentTasks = createSelector(
  [selectTasksById, selectChildrenMap, selectCurrentTaskId],
  (tasksById, childrenMap, currentTaskId) => {
    const childIds = childrenMap[currentTaskId] || [];
    return childIds.map((id: string) => tasksById[id]);
  }
);

// Get the parent of the current task
export const selectParentTask = createSelector(
  [selectTasksById, selectCurrentTask],
  (tasksById, currentTask) => {
    if (!currentTask || !currentTask.parentId) return null;
    return tasksById[currentTask.parentId] || null;
  }
);

// Get the task being edited
export const selectEditingTask = createSelector(
  [selectTasksById, selectEditingTaskId],
  (tasksById, editingTaskId) => {
    if (!editingTaskId) return null;
    return tasksById[editingTaskId] || null;
  }
);

// Get the path from root to current task
export const selectTaskPath = createSelector(
  [selectTasksById, selectCurrentTaskId],
  (tasksById, currentTaskId) => {
    const path: Task[] = [];
    let taskId: string | null = currentTaskId;
    
    while (taskId) {
      const task: Task | undefined = tasksById[taskId];
      if (!task) break;
      
      path.unshift(task);
      taskId = task.parentId;
    }
    
    return path;
  }
);

// Check if we can navigate back (are we not at root level?)
export const selectCanNavigateBack = createSelector(
  [selectCurrentTaskId, selectRootTaskId],
  (currentTaskId, rootTaskId) => currentTaskId !== rootTaskId
);

// Get the parent task text (for backward compatibility with tests)
export const selectParentTaskText = createSelector(
  [selectParentTask, selectCurrentTaskId, selectRootTaskId, selectTasksById],
  (parentTask, currentTaskId, rootTaskId, tasksById) => {
    // If we're at the root level, show the airplane emoji
    if (currentTaskId === rootTaskId) {
      return tasksById[rootTaskId].text;
    }
    // Otherwise, show the parent task text
    return parentTask?.text || 'Subtasks';
  }
);

// Get the current task text for display in header
export const selectHeaderText = createSelector(
  [selectCurrentTaskId, selectTasksById],
  (currentTaskId, tasksById) => {
    // Get the current task from the store
    const currentTask = tasksById[currentTaskId];
    
    // If we have a current task, show its text
    if (currentTask) {
      return currentTask.text;
    }
    
    // Fallback in case the current task is not found
    return 'Subtasks';
  }
);