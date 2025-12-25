import React, { useState, useEffect } from 'react'
import './Header.scss'

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.nav') && !event.target.closest('.mobile-menu-toggle')) {
        setIsMobileMenuOpen(false)
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isMobileMenuOpen])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1>Zariya</h1>
            <span className="tagline">Thrift & Credit Co-operative</span>
          </div>
          <nav className={`nav ${isMobileMenuOpen ? 'open' : ''}`}>
            <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home') }}>Home</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about') }}>About</a>
            <a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services') }}>Services</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features') }}>Features</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact') }}>Contact</a>
          </nav>
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

