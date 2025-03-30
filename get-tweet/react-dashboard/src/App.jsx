import { useEffect, useState } from 'react'
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import useTweetStore from './store/tweetStore'
import { initializeErrorListener, registerErrorListener } from './utils/errorHandler'

// Import components
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import Dashboard from './components/dashboard/Dashboard'
import PrivateRoute from './components/auth/PrivateRoute'

function App() {
  const { isAuthenticated, user } = useAuthStore()
  const { loadTweets } = useTweetStore()
  const [error, setError] = useState(null)

  // Initialize error listener
  useEffect(() => {
    initializeErrorListener();
    
    // Register for error notifications
    const unsubscribe = registerErrorListener((errorMessage) => {
      setError(errorMessage);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    });
    
    return () => {
      // Clean up listener on component unmount
      unsubscribe();
    };
  }, []);

  // Load tweets from storage when the app initializes
  useEffect(() => {
    if (isAuthenticated) {
      loadTweets()
    }
  }, [isAuthenticated, loadTweets])

  return (
    <Router initialEntries={['/']}>
      <div className="min-h-screen bg-gray-100">
        {/* Error notification */}
        {error && (
          <div className="fixed top-4 right-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 shadow-md">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="block sm:inline">{error}</span>
              </div>
              <button 
                onClick={() => setError(null)}
                className="ml-auto -mx-1.5 -my-1.5 bg-red-100 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 hover:bg-red-200 inline-flex items-center justify-center h-8 w-8"
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Register />
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
