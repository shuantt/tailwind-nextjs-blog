const taipeiClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export interface HeroStats {
  coffee: { value: number; pct: number }
  sleep: { value: number; pct: number; overcharged: boolean }
  work: { years: number; completedYears: number; level: number; pct: number }
}

// A date-seeded draw keeps the site's daily sleep value stable across reloads and visitors.
function dailyDraw(dateKey: string, min: number, max: number) {
  let hash = 2166136261
  for (const character of `sleep:${dateKey}`) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  }
  return min + ((hash >>> 0) % (max - min + 1))
}

export function getHeroStats(now: Date = new Date()): HeroStats {
  const parts = Object.fromEntries(
    taipeiClock.formatToParts(now).map(({ type, value }) => [type, value])
  )
  const year = Number(parts.year)
  const month = Number(parts.month)
  const day = Number(parts.day)
  const calendarDay = Date.UTC(year, month - 1, day)
  const minutes = Number(parts.hour) * 60 + Number(parts.minute)
  // The next refill is at 09:00; the bar stays empty overnight.
  const coffee =
    minutes < 9 * 60 ? 0 : Math.max(0, Math.ceil(((18 * 60 - minutes) / (9 * 60)) * 100))
  const weekday = new Date(calendarDay).getUTCDay()
  const weekend = weekday === 0 || weekday === 6
  const sleep = dailyDraw(
    `${parts.year}-${parts.month}-${parts.day}`,
    weekend ? 80 : 50,
    weekend ? 140 : 75
  )

  const firstDay = Date.UTC(2022, 11, 5)
  const completedYears = Math.max(0, year - 2022 - (calendarDay < Date.UTC(year, 11, 5) ? 1 : 0))
  const anniversary = Date.UTC(2022 + completedYears, 11, 5)
  const nextAnniversary = Date.UTC(2023 + completedYears, 11, 5)
  // Use actual anniversary lengths, including leap years; the first day starts at level 1.
  const fraction =
    calendarDay < firstDay ? 0 : (calendarDay - anniversary) / (nextAnniversary - anniversary)

  return {
    coffee: { value: coffee, pct: coffee },
    sleep: { value: sleep, pct: Math.min(100, sleep), overcharged: sleep > 100 },
    work: {
      years: completedYears + fraction,
      completedYears,
      level: completedYears + 1,
      pct: Math.round(fraction * 1000) / 10,
    },
  }
}
