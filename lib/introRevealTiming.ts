// Shared timing for the homepage hero. Kept in a plain module (no
// 'use client') so Server Components can import these directly — a value
// exported from a 'use client' file can only be rendered as a component, not
// read/called, from server code.

// Everything else on the homepage (paragraph copy, the avatar card, the
// "latest posts" list) fades in on its own short fixed delay — it must NOT
// scale with how long the heading text is. The heading is a decorative
// flourish; the rest of the page's content should show up quickly regardless
// of whether the heading says "Hi" or a full sentence.
export const INTRO_CONTENT_DELAY_MS = 200
export const INTRO_LIST_DELAY_MS = 400
