import { useRef, useCallback, useEffect } from 'react'; //React, 
import { gestureEventBus, ElementId, Point } from './GestureEvents'; //GestureAction

interface GestureOptions {
  swipeThreshold?: number;
  doubleTapDelay?: number;
  longPressDelay?: number;
}

export function useGestureManager(options: GestureOptions = {}) {
  // Default options
  const {
    //swipeThreshold = 80,
    doubleTapDelay = 300,
    longPressDelay = 600
  } = options;
  
  // Ref to track element registry
  const elementRegistry = useRef(new Map<ElementId, HTMLElement>());
  
  // Gesture state
  const gestureStateRef = useRef({
    isTracking: false,
    startPoint: { x: 0, y: 0 },
    currentPoint: { x: 0, y: 0 },
    startTime: 0,
    lastTapTime: 0,
    lastTapElementId: null as ElementId | null,
    currentGesture: null as 'swipe' | 'drag' | null,
    longPressTimer: null as NodeJS.Timeout | null,
    activeElementId: null as ElementId | null
  });
  
  // Reference to container element
  const containerRef = useRef<HTMLElement | null>(null);
  
  // Find element at point
  const findElementAt = useCallback((point: Point): ElementId | null => {
    // Convert Map entries to array for TypeScript compatibility
    const entries = Array.from(elementRegistry.current.entries());
    
    for (const [id, element] of entries) {
      const rect = element.getBoundingClientRect();
      if (
        point.x >= rect.left && point.x <= rect.right &&
        point.y >= rect.top && point.y <= rect.bottom
      ) {
        return id;
      }
    }
    return null;
  }, []);
  
  // Handle pointer down
  const handlePointerDown = useCallback((e: PointerEvent) => {
    const point = { x: e.clientX, y: e.clientY };
    const elementId = findElementAt(point);
    const now = Date.now();
    
    // Reset any existing long press timer
    if (gestureStateRef.current.longPressTimer) {
      clearTimeout(gestureStateRef.current.longPressTimer);
    }
    
    // Start tracking
    gestureStateRef.current = {
      ...gestureStateRef.current,
      isTracking: true,
      startPoint: point,
      currentPoint: point,
      startTime: now,
      currentGesture: null,
      activeElementId: elementId
    };
    
    // Set long press timer
    const timer = setTimeout(() => {
      if (gestureStateRef.current.isTracking && !gestureStateRef.current.currentGesture) {
        // This is a long press
        gestureEventBus.dispatch({
          type: 'GESTURE_LONG_PRESS',
          elementId: gestureStateRef.current.activeElementId,
          point: gestureStateRef.current.currentPoint
        });
      }
    }, longPressDelay);
    
    gestureStateRef.current.longPressTimer = timer;
  }, [findElementAt, longPressDelay]);
  
  // Handle pointer move
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!gestureStateRef.current.isTracking) return;
    
    const point = { x: e.clientX, y: e.clientY };
    gestureStateRef.current.currentPoint = point;
    
    // Calculate movement deltas
    const deltaX = point.x - gestureStateRef.current.startPoint.x;
    const deltaY = point.y - gestureStateRef.current.startPoint.y;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Clear long press timer if significant movement occurs
    if (absX > 5 || absY > 5) {
      if (gestureStateRef.current.longPressTimer) {
        clearTimeout(gestureStateRef.current.longPressTimer);
        gestureStateRef.current.longPressTimer = null;
      }
    }
    
    // Determine gesture type if not already determined
    if (gestureStateRef.current.currentGesture === null) {
      // Elapsed time to calculate velocity
      //const elapsed = Date.now() - gestureStateRef.current.startTime + 1; // +1 to avoid division by zero
      //const velocity = absX / elapsed;
      
      // Detect swipes with more tolerance for vertical movement
      // Allow vertical movement up to half of horizontal movement
      if (absX > 15) { 
        // Horizontal-dominant movement = swipe
        gestureStateRef.current.currentGesture = 'swipe';
        
        // Dispatch swipe start
        gestureEventBus.dispatch({
          type: 'GESTURE_SWIPE_START',
          elementId: gestureStateRef.current.activeElementId,
          direction: deltaX < 0 ? 'left' : 'right',
          point
        });
        
        // Update global state for DnD coordination
        window.currentGestureIntent = 'swipe';
        window.gestureTargetId = gestureStateRef.current.activeElementId;
      }
      else if (absY > 15) {
        // Any other significant movement = drag (very responsive)
        gestureStateRef.current.currentGesture = 'drag';
        
        // Dispatch drag start
        gestureEventBus.dispatch({
          type: 'GESTURE_DRAG_START',
          elementId: gestureStateRef.current.activeElementId,
          point
        });
        
        // Update global state for DnD coordination
        window.currentGestureIntent = 'drag';
        window.gestureTargetId = gestureStateRef.current.activeElementId;
      }
    }
    
    // Send updates based on current gesture
    if (gestureStateRef.current.currentGesture === 'swipe') {
      gestureEventBus.dispatch({
        type: 'GESTURE_SWIPE_MOVE',
        elementId: gestureStateRef.current.activeElementId,
        distance: deltaX,
        point
      });
    } 
    else if (gestureStateRef.current.currentGesture === 'drag') {
      gestureEventBus.dispatch({
        type: 'GESTURE_DRAG_MOVE',
        elementId: gestureStateRef.current.activeElementId,
        offset: { x: deltaX, y: deltaY },
        point
      });
    }
  }, []); //[findElementAt]
  
  // Handle pointer up
  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!gestureStateRef.current.isTracking) return;
    
    // Clear any pending long press timer
    if (gestureStateRef.current.longPressTimer) {
      clearTimeout(gestureStateRef.current.longPressTimer);
      gestureStateRef.current.longPressTimer = null;
    }
    
    const point = { x: e.clientX, y: e.clientY };
    const now = Date.now();
    
    const deltaX = point.x - gestureStateRef.current.startPoint.x;
    const deltaY = point.y - gestureStateRef.current.startPoint.y;
    const elapsed = now - gestureStateRef.current.startTime;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Handle gesture completion based on type
    if (gestureStateRef.current.currentGesture === 'swipe') {
      // Calculate velocity
      const velocity = absX / (elapsed || 1); // Avoid division by zero
      
      gestureEventBus.dispatch({
        type: 'GESTURE_SWIPE_END',
        elementId: gestureStateRef.current.activeElementId,
        distance: deltaX,
        velocity,
        point
      });
    }
    else if (gestureStateRef.current.currentGesture === 'drag') {
      gestureEventBus.dispatch({
        type: 'GESTURE_DRAG_END',
        elementId: gestureStateRef.current.activeElementId,
        offset: { x: deltaX, y: deltaY },
        point
      });
    }
    else if (absX < 5 && absY < 5 && elapsed < 300) {
      // This was a tap (minimal movement and short duration)
      const { lastTapTime, lastTapElementId } = gestureStateRef.current;
      
      // Check if this is a double tap (on same element or both on empty space)
      const isSameElement = lastTapElementId === gestureStateRef.current.activeElementId;
      const isBothEmpty = lastTapElementId === null && gestureStateRef.current.activeElementId === null;
      
      if (now - lastTapTime < doubleTapDelay && (isSameElement || isBothEmpty)) {
        // Double tap - works on elements or empty space
        gestureEventBus.dispatch({
          type: 'GESTURE_DOUBLE_TAP',
          elementId: gestureStateRef.current.activeElementId,
          point
        });
        
        // Reset tap tracking
        gestureStateRef.current.lastTapTime = 0;
        gestureStateRef.current.lastTapElementId = null;
      } else {
        // Single tap
        gestureEventBus.dispatch({
          type: 'GESTURE_TAP',
          elementId: gestureStateRef.current.activeElementId,
          point
        });
        
        // Record for potential double tap
        gestureStateRef.current.lastTapTime = now;
        gestureStateRef.current.lastTapElementId = gestureStateRef.current.activeElementId;
      }
    }
    
    // Reset gesture state
    gestureStateRef.current = {
      ...gestureStateRef.current,
      isTracking: false,
      currentGesture: null,
      activeElementId: null
    };
    
    // Clear global gesture state
    window.currentGestureIntent = null;
    window.gestureTargetId = null;
  }, [doubleTapDelay]);
  
  // Register event handlers to container
  const gestureBindings = useCallback((element: HTMLElement | null) => {
    // Clean up any existing document-level listeners
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('pointercancel', handlePointerUp);
    
    if (containerRef.current) {
      // Remove old event listeners if container changes
      containerRef.current.removeEventListener('pointerdown', handlePointerDown);
    }
    
    if (element) {
      // Only add pointerdown to the container
      element.addEventListener('pointerdown', handlePointerDown);
      
      // Add move and up listeners to document to catch events outside container
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);
      
      // Store reference to container
      containerRef.current = element;
    }
    
    // Return element (useful for ref forwarding)
    return element;
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('pointerdown', handlePointerDown);
      }
      
      // Clean up document listeners
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
      
      if (gestureStateRef.current.longPressTimer) {
        clearTimeout(gestureStateRef.current.longPressTimer);
      }
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);
  
  // Element registration function
  const registerElement = useCallback((id: ElementId, element: HTMLElement | null) => {
    if (element) {
      elementRegistry.current.set(id, element);
    } else {
      elementRegistry.current.delete(id);
    }
  }, []);
  
  // Return methods for binding and registration
  return {
    gestureBindings,
    registerElement
  };
}