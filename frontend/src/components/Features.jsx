import React from 'react'
import './Features.scss'

const Features = () => {
  const features = [
    {
      title: 'Quick Processing',
      description: 'Fast approval and disbursement process to get you the funds you need when you need them.'
    },
    {
      title: 'Flexible Terms',
      description: 'Customizable repayment schedules that fit your financial situation and cash flow.'
    },
    {
      title: 'Competitive Rates',
      description: 'Fair and transparent interest rates with no hidden fees or charges.'
    },
    {
      title: 'Member Support',
      description: 'Dedicated support team to assist you throughout your loan journey.'
    },
    {
      title: 'Transparent Process',
      description: 'Clear terms and conditions with full disclosure of all fees and charges.'
    },
    {
      title: 'Community Focus',
      description: 'A cooperative model that benefits all members and strengthens the community.'
    }
  ]

  return (
    <section id="features" className="features">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Why Choose Zariya</h2>
          <p className="section-subtitle">
            Experience the difference of a member-focused financial institution
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-number">{String(index + 1).padStart(2, '0')}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features

