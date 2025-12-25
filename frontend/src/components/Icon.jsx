import React from 'react'

const Icon = ({ src, className = '', alt = 'icon' }) => {
  const [svgContent, setSvgContent] = React.useState('')
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    setError(false)
    setSvgContent('')
    
    // Fetch the SVG file
    fetch(src)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch SVG')
        return res.text()
      })
      .then(text => {
        // Ensure the SVG has currentColor for fill
        const processedSvg = text.replace(/fill="[^"]*"/g, 'fill="currentColor"')
        setSvgContent(processedSvg)
      })
      .catch(err => {
        console.error('Error loading SVG:', err)
        setError(true)
      })
  }, [src])

  if (error || !svgContent) {
    // Fallback to img tag if SVG content couldn't be loaded
    return <img src={src} alt={alt} className={className} style={{ display: 'block' }} />
  }

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      style={{ display: 'inline-block', lineHeight: 0 }}
    />
  )
}

export default Icon

