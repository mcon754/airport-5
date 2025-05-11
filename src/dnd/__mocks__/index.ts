import { ReactNode } from 'react';
import { DndAdapter, DragEvent } from '../DndAdapter';
import { ElementId } from '../../gesture/GestureEvents';

// Mock implementation of DndAdapter for testing
class MockDndAdapter implements DndAdapter {
  private listeners: ((event: DragEvent) => void)[] = [];

  initialize = () => {
    // No-op for testing
  };

  wrapContainer = (children: ReactNode): ReactNode => {
    // Simply return the children without wrapping
    return children;
  };

  wrapItem = (id: ElementId, children: ReactNode, index: number): ReactNode => {
    // Simply return the children without wrapping
    return children;
  };

  startDrag = (itemId: ElementId) => {
    // No-op for testing
  };

  moveDraggedItem = (offset: { x: number, y: number }) => {
    // No-op for testing
  };

  endDrag = () => {
    // No-op for testing
  };

  addDragListener = (handler: (event: DragEvent) => void) => {
    this.listeners.push(handler);
    return () => {
      this.listeners = this.listeners.filter(l => l !== handler);
    };
  };

  getDragState = () => {
    return {
      isDragging: false,
      activeItemId: null
    };
  };
}

// Export the mock adapter factory
export function createDndAdapter(): DndAdapter {
  return new MockDndAdapter();
}

// Re-export types from the real module
export * from '../DndAdapter';