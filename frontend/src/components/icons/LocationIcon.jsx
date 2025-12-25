import React from 'react'
import LocationIconSvg from '../../assets/icons/LocationIcon.svg'

const LocationIcon = ({ className = '' }) => {
  return <img src={LocationIconSvg} alt="Location" className={className} style={{ display: 'block' }} />
}

export default LocationIcon

