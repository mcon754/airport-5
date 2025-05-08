import { ReactNode } from 'react';
import { ElementId } from '../gesture/GestureEvents';

// Event types for drag operations
export type DragEvent = 
  | { type: 'drag-start', id: ElementId }
  | { type: 'drag-move', id: ElementId, source: { index: number } }
  | { type: 'drag-end', id: ElementId, source: { index: number }, destination: { index: number } | null };

// Interface that all DnD library adapters must implement
export interface DndAdapter {
  // Initialize the adapter
  initialize: () => void;
  
  // Wrap container with DnD context
  wrapContainer: (children: ReactNode) => ReactNode;
  
  // Wrap individual draggable items
  wrapItem: (
    id: ElementId, 
    children: ReactNode, 
    index: number
  ) => ReactNode;
  
  // Control methods
  startDrag: (itemId: ElementId) => void;
  moveDraggedItem: (offset: { x: number, y: number }) => void;
  endDrag: () => void;
  
  // Event handling
  addDragListener: (handler: (event: DragEvent) => void) => () => void;
  
  // State access
  getDragState: () => { isDragging: boolean, activeItemId: ElementId | null };
}

// Factory function that creates an adapter (implemented in separate files)
export function createDndAdapter(): DndAdapter {
  // This will be implemented in DndKitAdapter.tsx
  throw new Error("DnD adapter implementation not loaded");
}