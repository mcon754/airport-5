import React, { ReactNode, useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
  PointerActivationConstraint,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndAdapter, DragEvent } from './DndAdapter';
import { ElementId } from '../gesture/GestureEvents';

// No custom sensor needed - we'll handle coordination through other means

// Sortable item wrapper
const SortableItemWrapper = ({ id, children, listeners, attributes, setNodeRef, transform, transition, isDragging }: any) => {
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
      }}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
};

// Implementation of the DndAdapter interface for dnd-kit
export class DndKitAdapter implements DndAdapter {
  private listeners: ((event: DragEvent) => void)[] = [];
  private isDragging = false;
  private activeItemId: ElementId | null = null;
  private itemOrder: ElementId[] = [];
  private setSensors: React.Dispatch<React.SetStateAction<any>> | null = null;
  private setItems: React.Dispatch<React.SetStateAction<ElementId[]>> | null = null;

  initialize = () => {
    // Nothing to initialize for dnd-kit
  };

  // Wrap the container with DndContext
  wrapContainer = (children: ReactNode): ReactNode => {
    // We need to use a render function to access hooks in a class
    const DndContainer = () => {
      // Set up sensors for dnd-kit
      const [sensorConfig, setSensorConfig] = useState({
        activationConstraint: {
          distance: 5, // Small distance to activate drag
          tolerance: 5 // Small tolerance for movement
        } as PointerActivationConstraint
      });
      this.setSensors = setSensorConfig;
      
      // Track items order
      const [items, setItems] = useState<ElementId[]>(this.itemOrder);
      this.setItems = setItems;
      
      // Create sensors for dnd-kit
      console.log('DndKitAdapter: Creating sensors with config', sensorConfig);
      
      // Use a simple activation constraint with a delay
      // This gives our gesture system time to detect swipes first
      const sensors = useSensors(
        useSensor(PointerSensor, {
          activationConstraint: {
            delay: 150, // Short delay to allow gesture detection
            tolerance: 5, // Small tolerance for movement
            distance: 5 // Small distance to activate
          }
        }),
        useSensor(KeyboardSensor, {
          coordinateGetter: sortableKeyboardCoordinates,
        })
      );
      
      console.log('DndKitAdapter: Sensors created');

      const handleDragStart = (event: DragStartEvent) => {
        console.log('DndKitAdapter: Drag start event', event.active.id);
        this.isDragging = true;
        this.activeItemId = event.active.id as ElementId;
        
        // Notify listeners
        this.listeners.forEach(listener => listener({
          type: 'drag-start',
          id: event.active.id as ElementId
        }));
      };

      const handleDragMove = (event: DragMoveEvent) => {
        if (!this.activeItemId) return;
        
        // Get current index
        const index = items.indexOf(this.activeItemId);
        
        // Notify listeners
        this.listeners.forEach(listener => listener({
          type: 'drag-move',
          id: this.activeItemId as ElementId,
          source: { index }
        }));
      };

      const handleDragEnd = (event: DragEndEvent) => {
        console.log('DndKitAdapter: Drag end event', event);
        if (!this.activeItemId) {
          console.warn('DndKitAdapter: No active item ID in drag end handler');
          return;
        }
        
        const { active, over } = event;
        
        // Handle item reordering
        if (over && active.id !== over.id) {
          const oldIndex = items.indexOf(active.id as ElementId);
          const newIndex = items.indexOf(over.id as ElementId);
          
          // Validate indices
          if (oldIndex === -1 || newIndex === -1) {
            console.error('DndKitAdapter: Invalid indices for drag end', {
              activeId: active.id,
              overId: over.id,
              oldIndex,
              newIndex,
              items
            });
            
            // Reset state without notifying listeners
            this.isDragging = false;
            this.activeItemId = null;
            return;
          }
          
          // Update items order
          const newItems = arrayMove(items, oldIndex, newIndex);
          setItems(newItems);
          this.itemOrder = newItems;
          
          // Notify listeners
          this.listeners.forEach(listener => listener({
            type: 'drag-end',
            id: active.id as ElementId,
            source: { index: oldIndex },
            destination: { index: newIndex }
          }));
        } else {
          // Drag cancelled or dropped in same position
          const index = items.indexOf(active.id as ElementId);
          
          if (index === -1) {
            console.error('DndKitAdapter: Invalid index for drag end', {
              activeId: active.id,
              index,
              items
            });
            
            // Reset state without notifying listeners
            this.isDragging = false;
            this.activeItemId = null;
            return;
          }
          
          this.listeners.forEach(listener => listener({
            type: 'drag-end',
            id: active.id as ElementId,
            source: { index },
            destination: null
          }));
        }
        
        // Reset state
        this.isDragging = false;
        this.activeItemId = null;
      };

      // Ensure items are synchronized when passed from parent
      useEffect(() => {
        if (this.itemOrder.length > 0 && items.length === 0) {
          setItems(this.itemOrder);
        }
      }, [items]);

      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items}
            strategy={verticalListSortingStrategy}
          >
            {children}
          </SortableContext>
        </DndContext>
      );
    };

    return <DndContainer />;
  };

  // Wrap an individual draggable item
  wrapItem = (id: ElementId, children: ReactNode, index: number): ReactNode => {
    // Add to item order if not already there
    if (!this.itemOrder.includes(id)) {
      this.itemOrder.push(id);
      if (this.setItems) {
        this.setItems(this.itemOrder);
      }
    }
    
    // We need a render function to use hooks
    const SortableItem = () => {
      const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
      } = useSortable({ id });
      
      return (
        <SortableItemWrapper
          id={id}
          listeners={listeners}
          attributes={attributes}
          setNodeRef={setNodeRef}
          transform={transform}
          transition={transition}
          isDragging={isDragging}
        >
          {children}
        </SortableItemWrapper>
      );
    };
    
    return <SortableItem key={id} />;
  };

  // Programmatically start dragging
  startDrag = (itemId: ElementId) => {
    console.log('DndKitAdapter: Programmatic drag start requested for', itemId);
    // dnd-kit doesn't support programmatic drag initiation
    // but we can update our gesture coordination system
    window.currentGestureIntent = 'drag';
    window.gestureTargetId = itemId;
    console.log('DndKitAdapter: Set global gesture intent to drag for', itemId);
  };

  // Programmatically move dragged item
  moveDraggedItem = (offset: { x: number, y: number }) => {
    // Not supported by dnd-kit
  };

  // Programmatically end dragging
  endDrag = () => {
    window.currentGestureIntent = null;
    window.gestureTargetId = null;
  };

  // Add a drag event listener
  addDragListener = (handler: (event: DragEvent) => void) => {
    console.log('DndKitAdapter: Adding drag event listener, total listeners:', this.listeners.length + 1);
    this.listeners.push(handler);
    return () => {
      this.listeners = this.listeners.filter(l => l !== handler);
      console.log('DndKitAdapter: Removed drag event listener, remaining listeners:', this.listeners.length);
    };
  };

  // Get current drag state
  getDragState = () => {
    return {
      isDragging: this.isDragging,
      activeItemId: this.activeItemId
    };
  };
}

// Factory function to create DnD adapter
export function createDndKitAdapter(): DndAdapter {
  return new DndKitAdapter();
}

// Export the factory function as the default implementation
// This allows us to swap implementations in the future