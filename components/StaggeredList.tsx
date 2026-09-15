'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

interface StaggeredListProps {
  children: ReactNode
  className?: string
  /**
   * Delay before the list reveals, in ms. Defaults to the hero intro's total
   * runtime (intro-reveal 1200ms + intro-reveal-support's 420ms animation
   * starting at the 1200ms mark) so the "latest posts" list slides in right
   * after the hero finishes, instead of popping in immediately if it's
   * already inside the initial viewport.
   */
  delayMs?: number
}

const HERO_SEQUENCE_MS = 1620

export default function StaggeredList({
  children,
  className,
  delayMs = HERO_SEQUENCE_MS,
}: StaggeredListProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    if (!listRef.current) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsRevealed(true)
      return
    }

    const timer = window.setTimeout(() => setIsRevealed(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  return (
    <ul ref={listRef} className={className} data-revealed={isRevealed}>
      {children}
    </ul>
  )
}
