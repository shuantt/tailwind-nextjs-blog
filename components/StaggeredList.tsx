'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

interface StaggeredListProps {
  children: ReactNode
  className?: string
}

export default function StaggeredList({ children, className }: StaggeredListProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return

        setIsRevealed(true)
        observer.disconnect()
      },
      { rootMargin: '0px 0px -48px', threshold: 0.1 }
    )

    observer.observe(list)
    return () => observer.disconnect()
  }, [])

  return (
    <ul ref={listRef} className={className} data-revealed={isRevealed}>
      {children}
    </ul>
  )
}
