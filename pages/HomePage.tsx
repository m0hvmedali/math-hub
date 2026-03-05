
import React from 'react';
import { BookOpenIcon } from '../components/Icons';

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-gray-900 rounded-lg p-8">
      <BookOpenIcon className="w-24 h-24 text-blue-500 mb-6" />
      <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Welcome to Your Math Study Hub</h1>
      <p className="max-w-2xl text-lg text-gray-400">
        This is your personal space to organize all your math studies. Create branches for different subjects, add lessons with detailed notes, and keep all your materials in one place.
      </p>
      <p className="mt-6 text-gray-500">
        Select a lesson from the sidebar to view its content, or create a new branch to get started.
      </p>
    </div>
  );
};

export default HomePage;
