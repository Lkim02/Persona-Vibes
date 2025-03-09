import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useTweetStore from '../../store/tweetStore';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMonitoring, setIsMonitoring] = useState(true);
  
  // Load monitoring state from storage when component mounts
  useEffect(() => {
    chrome.storage.local.get(['isMonitoringEnabled'], (result) => {
      if (result.isMonitoringEnabled !== undefined) {
        setIsMonitoring(result.isMonitoringEnabled);
      }
    });
  }, []);
  
  // Handle user logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Toggle monitoring state
  const toggleMonitoring = () => {
    const newState = !isMonitoring;
    setIsMonitoring(newState);
    // Send message to background script to enable/disable monitoring
    chrome.runtime.sendMessage({
      action: newState ? 'startMonitoring' : 'stopMonitoring'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      {/* Header with logo and user info */}
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
            <h1 className="text-xl font-bold text-gray-900">Twitter Monitor</h1>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-500 to-indigo-600">
            <h2 className="text-xl font-bold text-white">Twitter Activity Monitor</h2>
            <p className="text-blue-100 text-sm mt-1">Monitor and record your Twitter activity</p>
          </div>
          
          {/* Card content */}
          <div className="p-6">
            {/* Monitoring toggle */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Monitoring Status</h3>
                <p className="text-sm text-gray-500">
                  {isMonitoring ? 'Monitoring is enabled' : 'Monitoring is disabled'}
                </p>
              </div>
              {/* Fixed toggle switch */}
              <div className="relative inline-block w-12 align-middle select-none">
                <input 
                  type="checkbox" 
                  name="toggle" 
                  id="toggle"
                  className="sr-only"
                  checked={isMonitoring}
                  onChange={toggleMonitoring}
                />
                <label 
                  htmlFor="toggle" 
                  className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in ${isMonitoring ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span 
                    className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in ${isMonitoring ? 'translate-x-6' : 'translate-x-0'}`}
                  />
                </label>
              </div>
            </div>
            
            {/* Privacy notice */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Privacy Notice</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      This extension monitors and records your tweets and replies on Twitter/X. All data is stored locally on your device and is not sent to any external servers. You can enable or disable monitoring at any time using the toggle above.
                    </p>
                    <p className="mt-2">
                      By using this extension, you consent to the collection of this data for analysis and research purposes. You can log out at any time to stop data collection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* User info */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center text-sm text-gray-500">
                <svg className="h-4 w-4 mr-1.5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>Logged in as: {user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white py-4 border-t border-gray-200">
        <div className="max-w-md mx-auto text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Twitter Activity Monitor. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
