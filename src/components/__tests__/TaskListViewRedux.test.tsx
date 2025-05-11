import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import taskReducer, { initializeTasks } from '../../store/taskSlice';
import TaskListViewRedux from '../TaskListViewRedux';

// Mock the DND adapter
jest.mock('../../dnd/index');

// Create a test store
const createTestStore = () => {
  const store = configureStore({
    reducer: {
      tasks: taskReducer,
    },
  });
  
  // Initialize with test tasks
  store.dispatch(
    initializeTasks([
      { id: '1', text: 'Test Task 1', parentId: null },
      { id: '2', text: 'Test Task 2', parentId: null },
    ])
  );
  
  return store;
};

// Mock props
const mockProps = {
  tasks: [
    { id: '1', text: 'Test Task 1', subtasks: [] },
    { id: '2', text: 'Test Task 2', subtasks: [] },
  ],
  setTasks: jest.fn(),
  onOpenSubtasks: jest.fn(),
  onBack: jest.fn(),
  parentTaskText: 'Tasks',
  onUndo: jest.fn(),
  onRedo: jest.fn(),
  canUndo: true,
  canRedo: true,
};

describe('TaskListViewRedux', () => {
  beforeEach(() => {
    // Mock gesture system
    jest.clearAllMocks();
    
    // Mock the gesture event bus
    jest.mock('../../gesture/GestureEvents', () => ({
      gestureEventBus: {
        subscribe: jest.fn().mockReturnValue(jest.fn()),
      },
      GestureAction: {},
      ElementId: {},
    }));
  });

  it('renders tasks correctly', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <TaskListViewRedux {...mockProps} />
      </Provider>
    );
    
    // Check that tasks are rendered
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });

  it('renders header with correct buttons', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <TaskListViewRedux {...mockProps} />
      </Provider>
    );
    
    // Check header elements
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByTitle('Undo')).toBeInTheDocument();
    expect(screen.getByTitle('Redo')).toBeInTheDocument();
    expect(screen.getByTitle('Add Task')).toBeInTheDocument();
    expect(screen.getByTitle('Settings')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <TaskListViewRedux {...mockProps} />
      </Provider>
    );
    
    // Find and click the back button
    const backButton = screen.getByText('←');
    fireEvent.click(backButton);
    
    // Check that onBack was called
    expect(mockProps.onBack).toHaveBeenCalled();
  });

  it('calls onUndo when undo button is clicked', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <TaskListViewRedux {...mockProps} />
      </Provider>
    );
    
    // Find and click the undo button
    const undoButton = screen.getByTitle('Undo');
    fireEvent.click(undoButton);
    
    // Check that onUndo was called
    expect(mockProps.onUndo).toHaveBeenCalled();
  });

  it('calls onRedo when redo button is clicked', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <TaskListViewRedux {...mockProps} />
      </Provider>
    );
    
    // Find and click the redo button
    const redoButton = screen.getByTitle('Redo');
    fireEvent.click(redoButton);
    
    // Check that onRedo was called
    expect(mockProps.onRedo).toHaveBeenCalled();
  });

  // Note: Testing gesture interactions would require more complex setup
  // and is beyond the scope of this basic test suite
});