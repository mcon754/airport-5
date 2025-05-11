import React, { useRef } from 'react';
import './SettingsModal.css';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { exportTasks, importTasks } from '../store/taskSlice';
import { selectTasksById } from '../store/taskSelectors';
import { Task } from '../types/task';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const tasksById = useAppSelector(selectTasksById);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Convert tasks to array for export
  const handleExport = () => {
    // Get all tasks as an array
    const tasksArray = Object.values(tasksById);
    
    // Create a JSON string
    const jsonData = JSON.stringify(tasksArray, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `airport-tasks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Dispatch the export action (for tracking purposes)
    dispatch(exportTasks());
  };

  // Handle file selection for import
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const tasks = JSON.parse(content) as Task[];
        
        // Validate the imported data
        if (!Array.isArray(tasks)) {
          throw new Error('Invalid format: Expected an array of tasks');
        }
        
        // Check if each task has the required fields
        const isValid = tasks.every(task => 
          typeof task.id === 'string' && 
          typeof task.text === 'string' && 
          (task.parentId === null || typeof task.parentId === 'string')
        );
        
        if (!isValid) {
          throw new Error('Invalid task format in the imported file');
        }
        
        // Import the tasks
        dispatch(importTasks(tasks));
        
        // Close the modal
        onClose();
        
        // Show success message
        alert('Tasks imported successfully!');
      } catch (error) {
        alert(`Error importing tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    reader.readAsText(file);
  };

  // Trigger file input click
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-modal-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="settings-modal-content">
          <h3>Data Management</h3>
          
          <div className="settings-section">
            <button className="settings-button" onClick={handleExport}>
              Export Tasks as JSON
            </button>
            <p className="settings-description">
              Download your tasks as a JSON file that you can back up or transfer to another device.
            </p>
          </div>
          
          <div className="settings-section">
            <button className="settings-button" onClick={handleImportClick}>
              Import Tasks from JSON
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".json" 
              onChange={handleFileSelect} 
            />
            <p className="settings-description">
              Import tasks from a previously exported JSON file. This will replace your current tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;