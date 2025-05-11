import {
  selectCurrentTasks,
  selectCurrentTask,
  selectParentTask,
  selectEditingTask,
  selectTaskPath,
  selectCanNavigateBack,
  selectParentTaskText,
} from '../taskSelectors';
import { TaskState, ROOT_TASK_ID } from '../../types/task';

describe('task selectors', () => {
  // Sample state for testing
  // Sample state for testing with redux-undo structure
  const sampleState: { tasks: { past: any[], present: TaskState, future: any[] } } = {
    tasks: {
      past: [],
      future: [],
      present: {
        byId: {
          [ROOT_TASK_ID]: { id: ROOT_TASK_ID, text: '✈', parentId: null },
          'task1': { id: 'task1', text: 'Task 1', parentId: null },
          'task2': { id: 'task2', text: 'Task 2', parentId: null },
          'subtask1': { id: 'subtask1', text: 'Subtask 1', parentId: 'task1' },
          'subtask2': { id: 'subtask2', text: 'Subtask 2', parentId: 'task1' },
          'subsubtask1': { id: 'subsubtask1', text: 'Sub-subtask 1', parentId: 'subtask1' },
        },
        childrenMap: {
          [ROOT_TASK_ID]: ['task1', 'task2'],
          'task1': ['subtask1', 'subtask2'],
          'subtask1': ['subsubtask1'],
        },
        currentTaskId: ROOT_TASK_ID,
        editingTaskId: null,
        rootTaskId: ROOT_TASK_ID,
      }
    },
  };

  it('should select current tasks at root level', () => {
    const state = {
      ...sampleState,
      tasks: {
        past: [],
        future: [],
        present: {
          ...sampleState.tasks.present,
          currentTaskId: ROOT_TASK_ID,
        },
      },
    };

    const result = selectCurrentTasks(state);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('task1');
    expect(result[1].id).toBe('task2');
  });

  it('should select current tasks at a specific level', () => {
    const state = {
      ...sampleState,
      tasks: {
        past: [],
        future: [],
        present: {
          ...sampleState.tasks.present,
          currentTaskId: 'task1',
        },
      },
    };

    const result = selectCurrentTasks(state);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('subtask1');
    expect(result[1].id).toBe('subtask2');
  });

  it('should select the current task', () => {
    const state = {
      ...sampleState,
      tasks: {
        past: [],
        future: [],
        present: {
          ...sampleState.tasks.present,
          currentTaskId: 'task1',
        },
      },
    };

    const result = selectCurrentTask(state);
    expect(result).toEqual({ id: 'task1', text: 'Task 1', parentId: null });
  });

  it('should return the root task when at root level', () => {
    const state = {
      ...sampleState,
      tasks: {
        past: [],
        future: [],
        present: {
          ...sampleState.tasks.present,
          currentTaskId: ROOT_TASK_ID,
        },
      },
    };

    const result = selectCurrentTask(state);
    expect(result).toEqual({ id: ROOT_TASK_ID, text: '✈', parentId: null });
  });

  it('should select the parent task', () => {
    const state = {
      ...sampleState,
      tasks: {
        past: [],
        future: [],
        present: {
          ...sampleState.tasks.present,
          currentTaskId: 'subtask1',
        },
      },
    };

    const result = selectParentTask(state);
    expect(result).toEqual({ id: 'task1', text: 'Task 1', parentId: null });
  });

  it('should return null when there is no parent task', () => {
    const state = {
      ...sampleState,
      tasks: {
        past: [],
        future: [],
        present: {
          ...sampleState.tasks.present,
          currentTaskId: 'task1',
        },
      },
    };

    const result = selectParentTask(state);
    expect(result).toBeNull();
  });

  it('should select the editing task', () => {
    const state = {
      ...sampleState,
      tasks: {
        past: [],
        future: [],
        present: {
          ...sampleState.tasks.present,
          editingTaskId: 'task2',
        },
      },
    };

    const result = selectEditingTask(state);
    expect(result).toEqual({ id: 'task2', text: 'Task 2', parentId: null });
  });

  it('should return null when there is no editing task', () => {
    const state = {
      ...sampleState,
      tasks: {
        past: [],
        future: [],
        present: {
          ...sampleState.tasks.present,
          editingTaskId: null,
        },
      },
    };

    const result = selectEditingTask(state);
    expect(result).toBeNull();
  });

  it('should select the task path', () => {
    const state = {
      ...sampleState,
      tasks: {
        past: [],
        future: [],
        present: {
          ...sampleState.tasks.present,
          currentTaskId: 'subsubtask1',
        },
      },
    };

    const result = selectTaskPath(state);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('task1');
    expect(result[1].id).toBe('subtask1');
    expect(result[2].id).toBe('subsubtask1');
  });

  it('should determine if we can navigate back', () => {
    const stateAtRoot = {
      ...sampleState,
      tasks: {
        past: [],
        future: [],
        present: {
          ...sampleState.tasks.present,
          currentTaskId: ROOT_TASK_ID,
        },
      },
    };

    const stateAtTask = {
      ...sampleState,
      tasks: {
        past: [],
        future: [],
        present: {
          ...sampleState.tasks.present,
          currentTaskId: 'task1',
        },
      },
    };

    expect(selectCanNavigateBack(stateAtRoot)).toBe(false);
    expect(selectCanNavigateBack(stateAtTask)).toBe(true);
  });

  it('should select the parent task text', () => {
    const state = {
      ...sampleState,
      tasks: {
        past: [],
        future: [],
        present: {
          ...sampleState.tasks.present,
          currentTaskId: 'subtask1',
        },
      },
    };

    const result = selectParentTaskText(state);
    expect(result).toBe('Task 1');
  });

  it('should return airplane emoji when at root level', () => {
    const state = {
      ...sampleState,
      tasks: {
        past: [],
        future: [],
        present: {
          ...sampleState.tasks.present,
          currentTaskId: ROOT_TASK_ID,
        },
      },
    };

    const result = selectParentTaskText(state);
    expect(result).toBe('✈');
  });
});