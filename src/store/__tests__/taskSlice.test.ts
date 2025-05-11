import taskReducer, {
  addTask,
  editTask,
  removeTask,
  reorderTasks,
  navigateToTask,
  navigateToParent,
  setEditingTaskId,
  initializeTasks,
} from '../taskSlice';
import { initialTaskState, ROOT_TASK_ID } from '../../types/task';

describe('task slice', () => {
  it('should return the initial state', () => {
    expect(taskReducer(undefined, { type: 'unknown' } as any)).toEqual(initialTaskState);
  });

  it('should handle initializing tasks', () => {
    const sampleTasks = [
      { id: '1', text: 'Task 1', parentId: null },
      { id: '2', text: 'Task 2', parentId: null },
    ];

    const state = taskReducer(initialTaskState, initializeTasks(sampleTasks));
    
    expect(state.byId['1']).toEqual({ id: '1', text: 'Task 1', parentId: null });
    expect(state.byId['2']).toEqual({ id: '2', text: 'Task 2', parentId: null });
    expect(state.childrenMap[ROOT_TASK_ID]).toContain('1');
    expect(state.childrenMap[ROOT_TASK_ID]).toContain('2');
  });

  it('should handle adding a task', () => {
    // Mock Date.now to return a predictable value
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => 1234567890);

    const state = taskReducer(initialTaskState, addTask({ text: 'New Task' }));
    
    expect(state.byId['1234567890']).toEqual({
      id: '1234567890',
      text: 'New Task',
      parentId: ROOT_TASK_ID,
    });
    expect(state.childrenMap[ROOT_TASK_ID]).toContain('1234567890');

    // Restore original Date.now
    Date.now = originalDateNow;
  });

  it('should handle editing a task', () => {
    // First add a task
    let state = taskReducer(initialTaskState, addTask({ text: 'Task to Edit' }));
    const taskId = Object.keys(state.byId)[0];
    
    // Then edit it
    state = taskReducer(state, editTask({ id: taskId, text: 'Edited Task' }));
    
    expect(state.byId[taskId].text).toBe('Edited Task');
  });

  it('should handle removing a task', () => {
    // First add a task
    let state = taskReducer(initialTaskState, addTask({ text: 'Task to Remove' }));
    const taskId = Object.keys(state.byId)[0];
    
    // Then remove it
    state = taskReducer(state, removeTask(taskId));
    
    expect(state.byId[taskId]).toBeUndefined();
    
    // Check that the task is not in any children map
    const childrenMaps = Object.values(state.childrenMap);
    const taskExistsInAnyMap = childrenMaps.some(map => map.includes(taskId));
    expect(taskExistsInAnyMap).toBe(false);
  });

  it('should handle reordering tasks', () => {
    // Add multiple tasks
    let state = taskReducer(initialTaskState, addTask({ text: 'Task 1' }));
    state = taskReducer(state, addTask({ text: 'Task 2' }));
    state = taskReducer(state, addTask({ text: 'Task 3' }));
    
    const taskIds = state.childrenMap[ROOT_TASK_ID];
    const oldIndex = 0;
    const newIndex = 2;
    
    // Reorder tasks
    state = taskReducer(state, reorderTasks({ oldIndex, newIndex }));
    
    // The first task should now be at the end
    expect(state.childrenMap[ROOT_TASK_ID][2]).toBe(taskIds[0]);
  });

  it('should handle navigating to a task', () => {
    // Add a task
    let state = taskReducer(initialTaskState, addTask({ text: 'Parent Task' }));
    const taskId = Object.keys(state.byId)[0];
    
    // Navigate to it
    state = taskReducer(state, navigateToTask(taskId));
    
    expect(state.currentTaskId).toBe(taskId);
  });

  it('should handle navigating to parent', () => {
    // Add a parent task
    let state = taskReducer(initialTaskState, addTask({ text: 'Parent Task' }));
    const parentId = Object.keys(state.byId).find(id => id !== ROOT_TASK_ID) || '';
    
    // Navigate to parent
    state = taskReducer(state, navigateToTask(parentId));
    
    // Add a child task
    state = taskReducer(state, addTask({ text: 'Child Task' }));
    const childId = state.childrenMap[parentId][0];
    
    // Navigate to child
    state = taskReducer(state, navigateToTask(childId));
    expect(state.currentTaskId).toBe(childId);
    
    // Navigate back to parent
    state = taskReducer(state, navigateToParent());
    expect(state.currentTaskId).toBe(parentId);
  });

  it('should handle navigating from task to root', () => {
    // Add a task at root level
    let state = taskReducer(initialTaskState, addTask({ text: 'Task at Root' }));
    const taskId = Object.keys(state.byId).find(id => id !== ROOT_TASK_ID) || '';
    
    // Navigate to task
    state = taskReducer(state, navigateToTask(taskId));
    expect(state.currentTaskId).toBe(taskId);
    
    // Navigate back to root
    state = taskReducer(state, navigateToParent());
    expect(state.currentTaskId).toBe(ROOT_TASK_ID);
  });

  it('should handle setting editing task ID', () => {
    // Add a task
    let state = taskReducer(initialTaskState, addTask({ text: 'Task' }));
    const taskId = Object.keys(state.byId)[0];
    
    // Set it as being edited
    state = taskReducer(state, setEditingTaskId(taskId));
    
    expect(state.editingTaskId).toBe(taskId);
    
    // Clear editing state
    state = taskReducer(state, setEditingTaskId(null));
    
    expect(state.editingTaskId).toBeNull();
  });
});