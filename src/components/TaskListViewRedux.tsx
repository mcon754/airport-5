import React, { useEffect, useRef, useState, useCallback } from 'react';
import SettingsModal from './SettingsModal';
import { useGestureManager } from '../gesture/GestureManager';
import { gestureEventBus, GestureAction, ElementId } from '../gesture/GestureEvents';
import { createDndAdapter, DragEvent } from '../dnd/index';
import { DndAdapter } from '../dnd/DndAdapter';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addTask,
  editTask,
  removeTask,
  reorderTasks,
  setEditingTaskId as setReduxEditingTaskId,
} from '../store/taskSlice';
import { selectEditingTaskId } from '../store/taskSelectors';

// Define Task interface (same as in original component)
interface Task {
  id: string;
  text: string;
  subtasks?: Task[];
}

// EditTask Form component (unchanged)
const EditTaskForm: React.FC<{
  task: Task;
  onSave: (text: string) => void;
  onCancel: (text: string) => void;
}> = ({ task, onSave, onCancel }) => {
  const [text, setText] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus on mount with a slight delay to ensure stable layout
  useEffect(() => {
    // Use a small timeout to ensure the keyboard is ready
    const focusTimer = setTimeout(() => {
      if (inputRef.current) {
        // Focus and select the text
        inputRef.current.focus();
        inputRef.current.select();
        
        // Detect Android
        const isAndroid = /android/i.test(navigator.userAgent);
        
        if (isAndroid) {
          // For Android, we need a special approach to show the selection handles
          
          // Add a special class to the input that will help with selection visibility
          inputRef.current.classList.add('android-text-selected');
          
          // Set a special style for this class in a dynamic stylesheet
          const style = document.createElement('style');
          style.innerHTML = `
            .android-text-selected {
              user-select: text !important;
              -webkit-user-select: text !important;
              -webkit-tap-highlight-color: rgba(0,0,0,0.4) !important;
            }
            .android-text-selected::selection {
              background-color: rgba(0,0,0,0.2) !important;
            }
          `;
          document.head.appendChild(style);
          
          // Use a sequence of selection operations that's known to work on Android Chrome
          // First deselect, then select all again to trigger the selection handles
          setTimeout(() => {
            if (inputRef.current) {
              // First deselect
              inputRef.current.setSelectionRange(0, 0);
              
              // Then select all again
              setTimeout(() => {
                if (inputRef.current) {
                  inputRef.current.setSelectionRange(0, inputRef.current.value.length);
                  
                  // Use document.execCommand as a fallback to trigger selection menu
                  try {
                    document.execCommand('selectAll');
                  } catch (e) {
                    console.error('Error with execCommand:', e);
                  }
                  
                  // Add a special data attribute that our CSS can target
                  inputRef.current.setAttribute('data-selection-active', 'true');
                  
                  // Try to access Android-specific selection API if available
                  // This is a more direct way to show the selection menu on Android
                  try {
                    if (window.navigator && 'share' in window.navigator) {
                      // Modern Android devices support the Web Share API
                      // This can sometimes trigger the selection menu as a side effect
                      setTimeout(() => {
                        // Re-select the text to ensure it's still selected
                        inputRef.current?.focus();
                        inputRef.current?.select();
                      }, 100);
                    }
                  } catch (e) {
                    console.error('Error with selection API:', e);
                  }
                }
              }, 50);
            }
          }, 50);
        }
      }
    }, 150); // Increased timeout to ensure stable layout
    
    return () => clearTimeout(focusTimer);
  }, []);
  
  return (
    <div
      className="edit-task-form"
      // Stop propagation of pointer events to prevent gesture system from capturing them
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{ margin: '-14px -16px', padding: '14px 16px' }} // Match task-item padding to prevent layout shift
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => {
          // Use a small timeout to prevent immediate blur handling
          // This helps with Android keyboard issues
          // Always save changes when the input loses focus
          setTimeout(() => onSave(text), 100);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default to avoid unexpected behavior
            onSave(text);
          } else if (e.key === 'Escape') {
            e.preventDefault(); // Prevent default to avoid unexpected behavior
            onCancel(text);
          }
        }}
        style={{ touchAction: 'manipulation' }} // Improve touch handling on mobile
      />
    </div>
  );
};

// Individual TaskItem component (mostly unchanged)
interface TaskItemProps {
  task: Task;
  index: number;
  isBeingSwiped: boolean;
  swipeOffset: number;
  isEditing: boolean;
  onSave: (text: string) => void;
  onCancel: (text: string) => void;
  registerElement: (id: ElementId, element: HTMLElement | null) => void;
  dndAdapter: DndAdapter;
}

// Use React.memo to prevent unnecessary re-renders
const TaskItem = React.memo(function TaskItem({
  task,
  index,
  isBeingSwiped,
  swipeOffset,
  isEditing,
  onSave,
  onCancel,
  registerElement,
  dndAdapter
}: TaskItemProps) {
  const taskRef = useRef<HTMLDivElement>(null);
  
  // Register the element when it's mounted
  useEffect(() => {
    if (taskRef.current) {
      // Register the element with the gesture system
      registerElement(task.id, taskRef.current);
    }
    
    return () => {
      registerElement(task.id, null);
    };
  }, [task.id, registerElement]);
  
  const content = (
    <div
      className={`task-item ${isBeingSwiped ? 'swiping' : ''}`}
      ref={taskRef}
      style={{
        transform: `translateX(${swipeOffset}px)`,
        transition: swipeOffset ? 'none' : 'transform 0.3s ease-out',
        position: 'relative',
        userSelect: 'none',
        touchAction: 'none'
      }}
      data-task-id={task.id}
    >
      {isEditing ? (
        <EditTaskForm
          task={task}
          onSave={onSave}
          onCancel={onCancel}
        />
      ) : (
        <div className="task-content">
          <div className="task-text">
            {task.text}
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="subtask-indicator">●</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
  
  // Cast the result to any to avoid TypeScript errors with ReactNode
  return dndAdapter.wrapItem(task.id, content, index) as any;
}, (prevProps, nextProps) => {
  // Only re-render if these props change
  return prevProps.task.id === nextProps.task.id &&
         prevProps.isBeingSwiped === nextProps.isBeingSwiped &&
         prevProps.swipeOffset === nextProps.swipeOffset &&
         prevProps.isEditing === nextProps.isEditing;
});

// Header component (updated to handle undo/redo)
const Header: React.FC<{
  parentTaskText?: string;
  onBack?: () => void;
  onAddTask: () => void;
  canAddTask: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onOpenSettings?: () => void;
}> = ({
  parentTaskText,
  onBack,
  onAddTask,
  canAddTask,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onOpenSettings
}) => {
  return (
    <div className="task-header">
      <div className="header-left">
        {onBack && (
          <button className="back-button" onClick={onBack}>
            <span className="back-icon">←</span>
          </button>
        )}
        <h2 className="header-title">{parentTaskText}</h2>
      </div>
      <div className="header-actions">
        <button 
          className="header-button undo-button" 
          title="Undo"
          onClick={onUndo}
          disabled={!canUndo}
        >
          <span>↩</span>
        </button>
        <button 
          className="header-button redo-button" 
          title="Redo"
          onClick={onRedo}
          disabled={!canRedo}
        >
          <span>↪</span>
        </button>
        <button
          className="header-button add-button"
          onClick={onAddTask}
          disabled={!canAddTask}
          title="Add Task"
        >
          <span>+</span>
        </button>
        <button
          className="header-button settings-button"
          title="Settings"
          onClick={onOpenSettings}
        >
          <span>⚙</span>
        </button>
      </div>
    </div>
  );
};

// Main TaskListView component (updated to use Redux)
const TaskListViewRedux: React.FC<{
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onOpenSubtasks: (task: Task) => void;
  onBack?: () => void;
  parentTaskText?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}> = ({
  tasks,
  setTasks,
  onOpenSubtasks,
  onBack,
  parentTaskText,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const dispatch = useAppDispatch();
  
  // Get editing state from Redux
  const reduxEditingTaskId = useAppSelector(selectEditingTaskId);
  
  // State for task interactions
  const [swipingTaskId, setSwipingTaskId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Sync local editing state with Redux
  useEffect(() => {
    if (reduxEditingTaskId !== editingTaskId) {
      setEditingTaskId(reduxEditingTaskId);
    }
  }, [reduxEditingTaskId]);
  
  // Ref to track when edit mode was last activated
  const lastEditTimeRef = useRef<number>(0);
  
  // Initialize gesture system
  const { gestureBindings, registerElement } = useGestureManager({
    swipeThreshold: 80,
    doubleTapDelay: 300,
    longPressDelay: 600
  });
  
  // Initialize DnD system (which could be any library via adapter)
  const dndAdapter = useRef(createDndAdapter());
  
  // Task management functions - memoized to prevent unnecessary re-renders
  const handleRemoveTask = useCallback((id: string) => {
    dispatch(removeTask(id));
  }, [dispatch]);
  
  const handleEditTask = useCallback((id: string, newText: string) => {
    if (!newText.trim()) {
      // Remove task if text is empty
      handleRemoveTask(id);
      return;
    }
    
    dispatch(editTask({ id, text: newText }));
  }, [dispatch, handleRemoveTask]);
  
  // Insert a new task at specific index
  const handleInsertTask = useCallback((index: number) => {
    if (tasks.length >= 10) { // MAX_TASKS limit
      alert(`You can't add more than 10 tasks to this view.`);
      return;
    }
    
    // For now, just add at the end - in a complete implementation,
    // we would need to handle insertion at a specific index
    // The reducer now handles setting the edit mode as part of the same action
    dispatch(addTask({ text: 'New Task' }));
    
    // No need for separate setEditingTaskId dispatch
    // The local state will be updated via the useEffect that syncs with Redux
  }, [dispatch, tasks.length]);
  
  // Add a new task at the end
  const handleAddTask = useCallback(() => {
    if (tasks.length >= 10) { // MAX_TASKS limit
      alert(`You can't add more than 10 tasks to this view.`);
      return;
    }
    
    // Add the task with edit mode enabled
    // The reducer now handles setting the edit mode as part of the same action
    dispatch(addTask({ text: 'New Task' }));
    
    // No need for separate setEditingTaskId dispatch
    // The local state will be updated via the useEffect that syncs with Redux
  }, [dispatch, tasks.length]);
  
  // Handle gesture events - memoized to prevent unnecessary re-renders
  const handleGestureEvent = useCallback((action: GestureAction) => {
    // Handle each gesture type with specific task logic
    switch (action.type) {
      case 'GESTURE_TAP': {
        // Single tap - enter edit mode
        if (action.elementId) {
          // If we're already editing this task, don't do anything
          // This allows tapping within the input field without exiting edit mode
          if (editingTaskId === action.elementId) {
            return; // Exit early without changing state
          }
          
          // If we're editing a different task, save the current edits before switching
          if (editingTaskId !== null) {
            // Find the task being edited and save its current text
            const editedTask = tasks.find(t => t.id === editingTaskId);
            if (editedTask) {
              // Get the current input value and save it
              const inputElement = document.querySelector('.edit-task-form input') as HTMLInputElement;
              if (inputElement) {
                const currentText = inputElement.value;
                handleEditTask(editingTaskId, currentText);
              }
            }
          }
          
          // Record the time when edit mode is activated
          lastEditTimeRef.current = Date.now();
          
          // Use setTimeout to ensure stable transition to edit mode
          setTimeout(() => {
            dispatch(setReduxEditingTaskId(action.elementId));
            setEditingTaskId(action.elementId);
          }, 10);
        } else if (editingTaskId !== null) {
          // Tapped outside any task while in edit mode - save and exit edit mode
          // Find the currently edited task
          const editedTask = tasks.find(t => t.id === editingTaskId);
          if (editedTask) {
            // Find the input element to get its current value
            const inputElement = document.querySelector('.edit-task-form input') as HTMLInputElement;
            if (inputElement) {
              // Save the current value before exiting edit mode
              const currentText = inputElement.value;
              handleEditTask(editingTaskId, currentText);
              
              // Blur the input to hide the keyboard
              inputElement.blur();
            }
            
            // Exit edit mode
            dispatch(setReduxEditingTaskId(null));
            setEditingTaskId(null);
          }
        }
        break;
      }
      
      case 'GESTURE_DOUBLE_TAP': {
        // Double tap - insert new task at the position of the double tap
        if (action.elementId) {
          // If double-tapping on a task, insert at that task's position (not after it)
          const index = tasks.findIndex(t => t.id === action.elementId);
          if (index !== -1) {
            // Insert at the current index, displacing the current task down
            handleInsertTask(index - 1); // -1 because we want to insert before this task
          }
        } else {
          // Double tap on empty space - add at the end of the list
          handleInsertTask(tasks.length - 1); // This will add at the end
        }
        break;
      }
      
      case 'GESTURE_LONG_PRESS': {
        // Long press - open subtasks
        if (action.elementId) {
          const task = tasks.find(t => t.id === action.elementId);
          if (task) {
            onOpenSubtasks(task);
          }
        }
        break;
      }
      
      case 'GESTURE_SWIPE_START': {
        // Start tracking swipe
        setSwipingTaskId(action.elementId);
        setSwipeOffset(0);
        break;
      }
      
      case 'GESTURE_SWIPE_MOVE': {
        // Update swipe UI
        if (action.elementId === swipingTaskId) {
          setSwipeOffset(action.distance);
        }
        break;
      }
      
      case 'GESTURE_SWIPE_END': {
        // Complete swipe if threshold met
        if (action.elementId === swipingTaskId) {
          if (action.distance < -80 && action.elementId) { // SWIPE_THRESHOLD
            // Delete the task
            handleRemoveTask(action.elementId);
          }
          // Reset swipe state
          setSwipingTaskId(null);
          setSwipeOffset(0);
        }
        break;
      }
      
      case 'GESTURE_DRAG_START':
      case 'GESTURE_DRAG_MOVE':
      case 'GESTURE_DRAG_END': {
        // No special handling needed for drag events
        break;
      }
    }
  }, [
    handleInsertTask,
    handleRemoveTask,
    handleEditTask,
    onOpenSubtasks,
    swipingTaskId,
    tasks,
    editingTaskId,
    dispatch
  ]);
  
  // Subscribe to gesture events - only once with stable reference
  useEffect(() => {
    const unsubscribe = gestureEventBus.subscribe(handleGestureEvent);
    return unsubscribe;
  }, [handleGestureEvent]);
  
  // Handle DnD events - only once with stable reference
  useEffect(() => {
    if (dndAdapter.current && typeof dndAdapter.current.addDragListener === 'function') {
      const unsubscribeDnd = dndAdapter.current.addDragListener((event: DragEvent) => {
        if (event.type === 'drag-end' && event.source && event.destination) {
          // Reorder tasks
          const oldIndex = event.source.index;
          const newIndex = event.destination.index;
          
          // Validate indices before reordering
          if (oldIndex >= 0 && oldIndex < tasks.length &&
              newIndex >= 0 && newIndex < tasks.length) {
            dispatch(reorderTasks({ oldIndex, newIndex }));
          }
        }
      });
      
      return unsubscribeDnd;
    }
    return undefined;
  }, [dispatch, tasks.length]);
  
  // Initialize dnd adapter - only once
  useEffect(() => {
    if (dndAdapter.current && typeof dndAdapter.current.initialize === 'function') {
      dndAdapter.current.initialize();
    }
  }, []);
  
  // Create ref and attach gesture bindings
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Set up gesture detection on the container - only once with stable reference
  useEffect(() => {
    if (containerRef.current) {
      gestureBindings(containerRef.current);
    }
  }, [gestureBindings]);
  
  return (
    <div className="task-list-view" ref={containerRef}>
      <Header
        parentTaskText={parentTaskText}
        onBack={onBack}
        onAddTask={handleAddTask}
        canAddTask={tasks.length < 10}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      
      {dndAdapter.current && dndAdapter.current.wrapContainer ? (
        dndAdapter.current.wrapContainer(
          <div className="task-list">
            {tasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                index={index}
                isBeingSwiped={task.id === swipingTaskId}
                swipeOffset={task.id === swipingTaskId ? swipeOffset : 0}
                isEditing={editingTaskId === task.id}
                onSave={(text) => {
                  // Only process save if enough time has passed since edit mode was activated
                  // or if it's an explicit user action (like pressing Enter)
                  const timeSinceEdit = Date.now() - lastEditTimeRef.current;
                  if (timeSinceEdit > 200) {
                    handleEditTask(task.id, text);
                    dispatch(setReduxEditingTaskId(null));
                    setEditingTaskId(null);
                  }
                }}
                onCancel={(text) => {
                  // Only allow cancellation if enough time has passed since edit mode was activated
                  // This prevents accidental cancellations due to layout shifts
                  const timeSinceEdit = Date.now() - lastEditTimeRef.current;
                  if (timeSinceEdit > 200) {
                    // Save changes on cancel as well
                    handleEditTask(task.id, text);
                    dispatch(setReduxEditingTaskId(null));
                    setEditingTaskId(null);
                  }
                }}
                registerElement={registerElement}
                dndAdapter={dndAdapter.current}
              />
            ))}
          </div>
        )
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <div key={task.id} className="task-item">
              <div className="task-content">
                <div className="task-text">
                  {task.text}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <span className="subtask-indicator">●</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskListViewRedux;