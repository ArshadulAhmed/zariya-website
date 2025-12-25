import React from 'react'
import './Services.scss'

const Services = () => {
  const services = [
    {
      icon: '💰',
      title: 'Personal Loans',
      description: 'Flexible personal loans designed to meet your individual needs, whether for education, medical expenses, or personal development.'
    },
    {
      icon: '🏢',
      title: 'Business Loans',
      description: 'Tailored financing solutions for small businesses and entrepreneurs looking to expand, invest, or manage cash flow.'
    },
    {
      icon: '💳',
      title: 'Credit Facilities',
      description: 'Accessible credit options with competitive rates and flexible repayment terms to support your financial goals.'
    },
    {
      icon: '🤝',
      title: 'Financial Advisory',
      description: 'Expert guidance and support to help you make informed financial decisions and plan for the future.'
    }
  ]

  return (
    <section id="services" className="services">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">
            Comprehensive financial solutions tailored to your needs
          </p>
        </div>
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services

