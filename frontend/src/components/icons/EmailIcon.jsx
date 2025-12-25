import React from 'react'
import EmailIconSvg from '../../assets/icons/EmailIcon.svg'

const EmailIcon = ({ className = '' }) => {
  return <img src={EmailIconSvg} alt="Email" className={className} style={{ display: 'block' }} />
}

export default EmailIcon

