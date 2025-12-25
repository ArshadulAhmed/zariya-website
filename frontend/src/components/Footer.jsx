import React from 'react'
import './Footer.scss'

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Zariya</h3>
            <p className="footer-tagline">The Thrift and Credit Co-operative Society Limited</p>
            <p className="footer-description">
              Empowering individuals and small businesses through accessible financial solutions.
            </p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#home" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Home</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}>About</a></li>
              <li><a href="#services" onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) }}>Services</a></li>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}>Contact</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Services</h4>
            <ul className="footer-links">
              <li>Personal Loans</li>
              <li>Business Loans</li>
              <li>Credit Facilities</li>
              <li>Financial Advisory</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact Info</h4>
            <ul className="footer-contact">
              <li>📍 123 Financial District, Your City</li>
              <li>📞 +1 (555) 123-4567</li>
              <li>✉️ info@zariya.coop</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Zariya - The Thrift and Credit Co-operative Society Limited. All rights reserved.</p>
          <button className="scroll-to-top" onClick={scrollToTop} aria-label="Scroll to top">
            ↑
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Footer

