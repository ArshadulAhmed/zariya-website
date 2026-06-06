import { useState } from 'react'
import SectionPopulateDrawer from './SectionPopulateDrawer'
import './SectionPopulateDrawer.scss'

const SectionPopulateControl = ({ section, allowPreviousLoans = true, className = '' }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={`section-populate-trigger ${className}`.trim()}
        onClick={() => setOpen(true)}
      >
        Populate Details
      </button>
      <SectionPopulateDrawer
        open={open}
        onClose={() => setOpen(false)}
        section={section}
        allowPreviousLoans={allowPreviousLoans}
      />
    </>
  )
}

export default SectionPopulateControl
