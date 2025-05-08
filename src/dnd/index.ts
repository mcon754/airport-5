// Export the adapter interface
export * from './DndAdapter';

// Export the dnd-kit implementation as the default adapter
export { createDndKitAdapter as createDndAdapter } from './DndKitAdapter';