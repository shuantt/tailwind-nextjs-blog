'use client'

import { useEffect, useMemo, useState } from 'react'

interface TypingIntroProps {
  heading: string
  paragraphs: string[]
}

export default function TypingIntro({ heading, paragraphs }: TypingIntroProps) {
  const blocks = useMemo(() => [heading, ...paragraphs], [heading, paragraphs])
  const totalLength = blocks.reduce((total, block) => total + block.length, 0)
  const [visibleCharacters, setVisibleCharacters] = useState(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (reducedMotion.matches) {
      setVisibleCharacters(totalLength)
      return
    }

    let currentCharacter = 0
    let timeoutId: ReturnType<typeof setTimeout>

    const typeNextCharacter = () => {
      currentCharacter += 1
      setVisibleCharacters(currentCharacter)

      if (currentCharacter >= totalLength) return

      let traversed = 0
      let currentText = blocks[0]

      for (let index = 0; index < blocks.length; index += 1) {
        if (currentCharacter <= traversed + blocks[index].length) {
          currentText = blocks[index]
          break
        }
        traversed += blocks[index].length
      }

      const completedBlock = currentCharacter === traversed + currentText.length
      const nextDelay = completedBlock ? 320 : 70

      timeoutId = setTimeout(typeNextCharacter, nextDelay)
    }

    timeoutId = setTimeout(typeNextCharacter, 180)

    return () => clearTimeout(timeoutId)
  }, [blocks, totalLength])

  let remainingCharacters = visibleCharacters
  const visibleBlocks = blocks.map((block) => {
    const visibleLength = Math.min(remainingCharacters, block.length)
    remainingCharacters -= visibleLength
    return block.slice(0, visibleLength)
  })
  const activeBlock = blocks.findIndex(
    (_, index) => visibleCharacters <= blocks.slice(0, index + 1).join('').length
  )
  const isTyping = visibleCharacters < totalLength

  const cursor = (
    <span
      className="ml-0.5 inline-block h-[1em] w-px translate-y-[0.12em] bg-current align-baseline motion-safe:animate-pulse"
      aria-hidden="true"
    />
  )

  return (
    <div className="relative">
      <div aria-hidden="true" className="invisible">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-4xl">
          {heading}
        </h1>
        {paragraphs.map((paragraph, index) => (
          <p
            key={paragraph}
            className={`${index === 0 ? 'mt-5' : 'mt-3'} text-base leading-8 text-gray-600 dark:text-gray-300`}
          >
            {paragraph}
          </p>
        ))}
      </div>

      <div aria-hidden="true" className="absolute inset-0">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-4xl">
          {visibleBlocks[0]}
          {isTyping && activeBlock === 0 && cursor}
        </h1>
        {visibleBlocks.slice(1).map((paragraph, index) => (
          <p
            key={paragraphs[index]}
            className={`${index === 0 ? 'mt-5' : 'mt-3'} text-base leading-8 text-gray-600 dark:text-gray-300`}
          >
            {paragraph}
            {isTyping && activeBlock === index + 1 && cursor}
          </p>
        ))}
      </div>

      <div className="sr-only">
        <h1>{heading}</h1>
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  )
}
