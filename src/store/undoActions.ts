import { ActionCreators } from 'redux-undo';

// Export the undo and redo action creators from redux-undo
export const undoAction = ActionCreators.undo;
export const redoAction = ActionCreators.redo;