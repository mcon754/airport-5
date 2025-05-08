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
  
  // Register the element when it's mounted - only log in development
  useEffect(() => {
    if (taskRef.current) {
      // Register the element with the gesture system
      registerElement(task.id, taskRef.current);
      
      // Only add these in development mode
      if (process.env.NODE_ENV === 'development') {
        // Add test handlers for debugging
        taskRef.current.addEventListener('click', () => {
          console.log('DIRECT CLICK TEST: Task element was clicked!', task.id);
        });
        
        taskRef.current.addEventListener('pointerdown', (e) => {
          console.log('DIRECT POINTER TEST: Task element pointer down!', task.id, e.clientX, e.clientY);
        });
      }
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

// Main TaskListView component
const TaskListView: React.FC<{
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onOpenSubtasks: (task: Task) => void;
  onBack?: () => void;
}> = ({ tasks, setTasks, onOpenSubtasks, onBack }) => {
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
    if (process.env.NODE_ENV === 'development') {
      console.log('TaskListView: Removing task', id);
    }
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  }, [setTasks]);
  
  const handleEditTask = useCallback((id: string, newText: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('TaskListView: Editing task', id, newText);
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.log('TaskListView: Inserting task at index', index);
    }
    if (tasks.length >= 10) { // MAX_TASKS limit
      alert(`You can't add more than 10 tasks to this view.`);
      return;
    }
    
    const newTaskId = Date.now().toString();
    setTasks(prevTasks => {
      const newTasks = [...prevTasks];
      newTasks.splice(index + 1, 0, { id: newTaskId, text: 'New Task' });
      return newTasks;
    });
    
    // Enter edit mode on the new task
    setTimeout(() => setEditingTaskId(newTaskId), 10);
  }, [tasks.length, setTasks]);
  
  // Add a new task at the end
  const handleAddTask = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('TaskListView: Adding new task at the end');
    }
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
    // Only log in development and only for important events
    const isDev = process.env.NODE_ENV === 'development';
    
    // Handle each gesture type with specific task logic
    switch (action.type) {
      case 'GESTURE_TAP': {
        // Single tap - enter edit mode
        if (action.elementId) {
          if (isDev) console.log('TaskListView: Tap on task', action.elementId);
          setEditingTaskId(action.elementId);
        }
        break;
      }
      
      case 'GESTURE_DOUBLE_TAP': {
        // Double tap - insert new task
        if (action.elementId) {
          if (isDev) console.log('TaskListView: Double tap on task', action.elementId);
          const index = tasks.findIndex(t => t.id === action.elementId);
          if (index !== -1) {
            handleInsertTask(index);
          }
        }
        break;
      }
      
      case 'GESTURE_LONG_PRESS': {
        // Long press - open subtasks
        if (action.elementId) {
          if (isDev) console.log('TaskListView: Long press on task', action.elementId);
          const task = tasks.find(t => t.id === action.elementId);
          if (task) {
            onOpenSubtasks(task);
          }
        }
        break;
      }
      
      case 'GESTURE_SWIPE_START': {
        // Start tracking swipe
        if (isDev) console.log('TaskListView: Swipe start on task', action.elementId);
        setSwipingTaskId(action.elementId);
        setSwipeOffset(0);
        break;
      }
      
      case 'GESTURE_SWIPE_MOVE': {
        // Update swipe UI
        if (action.elementId === swipingTaskId) {
          // Don't log every move event - too noisy
          setSwipeOffset(action.distance);
        }
        break;
      }
      
      case 'GESTURE_SWIPE_END': {
        // Complete swipe if threshold met
        if (action.elementId === swipingTaskId) {
          if (isDev) console.log('TaskListView: Swipe end on task', action.elementId, action.distance);
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
      
      case 'GESTURE_DRAG_START': {
        if (isDev) console.log('TaskListView: Drag start on task', action.elementId);
        break;
      }
      
      case 'GESTURE_DRAG_MOVE': {
        // Don't log every move event - too noisy
        break;
      }
      
      case 'GESTURE_DRAG_END': {
        if (isDev) console.log('TaskListView: Drag end on task', action.elementId);
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
  
  // Handle DnD events - only once with stable reference
  useEffect(() => {
    const unsubscribeDnd = dndAdapter.current.addDragListener((event: DragEvent) => {
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) console.log('TaskListView: Received DnD event:', event.type);
      
      if (event.type === 'drag-end' && event.source && event.destination) {
        // Reorder tasks
        const oldIndex = event.source.index;
        const newIndex = event.destination.index;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('TaskListView: Reordering tasks', { oldIndex, newIndex });
        }
        
        // Validate indices before reordering
        setTasks(prevTasks => {
          // Safety check to ensure indices are valid
          if (oldIndex < 0 || oldIndex >= prevTasks.length ||
              newIndex < 0 || newIndex >= prevTasks.length) {
            console.error('TaskListView: Invalid indices for reordering', {
              oldIndex,
              newIndex,
              tasksLength: prevTasks.length
            });
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
      {onBack && (
        <button className="back-button" onClick={onBack}>Back</button>
      )}
      
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
      
      <button 
        className="add-task-button"
        onClick={handleAddTask}
        disabled={tasks.length >= 10} // MAX_TASKS
      >
        Add Task
      </button>
    </div>
  );
};

export default TaskListView;