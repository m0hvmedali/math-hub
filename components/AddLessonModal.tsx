
import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './Icons';

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lessonName: string) => void;
}

const AddLessonModal: React.FC<AddLessonModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
      if (!isOpen) {
          setName('');
      }
  },[isOpen])

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
        <header className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">Add New Lesson</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label htmlFor="lesson-name" className="block text-sm font-medium text-gray-400 mb-2">
              Lesson Name
            </label>
            <input
              ref={inputRef}
              id="lesson-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Introduction to Algebra"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <footer className="flex justify-end p-4 border-t border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 rounded-md hover:bg-gray-800 mr-2">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600" disabled={!name.trim()}>
              Save Lesson
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddLessonModal;
