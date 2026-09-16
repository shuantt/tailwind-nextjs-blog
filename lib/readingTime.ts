// Estimates reading time for zh-TW content. The `reading-time` npm package (used
// previously) assumes English prose: it applies an English words-per-minute rate to a
// naive whitespace word count, which under-splits CJK text (no spaces between characters)
// into far too few "words" and produces a badly inflated time. This instead counts CJK
// characters and Latin words separately and applies a reading speed appropriate to each.
//
// Speeds are approximate, chosen for a casual personal-blog reading pace rather than
// technical/study reading:
// - CJK: ~400 characters/minute (commonly cited range for adult silent reading is
//   roughly 300-500 cpm; 400 sits in the middle for mixed narrative/technical posts).
// - Latin: ~200 words/minute, the conventional English reading-speed baseline also used
//   by the `reading-time` package's own default.
const CJK_CHARS_PER_MINUTE = 400
const LATIN_WORDS_PER_MINUTE = 200

// CJK Unified Ideographs + Extension A + Compatibility Ideographs. Covers the Han
// characters used in Traditional Chinese; punctuation and kana are intentionally excluded
// since they read faster than ideographs and aren't rendered as ideograph glyphs.
const CJK_CHAR_REGEX = /[㐀-䶿一-鿿豈-﫿]/g

export interface ReadingTimeResult {
  /** Pre-formatted display string, e.g. "6 min read" — English to match the site's other
   *  UI labels (Read more, Tags, Related Posts), which stay English by design while
   *  article content and metadata stay zh-TW. */
  text: string
  /** Estimated minutes, not rounded (e.g. 5.8). */
  minutes: number
  /** Estimated milliseconds, for parity with the `reading-time` package's shape. */
  time: number
  /** CJK character count plus Latin word count — a rough content-length proxy. */
  words: number
}

export function estimateReadingTime(raw: string): ReadingTimeResult {
  // Strip markup that reads much faster than prose (or isn't read at all) so it doesn't
  // inflate the estimate: fenced/inline code, image syntax, and link URLs (keeping the
  // visible link text, which is prose).
  const stripped = raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')

  const cjkCount = (stripped.match(CJK_CHAR_REGEX) ?? []).length
  const latinWords = stripped.replace(CJK_CHAR_REGEX, ' ').split(/\s+/).filter(Boolean).length

  const minutes = cjkCount / CJK_CHARS_PER_MINUTE + latinWords / LATIN_WORDS_PER_MINUTE
  const displayMinutes = Math.max(1, Math.round(minutes))

  return {
    text: `${displayMinutes} min read`,
    minutes,
    time: minutes * 60 * 1000,
    words: cjkCount + latinWords,
  }
}
