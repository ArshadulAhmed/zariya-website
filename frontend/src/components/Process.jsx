import React from 'react'
import './Process.scss'

const Process = () => {
  const steps = [
    {
      step: '01',
      title: 'Application',
      description: 'Fill out our simple application form with your basic information and loan requirements.'
    },
    {
      step: '02',
      title: 'Review',
      description: 'Our team reviews your application and may request additional documentation if needed.'
    },
    {
      step: '03',
      title: 'Approval',
      description: 'Receive quick approval with clear terms, rates, and repayment schedule.'
    },
    {
      step: '04',
      title: 'Disbursement',
      description: 'Get your funds transferred directly to your account once all requirements are met.'
    }
  ]

  return (
    <section className="process">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            A simple, straightforward process to get the financing you need
          </p>
        </div>
        <div className="process-steps">
          {steps.map((item, index) => (
            <div key={index} className="process-step">
              <div className="step-number">{item.step}</div>
              <h3 className="step-title">{item.title}</h3>
              <p className="step-description">{item.description}</p>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Process

