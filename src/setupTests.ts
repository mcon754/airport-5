// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock gesture system
jest.mock('./gesture/GestureEvents', () => ({
  gestureEventBus: {
    subscribe: jest.fn(() => jest.fn()), // Returns unsubscribe function
    publish: jest.fn(),
  },
  GestureAction: {
    GESTURE_TAP: 'GESTURE_TAP',
    GESTURE_DOUBLE_TAP: 'GESTURE_DOUBLE_TAP',
    GESTURE_LONG_PRESS: 'GESTURE_LONG_PRESS',
    GESTURE_SWIPE_START: 'GESTURE_SWIPE_START',
    GESTURE_SWIPE_MOVE: 'GESTURE_SWIPE_MOVE',
    GESTURE_SWIPE_END: 'GESTURE_SWIPE_END',
    GESTURE_DRAG_START: 'GESTURE_DRAG_START',
    GESTURE_DRAG_MOVE: 'GESTURE_DRAG_MOVE',
    GESTURE_DRAG_END: 'GESTURE_DRAG_END',
  },
  ElementId: String,
}));

// Mock DnD adapter
jest.mock('./dnd/index', () => ({
  createDndAdapter: jest.fn(() => ({
    initialize: jest.fn(),
    addDragListener: jest.fn(() => jest.fn()),
    wrapItem: jest.fn((id, content) => content),
    wrapContainer: jest.fn((content) => content),
  })),
  DragEvent: {
    type: String,
    source: Object,
    destination: Object,
  },
}));

// Use fake timers
jest.useFakeTimers();
