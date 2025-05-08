export type ElementId = string;
export type Point = { x: number, y: number };

export type GestureAction = 
  | { type: 'GESTURE_TAP', elementId: ElementId | null, point: Point }
  | { type: 'GESTURE_DOUBLE_TAP', elementId: ElementId | null, point: Point }
  | { type: 'GESTURE_LONG_PRESS', elementId: ElementId | null, point: Point }
  | { type: 'GESTURE_SWIPE_START', elementId: ElementId | null, direction: 'left' | 'right', point: Point }
  | { type: 'GESTURE_SWIPE_MOVE', elementId: ElementId | null, distance: number, point: Point }
  | { type: 'GESTURE_SWIPE_END', elementId: ElementId | null, distance: number, velocity: number, point: Point }
  | { type: 'GESTURE_DRAG_START', elementId: ElementId | null, point: Point }
  | { type: 'GESTURE_DRAG_MOVE', elementId: ElementId | null, offset: Point, point: Point }
  | { type: 'GESTURE_DRAG_END', elementId: ElementId | null, offset: Point, point: Point };

// Simple event bus implementation
export class GestureEventBus {
  private listeners: ((action: GestureAction) => void)[] = [];

  dispatch(action: GestureAction) {
    this.listeners.forEach(listener => listener(action));
  }

  subscribe(listener: (action: GestureAction) => void) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

// Singleton instance
export const gestureEventBus = new GestureEventBus();

// Declare global window properties for cross-system coordination
declare global {
  interface Window {
    currentGestureIntent: 'swipe' | 'drag' | null;
    gestureTargetId: ElementId | null;
  }
}

// Initialize global properties
window.currentGestureIntent = null;
window.gestureTargetId = null;