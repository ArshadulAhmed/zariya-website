import React from 'react'
import './About.scss'

const About = () => {
  return (
    <section id="about" className="about">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">About Zariya</h2>
          <p className="section-subtitle">
            Building a brighter financial future, one loan at a time
          </p>
        </div>
        <div className="about-content">
          <div className="about-image">
            <img 
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80" 
              alt="Team collaboration" 
              loading="lazy"
            />
          </div>
          <div className="about-text">
            <h3>Our Mission</h3>
            <p>
              Zariya – The Thrift and Credit Co-operative Society Limited is dedicated to 
              providing accessible financial services to individuals and small businesses 
              who need support to grow and thrive. We believe in financial inclusion and 
              empowering our members through transparent, fair, and supportive lending practices.
            </p>
            <h3>Our Values</h3>
            <ul className="values-list">
              <li>
                <strong>Trust:</strong> Building lasting relationships based on transparency and integrity
              </li>
              <li>
                <strong>Accessibility:</strong> Making financial services available to everyone
              </li>
              <li>
                <strong>Support:</strong> Providing guidance and assistance throughout your journey
              </li>
              <li>
                <strong>Community:</strong> Fostering a cooperative spirit that benefits all members
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About

