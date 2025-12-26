import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from './Logo'
import './Header.scss'

const sections = ['home', 'about', 'services', 'features', 'process', 'contact']

const Header = () => {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const headerRef = useRef(null)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const updateHeader = (isInitial = false) => {
      const currentScrollY = window.scrollY
      const header = headerRef.current
      
      if (!header) return
      
      // Determine scroll direction
      const scrollingDown = currentScrollY > lastScrollY.current
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current)
      
      // On initial load, always update everything
      // Otherwise, only update section detection if scroll difference is significant (prevents micro-movements)
      const shouldUpdateSections = isInitial || scrollDifference >= 5
      
      // Always update visibility, even for small movements (ensures header shows on scroll up)
      const shouldUpdateVisibility = isInitial || scrollDifference >= 2 || scrollingDown !== (lastScrollY.current < currentScrollY)
      
      // Detect which section is currently at the top (only if significant scroll)
      let currentSection = 'home'
      if (shouldUpdateSections) {
        const headerHeight = 80 // Approximate header height
        
        for (let i = sections.length - 1; i >= 0; i--) {
          const section = document.getElementById(sections[i])
          if (section) {
            const sectionTop = section.offsetTop
            const sectionHeight = section.offsetHeight
            
            // Check if we're in this section (with some offset for header)
            if (currentScrollY + headerHeight >= sectionTop && currentScrollY < sectionTop + sectionHeight) {
              currentSection = sections[i]
              break
            }
          }
        }
        
        // Remove all section classes
        header.classList.remove('over-hero', 'over-white', 'over-grey', 'over-dark')
        
        // Add appropriate class based on current section
        if (currentSection === 'home') {
          header.classList.add('over-hero')
          header.classList.remove('scrolled')
        } else {
          header.classList.add('scrolled')
          
          // Determine background based on section
          if (currentSection === 'services' || currentSection === 'process') {
            header.classList.add('over-grey')
          } else if (currentSection === 'contact' || currentSection === 'about' || currentSection === 'features') {
            header.classList.add('over-white')
          } else {
            header.classList.add('over-white')
          }
        }
      }
      
      // Always update visibility to ensure header shows on scroll up
      if (shouldUpdateVisibility) {
        if (currentScrollY < 10) {
          // Always show at very top (first 10px)
          header.classList.remove('hidden')
          header.classList.add('visible')
        } else if (scrollingDown) {
          // Hide immediately when scrolling down
          header.classList.remove('visible')
          header.classList.add('hidden')
        } else {
          // Show when scrolling up (including when scrollY decreases)
          header.classList.remove('hidden')
          header.classList.add('visible')
        }
      }
      
      lastScrollY.current = currentScrollY
      ticking.current = false
    }

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => updateHeader(false))
        ticking.current = true
      }
    }
    
    // Initialize header on mount
    updateHeader(true)
    
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
    <header ref={headerRef} className="header visible over-hero">
      <div className="container">
        <div className="header-content">
          <Logo />
          <nav className={`nav ${isMobileMenuOpen ? 'open' : ''}`}>
            <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home') }}>Home</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about') }}>About</a>
            <a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection('services') }}>Services</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features') }}>Features</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact') }}>Contact</a>
            <button className="btn-login" onClick={() => navigate('/login')}>
              Login
            </button>
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

