import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice'
import { authAPI } from '../services/api'
import TextField from '../components/TextField'
import Snackbar from '../components/Snackbar'
import logoImage from '../assets/logo.jpeg'
import './Login.scss'

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields correctly',
        severity: 'error'
      })
      return
    }

    dispatch(loginStart())

    try {
      console.log('Calling API...', formData.email)
      const response = await authAPI.login(formData.email, formData.password)
      console.log('API Response:', response)

      if (response.success && response.data) {
        dispatch(
          loginSuccess({
            user: response.data.user,
            token: response.data.token,
          })
        )
        navigate('/dashboard')
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = error.message || 'Either email or password is incorrect'
      dispatch(loginFailure(errorMessage))
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      })
    }
  }

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-background-overlay"></div>
        <div className="login-background-pattern"></div>
      </div>

      <div className="login-container">
        {snackbar && (
          <Snackbar
            open={snackbar.open}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            message={snackbar.message}
            severity={snackbar.severity}
          />
        )}
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <img src={logoImage} alt="Zariya Logo" className="login-logo-image" />
            </div>
            <div className="login-welcome">
              <h1>Welcome Back</h1>
              <p>Sign in to access your account</p>
            </div>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>

            <div className="form-group">
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="form-group">
              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-login" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                      <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                      <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
