import { useEffect } from 'react'
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import useTweetStore from './store/tweetStore'

// Import components
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import Dashboard from './components/dashboard/Dashboard'
import PrivateRoute from './components/auth/PrivateRoute'

function App() {
  const { isAuthenticated, user } = useAuthStore()
  const { loadTweets } = useTweetStore()

  // Load tweets from storage when the app initializes
  useEffect(() => {
    if (isAuthenticated) {
      loadTweets()
    }
  }, [isAuthenticated, loadTweets])

  return (
    <Router initialEntries={['/']}>
      <div className="min-h-screen bg-gray-100">
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
