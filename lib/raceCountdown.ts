// Fixed-length training countdown toward Shuan's Taipei Marathon half-marathon,
// shown as the single QUEST row in the homepage hero stat card. The training
// block is always 16 weeks long, counting backward from race day — so the
// current week number is derived purely from today's date vs. race day, with
// no separately-tracked "start date" to keep in sync. Computed once on the
// server (Main.tsx is a Server Component) and passed down as plain numbers,
// so the client never re-derives "today" itself — that would risk a hydration
// mismatch against whatever day the page was last statically built on.
const RACE_DAY = new Date(2026, 11, 20) // December 20, 2026 — Taipei Marathon, half, goal sub-2:30
const TOTAL_WEEKS = 16

const MS_PER_DAY = 24 * 60 * 60 * 1000
const TRAINING_START = new Date(RACE_DAY.getTime() - TOTAL_WEEKS * 7 * MS_PER_DAY)

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export interface RaceProgress {
  /** Which training week "today" falls in, 1-indexed; 0 before training
   *  starts, clamped to `totalWeeks` once race day has passed. */
  currentWeek: number
  /** Fixed length of the training block (16 weeks). */
  totalWeeks: number
  /** currentWeek / totalWeeks as a 0-100 percentage, for the progress bar. */
  progressPct: number
}

export function getRaceProgress(today: Date = new Date()): RaceProgress {
  const day = startOfDay(today)
  const start = startOfDay(TRAINING_START)

  const elapsedDays = Math.floor((day.getTime() - start.getTime()) / MS_PER_DAY)
  const currentWeek = Math.min(TOTAL_WEEKS, Math.max(0, Math.floor(elapsedDays / 7) + 1))
  const progressPct = Math.round((currentWeek / TOTAL_WEEKS) * 100)

  return { currentWeek, totalWeeks: TOTAL_WEEKS, progressPct }
}
