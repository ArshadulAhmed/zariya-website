import React from 'react'
import logoImage from '../assets/logo.png'
import './Logo.scss'

const Logo = ({ className = '' }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={`logo-container ${className}`} onClick={scrollToTop} style={{ cursor: 'pointer' }}>
      <div className="logo-image-wrapper">
        <img src={logoImage} alt="Zariya Logo" className="logo-image" />
      </div>
      <div className="logo-text">
        <h1 className="logo-name">ZARIYA</h1>
        <span className="logo-tagline">The Thrift And Credit Co-Operative Society Limited</span>
      </div>
    </div>
  )
}

export default Logo

