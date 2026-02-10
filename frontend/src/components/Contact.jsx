import React, { useState } from 'react'
import { useAppDispatch } from '../store/hooks'
import { setSnackbar } from '../store/slices/loansSlice'
import Icon from './Icon'
import LocationIcon from '../assets/icons/LocationIcon.svg'
import PhoneIcon from '../assets/icons/PhoneIcon.svg'
import EmailIcon from '../assets/icons/EmailIcon.svg'
import ClockIcon from '../assets/icons/ClockIcon.svg'
import Snackbar from './Snackbar'
import { contactAPI } from '../services/api'
import './Contact.scss'

const Contact = () => {
  const dispatch = useAppDispatch()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Validate message (matching backend: min 10, max 1000 characters)
    const messageTrimmed = formData.message.trim()
    if (!messageTrimmed) {
      newErrors.message = 'Message is required'
    } else if (messageTrimmed.length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    } else if (messageTrimmed.length > 1000) {
      newErrors.message = 'Message must not exceed 1000 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)

    try {
      // Trim all fields before submission (matching backend)
      const trimmedFormData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        message: formData.message.trim()
      }
      const response = await contactAPI.submitContact(trimmedFormData)
      
      if (response.success) {
        dispatch(setSnackbar({
          message: response.message || 'Thank you for contacting us! We will get back to you soon.',
          severity: 'success'
        }))
        setFormData({ name: '', email: '', phone: '', message: '' })
      } else {
        // Handle validation errors
        let errorMessage = response.message || 'Failed to send message. Please try again.'
        if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
          errorMessage = response.errors.map(err => err.message || err.msg).join(', ')
        }
        dispatch(setSnackbar({
          message: errorMessage,
          severity: 'error'
        }))
      }
    } catch (error) {
      console.error('Contact form submission error:', error)
      // Try to extract error message from response
      let errorMessage = error.message || 'Failed to send message. Please try again later.'
      if (error.response && error.response.errors) {
        errorMessage = error.response.errors.map(err => err.message || err.msg).join(', ')
      }
      dispatch(setSnackbar({
        message: errorMessage,
        severity: 'error'
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="contact">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Get In Touch</h2>
          <p className="section-subtitle">
            Ready to start your financial journey? Contact us today
          </p>
        </div>
        <div className="contact-content">
          <div className="contact-info">
            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon-wrapper">
                  <Icon src={LocationIcon} className="info-icon" alt="Location" />
                </div>
                <h3>Address</h3>
                <p>Colony Bazar, Barpeta<br />Assam 781314</p>
              </div>
              <div className="info-card">
                <div className="info-icon-wrapper">
                  <Icon src={PhoneIcon} className="info-icon" alt="Phone" />
                </div>
                <h3>Phone</h3>
                <p>+91 9957487109</p>
              </div>
              <div className="info-card">
                <div className="info-icon-wrapper">
                  <Icon src={EmailIcon} className="info-icon" alt="Email" />
                </div>
                <h3>Email</h3>
                <p>zariyatcs@gmail.com</p>
              </div>
              <div className="info-card">
                <div className="info-icon-wrapper">
                  <Icon src={ClockIcon} className="info-icon" alt="Hours" />
                </div>
                <h3>Hours</h3>
                <p>Monday - Saturday: 11:00 AM - 8:00 PM<br />Sunday: 02:00 PM - 7:00 PM</p>
              </div>
            </div>
          </div>
          <form className="contact-form" onSubmit={handleSubmit} autoComplete="off">
            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="form-group">
              <input
                type="tel"
                name="phone"
                placeholder="Your Phone"
                value={formData.phone}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <textarea
                name="message"
                placeholder="Your Message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                maxLength={1000}
                className={errors.message ? 'error' : ''}
              ></textarea>
              {errors.message && (
                <span className="error-message">{errors.message}</span>
              )}
              <span className="char-count">
                {formData.message.trim().length}/1000 characters
              </span>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', display: 'inline-block' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                      <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                      <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>
      </div>
      <Snackbar />
    </section>
  )
}

export default Contact

