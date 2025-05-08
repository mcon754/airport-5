import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGestureManager } from '../gesture/GestureManager';
import { gestureEventBus, GestureAction, ElementId } from '../gesture/GestureEvents';
import { createDndAdapter, DragEvent } from '../dnd/index';
import { DndAdapter } from '../dnd/DndAdapter';

// Define Task interface
interface Task {
  id: string;
  text: string;
  subtasks?: Task[];
}

// EditTask Form component
const EditTaskForm: React.FC<{
  task: Task;
  onSave: (text: string) => void;
  onCancel: () => void;
}> = ({ task, onSave, onCancel }) => {
  const [text, setText] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);
  
  return (
    <div className="edit-task-form">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onSave(text)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSave(text);
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
      />
    </div>
  );
};

// Individual TaskItem component
interface TaskItemProps {
  task: Task;
  index: number;
  isBeingSwiped: boolean;
  swipeOffset: number;
  isEditing: boolean;
  onSave: (text: string) => void;
  onCancel: () => void;
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

// Header component
const Header: React.FC<{
  parentTaskText?: string;
  onBack?: () => void;
  onAddTask: () => void;
  canAddTask: boolean;
}> = ({ parentTaskText, onBack, onAddTask, canAddTask }) => {
  return (
    <div className="task-header">
      <div className="header-left">
        {onBack && (
          <button className="back-button" onClick={onBack}>
            <span className="back-icon">←</span>
          </button>
        )}
        <h2 className="header-title">{parentTaskText || 'Tasks'}</h2>
      </div>
      <div className="header-actions">
        <button className="header-button undo-button" title="Undo">
          <span>↩</span>
        </button>
        <button className="header-button redo-button" title="Redo">
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
        <button className="header-button settings-button" title="Settings">
          <span>⚙</span>
        </button>
      </div>
    </div>
  );
};

// Main TaskListView component
const TaskListView: React.FC<{
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onOpenSubtasks: (task: Task) => void;
  onBack?: () => void;
  parentTaskText?: string;
}> = ({ tasks, setTasks, onOpenSubtasks, onBack, parentTaskText }) => {
  // State for task interactions
  const [swipingTaskId, setSwipingTaskId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
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
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  }, [setTasks]);
  
  const handleEditTask = useCallback((id: string, newText: string) => {
    if (!newText.trim()) {
      // Remove task if text is empty
      handleRemoveTask(id);
      return;
    }
    
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, text: newText } : task
      )
    );
  }, [handleRemoveTask, setTasks]);
  
  // Insert a new task at specific index
  const handleInsertTask = useCallback((index: number) => {
    if (tasks.length >= 10) { // MAX_TASKS limit
      alert(`You can't add more than 10 tasks to this view.`);
      return;
    }
    
    // Ensure index is valid
    const validIndex = Math.max(-1, Math.min(index, tasks.length - 1));
    
    const newTaskId = Date.now().toString();
    setTasks(prevTasks => {
      const newTasks = [...prevTasks];
      // Insert after the specified index, or at the beginning if index is -1
      // or at the end if index is out of bounds
      if (validIndex === -1) {
        // Insert at the beginning
        newTasks.unshift({ id: newTaskId, text: 'New Task' });
      } else if (validIndex >= prevTasks.length - 1) {
        // Insert at the end
        newTasks.push({ id: newTaskId, text: 'New Task' });
      } else {
        // Insert after the specified index
        newTasks.splice(validIndex + 1, 0, { id: newTaskId, text: 'New Task' });
      }
      return newTasks;
    });
    
    // Enter edit mode on the new task
    setTimeout(() => setEditingTaskId(newTaskId), 10);
  }, [tasks.length, setTasks]);
  
  // Add a new task at the end
  const handleAddTask = useCallback(() => {
    if (tasks.length >= 10) { // MAX_TASKS limit
      alert(`You can't add more than 10 tasks to this view.`);
      return;
    }
    
    const newTaskId = Date.now().toString();
    setTasks(prevTasks => [...prevTasks, { id: newTaskId, text: 'New Task' }]);
    
    // Enter edit mode on the new task
    setTimeout(() => setEditingTaskId(newTaskId), 10);
  }, [tasks.length, setTasks]);
  
  // Handle gesture events - memoized to prevent unnecessary re-renders
  const handleGestureEvent = useCallback((action: GestureAction) => {
    // Handle each gesture type with specific task logic
    switch (action.type) {
      case 'GESTURE_TAP': {
        // Single tap - enter edit mode
        if (action.elementId) {
          setEditingTaskId(action.elementId);
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
    onOpenSubtasks, 
    swipingTaskId, 
    tasks
  ]);
  
  // Subscribe to gesture events - only once with stable reference
  useEffect(() => {
    const unsubscribe = gestureEventBus.subscribe(handleGestureEvent);
    return unsubscribe;
  }, [handleGestureEvent]);
  
  // Create a ref to track the current tasks
  const tasksRef = useRef(tasks);
  
  // Update the ref when tasks change
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  
  // Handle DnD events - only once with stable reference
  useEffect(() => {
    const unsubscribeDnd = dndAdapter.current.addDragListener((event: DragEvent) => {
      if (event.type === 'drag-end' && event.source && event.destination) {
        // Reorder tasks
        const oldIndex = event.source.index;
        const newIndex = event.destination.index;
        
        // Validate indices before reordering
        setTasks(prevTasks => {
          // Safety check to ensure indices are valid
          if (oldIndex < 0 || oldIndex >= prevTasks.length ||
              newIndex < 0 || newIndex >= prevTasks.length) {
            return prevTasks; // Return unchanged if indices are invalid
          }
          
          // Perform the reordering
          const newTasks = [...prevTasks];
          const [removed] = newTasks.splice(oldIndex, 1);
          newTasks.splice(newIndex, 0, removed);
          return newTasks;
        });
      }
    });
    
    return unsubscribeDnd;
  }, [setTasks]);
  
  // Initialize dnd adapter - only once
  useEffect(() => {
    dndAdapter.current.initialize();
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
        parentTaskText={onBack ? parentTaskText || "Subtasks" : "My Tasks"}
        onBack={onBack}
        onAddTask={handleAddTask}
        canAddTask={tasks.length < 10}
      />
      
      {dndAdapter.current.wrapContainer(
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
                handleEditTask(task.id, text);
                setEditingTaskId(null);
              }}
              onCancel={() => setEditingTaskId(null)}
              registerElement={registerElement}
              dndAdapter={dndAdapter.current}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskListView;