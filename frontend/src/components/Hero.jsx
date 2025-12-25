import React from 'react'
import './Hero.scss'

const Hero = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">
            Empowering Dreams Through
            <span className="highlight"> Financial Inclusion</span>
          </h1>
          <p className="hero-subtitle">
            Zariya provides accessible microfinance solutions to individuals and small businesses, 
            helping you achieve your financial goals with trust, transparency, and support.
          </p>
          <div className="hero-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => scrollToSection('contact')}
            >
              Get Started
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => scrollToSection('about')}
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
      <div className="hero-scroll-indicator">
        <span>Scroll to explore</span>
        <div className="scroll-arrow"></div>
      </div>
    </section>
  )
}

export default Hero

