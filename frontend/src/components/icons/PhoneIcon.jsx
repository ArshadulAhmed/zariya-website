import React from 'react'
import PhoneIconSvg from '../../assets/icons/PhoneIcon.svg'

const PhoneIcon = ({ className = '' }) => {
  return <img src={PhoneIconSvg} alt="Phone" className={className} style={{ display: 'block' }} />
}

export default PhoneIcon

