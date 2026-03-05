import React from 'react';
import { supabase } from '../supabaseClient';

const SettingsPage: React.FC = () => {

  const handleClearData = async () => {
    if (!supabase) {
      alert("Supabase is not configured. Cannot clear data.");
      return;
    }
    if (window.confirm('Are you absolutely sure? This will delete all branches, lessons, and timeline items from the database. This action cannot be undone.')) {
      try {
        // We use neq (not equal) to a dummy value to delete all rows.
        const { error: branchError } = await supabase.from('branches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (branchError) throw branchError;

        const { error: timelineError } = await supabase.from('timeline_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (timelineError) throw timelineError;
        
        alert('All data has been cleared successfully.');
        window.location.href = '/'; // Navigate to home to reload app state
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Failed to clear all data. Please check the console for errors.');
      }
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-extrabold text-white mb-8">Settings</h1>
      
      <div className="space-y-6 max-w-2xl">
        <div className="bg-gray-800/50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-2">Data Management</h2>
            <p className="text-gray-400 mb-4">
                All your data is stored in a secure, cloud-based database. Clearing the data will permanently remove all your content.
            </p>
            <button
                onClick={handleClearData}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
                Clear All Data
            </button>
        </div>
         <div className="bg-gray-800/50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-2">About</h2>
            <p className="text-gray-400">
                Math Study Hub v2.0. A personal, cloud-synced space for organizing your mathematical journey.
            </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;