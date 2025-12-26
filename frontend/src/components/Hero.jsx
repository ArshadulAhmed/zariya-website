import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Hero.scss'

const Hero = () => {
  const navigate = useNavigate()

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
            Accessible microfinance solutions for individuals and small businesses
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/apply-membership')}>
              Become a Member
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

