import React, { useState } from 'react'
import Icon from './Icon'
import LocationIcon from '../assets/icons/LocationIcon.svg'
import PhoneIcon from '../assets/icons/PhoneIcon.svg'
import EmailIcon from '../assets/icons/EmailIcon.svg'
import ClockIcon from '../assets/icons/ClockIcon.svg'
import './Contact.scss'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Form submission logic would go here
    alert('Thank you for your interest! We will contact you soon.')
    setFormData({ name: '', email: '', phone: '', message: '' })
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
                <p>123 Financial District<br />Your City, State 12345</p>
              </div>
              <div className="info-card">
                <div className="info-icon-wrapper">
                  <Icon src={PhoneIcon} className="info-icon" alt="Phone" />
                </div>
                <h3>Phone</h3>
                <p>+1 (555) 123-4567</p>
              </div>
              <div className="info-card">
                <div className="info-icon-wrapper">
                  <Icon src={EmailIcon} className="info-icon" alt="Email" />
                </div>
                <h3>Email</h3>
                <p>info@zariya.coop</p>
              </div>
              <div className="info-card">
                <div className="info-icon-wrapper">
                  <Icon src={ClockIcon} className="info-icon" alt="Hours" />
                </div>
                <h3>Hours</h3>
                <p>Monday - Friday: 9:00 AM - 5:00 PM<br />Saturday: 10:00 AM - 2:00 PM</p>
              </div>
            </div>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
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
              />
            </div>
            <div className="form-group">
              <textarea
                name="message"
                placeholder="Your Message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary btn-full">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Contact

