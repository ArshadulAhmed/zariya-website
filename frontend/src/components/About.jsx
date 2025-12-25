import React from 'react'
import Icon from './Icon'
import TrustIcon from '../assets/icons/TrustIcon.svg'
import AccessibilityIcon from '../assets/icons/AccessibilityIcon.svg'
import SupportIcon from '../assets/icons/SupportIcon.svg'
import CommunityIcon from '../assets/icons/CommunityIcon.svg'
import './About.scss'

const values = [
  {
    title: 'Trust',
    description: 'Building lasting relationships based on transparency and integrity',
    icon: TrustIcon
  },
  {
    title: 'Accessibility',
    description: 'Making financial services available to everyone, everywhere',
    icon: AccessibilityIcon
  },
  {
    title: 'Support',
    description: 'Providing guidance and assistance throughout your financial journey',
    icon: SupportIcon
  },
  {
    title: 'Community',
    description: 'Fostering a cooperative spirit that benefits all members',
    icon: CommunityIcon
  }
]

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
          <div className="about-description">
            <p className="about-intro">
              Zariya – The Thrift and Credit Co-operative Society Limited is a forward-thinking 
              financial institution dedicated to transforming lives through accessible microfinance 
              solutions.
            </p>
            <p>
              We provide accessible, transparent, and supportive financial services to individuals 
              and small businesses. As a cooperative society owned and governed by our members, 
              we prioritize your financial well-being through fair, transparent, and supportive 
              lending practices.
            </p>
          </div>

          <div className="about-values">
            <h3 className="values-title">Our Core Values</h3>
            <div className="values-grid">
              {values.map((value, index) => (
                <div key={index} className="value-card">
                  <Icon src={value.icon} className="value-icon" alt={value.title} />
                  <h4 className="value-title">{value.title}</h4>
                  <p className="value-description">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About

