// Task interface
export interface Task {
  id: string;
  text: string;
  parentId: string | null;
}

// Root task ID constant
export const ROOT_TASK_ID = 'root-task';

// Normalized state structure
export interface TaskState {
  byId: { [id: string]: Task };
  childrenMap: { [parentId: string]: string[] };
  currentTaskId: string;
  editingTaskId: string | null;
  rootTaskId: string;
}

// Initial state
export const initialTaskState: TaskState = {
  byId: {
    [ROOT_TASK_ID]: {
      id: ROOT_TASK_ID,
      text: '✈',
      parentId: null
    }
  },
  childrenMap: {
    [ROOT_TASK_ID]: []
  },
  currentTaskId: ROOT_TASK_ID,
  editingTaskId: null,
  rootTaskId: ROOT_TASK_ID
};