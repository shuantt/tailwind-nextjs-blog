'use client'

import { useEffect, useState } from 'react'
import { INTRO_CONTENT_DELAY_MS } from '@/lib/introRevealTiming'

interface IntroRevealProps {
  heading: string
  paragraphs: string[]
  /** A substring of `heading` to draw a highlighter-style mark behind (e.g. a name). */
  highlight?: string
}

// "Matrix shuffle" reveal: each character starts as random noise and settles
// into its real glyph, staggered left to right. Characters run on a shared
// frame counter — character i starts scrambling at frame i * CHAR_START_STEP
// and settles SCRAMBLE_FRAMES frames later.
const SYMBOLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
const FRAME_MS = 24
const CHAR_START_STEP = 1
const SCRAMBLE_FRAMES = 8
// After the text fully settles, pause this long on the real heading before
// scrambling back in and replaying — keeps the effect from being a one-shot
// that only ever plays once per page load.
const REPEAT_PAUSE_MS = 6000

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
}

// Latin letters/digits get grouped into "word" runs (wrapped with white-space:
// nowrap) so the line never breaks in the middle of an English word. CJK
// characters and punctuation are left ungrouped, since it's normal (and
// sometimes necessary) for a line to break between them.
const WORD_CHAR = /[A-Za-z0-9'’-]/

type CharEntry = { char: string; index: number }
type Segment = { type: 'word'; items: CharEntry[] } | { type: 'single'; item: CharEntry }

function groupIntoSegments(chars: string[]): Segment[] {
  const segments: Segment[] = []

  chars.forEach((char, index) => {
    if (WORD_CHAR.test(char)) {
      const last = segments[segments.length - 1]
      if (last && last.type === 'word') {
        last.items.push({ char, index })
        return
      }
      segments.push({ type: 'word', items: [{ char, index }] })
    } else {
      segments.push({ type: 'single', item: { char, index } })
    }
  })

  return segments
}

export default function IntroReveal({ heading, paragraphs, highlight }: IntroRevealProps) {
  const chars = Array.from(heading)
  const segments = groupIntoSegments(chars)
  const [display, setDisplay] = useState<string[]>(() => chars.map(() => ''))

  const highlightRange = (() => {
    if (!highlight) return null
    const start = heading.indexOf(highlight)
    if (start === -1) return null
    return { start, end: start + Array.from(highlight).length }
  })()

  function isHighlighted(index: number) {
    return !!highlightRange && index >= highlightRange.start && index < highlightRange.end
  }

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplay(chars)
      return
    }

    let cancelled = false
    let frame = 0
    let rafId: number | undefined
    let timer: number | undefined

    function tick() {
      if (cancelled) return

      let allDone = true
      const next = chars.map((char, i) => {
        if (char === ' ' || char === '\n') return char
        const startFrame = i * CHAR_START_STEP
        const endFrame = startFrame + SCRAMBLE_FRAMES
        if (frame < startFrame) {
          allDone = false
          return ''
        }
        if (frame < endFrame) {
          allDone = false
          return randomSymbol()
        }
        return char
      })
      setDisplay(next)
      frame += 1

      if (!allDone) {
        timer = window.setTimeout(() => {
          rafId = window.requestAnimationFrame(tick)
        }, FRAME_MS)
      } else {
        // Settled on the real text — pause here, then reset and scramble
        // back in for another pass, looping for as long as this is mounted.
        timer = window.setTimeout(() => {
          frame = 0
          rafId = window.requestAnimationFrame(tick)
        }, REPEAT_PAUSE_MS)
      }
    }

    tick()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heading])

  function renderChar({ char, index }: CharEntry, highlighted = false) {
    // A literal newline in `heading` forces a hard line break (e.g. splitting a
    // greeting onto two fixed lines) instead of being scrambled like a glyph.
    if (char === '\n') return <br key={index} />
    return (
      <span
        key={index}
        className={`intro-reveal-char${highlighted ? ' intro-reveal-highlight' : ''}`}
      >
        {char === ' ' ? ' ' : display[index]}
      </span>
    )
  }

  return (
    <div className="intro-reveal relative overflow-hidden">
      <div className="intro-reveal-content">
        <h1 className="font-sans text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-xl xl:text-2xl">
          {/* Full heading for screen readers / SEO, available immediately */}
          <span className="sr-only">{heading}</span>
          <span aria-hidden="true">
            {segments.map((segment) => {
              if (segment.type === 'word') {
                const wordHighlighted = segment.items.every((item) => isHighlighted(item.index))
                return (
                  <span
                    key={segment.items[0].index}
                    className={`intro-reveal-word${wordHighlighted ? ' intro-reveal-highlight' : ''}`}
                  >
                    {segment.items.map((item) =>
                      renderChar(item, wordHighlighted ? false : isHighlighted(item.index))
                    )}
                  </span>
                )
              }
              return renderChar(segment.item, isHighlighted(segment.item.index))
            })}
          </span>
        </h1>
        {paragraphs.map((paragraph, index) => (
          <p
            key={paragraph}
            className={`intro-reveal-support ${index === 0 ? 'mt-5' : 'mt-3'} text-base leading-8 text-gray-600 dark:text-gray-300`}
            style={{ animationDelay: `${INTRO_CONTENT_DELAY_MS}ms` }}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}
