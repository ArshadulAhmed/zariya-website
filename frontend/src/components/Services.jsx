import React from 'react'
import Icon from './Icon'
import PersonalLoansIcon from '../assets/icons/PersonalLoansIcon.svg'
import BusinessLoansIcon from '../assets/icons/BusinessLoansIcon.svg'
import CreditFacilitiesIcon from '../assets/icons/CreditFacilitiesIcon.svg'
import FinancialAdvisoryIcon from '../assets/icons/FinancialAdvisoryIcon.svg'
import './Services.scss'

const Services = () => {
  const services = [
    {
      title: 'Personal Loans',
      description: 'Flexible personal loans designed to meet your individual needs, whether for education, medical expenses, or personal development.',
      icon: PersonalLoansIcon
    },
    {
      title: 'Business Loans',
      description: 'Tailored financing solutions for small businesses and entrepreneurs looking to expand, invest, or manage cash flow.',
      icon: BusinessLoansIcon
    },
    {
      title: 'Credit Facilities',
      description: 'Accessible credit options with competitive rates and flexible repayment terms to support your financial goals.',
      icon: CreditFacilitiesIcon
    },
    {
      title: 'Financial Advisory',
      description: 'Expert guidance and support to help you make informed financial decisions and plan for the future.',
      icon: FinancialAdvisoryIcon
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
              <Icon src={service.icon} className="service-icon" alt={service.title} />
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

