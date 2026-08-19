import { useLayoutEffect, useRef } from 'react'

/**
 * Pins a filter bar and offsets sticky table headers to sit just under it.
 * Add `sticky-filter-page` on the page root and `sticky-filter-bar` on the filter.
 */
const useStickyFilterBar = () => {
  const pageRef = useRef(null)
  const filterRef = useRef(null)

  useLayoutEffect(() => {
    const page = pageRef.current
    const filter = filterRef.current
    if (!page || !filter) return

    const sync = () => {
      page.style.setProperty('--sticky-filter-height', `${filter.offsetHeight}px`)
      page.classList.toggle('is-header-stuck', filter.getBoundingClientRect().top <= 1)
    }

    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(filter)
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync)
    }
  }, [])

  return { pageRef, filterRef }
}

export default useStickyFilterBar
