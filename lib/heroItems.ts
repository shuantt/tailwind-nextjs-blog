import type { HeroDynamicItemKey, HeroListItemContent } from '@/data/heroContent'
import type { RaceProgress } from './raceCountdown'

export interface HeroItemValues {
  postsCount: number
  projectsCount: number
  race: RaceProgress
}

export interface HeroListItem {
  key: string
  name: string
  value: string | number
  unit?: string
  progressPct?: number
}

// Resolve copy and data once, then reuse the same rows in both responsive layouts.
export function resolveHeroItems(
  items: readonly HeroListItemContent[],
  { postsCount, projectsCount, race }: HeroItemValues
): HeroListItem[] {
  const values: Record<HeroDynamicItemKey, Pick<HeroListItem, 'value' | 'progressPct'>> = {
    posts: { value: postsCount },
    projects: { value: projectsCount },
    raceTraining: {
      value: `${race.currentWeek}/${race.totalWeeks}`,
      progressPct: race.progressPct,
    },
  }

  return items
    .filter((item) => !item.hidden)
    .map((item) => {
      const resolved = item.value === undefined ? values[item.key] : item
      const name =
        item.key === 'raceTraining' && item.value === undefined
          ? item.name
              .replaceAll('{currentWeek}', String(race.currentWeek))
              .replaceAll('{totalWeeks}', String(race.totalWeeks))
          : item.name
      const progressPct = resolved.progressPct
      return {
        key: item.key,
        name,
        value: resolved.value,
        unit: item.unit,
        progressPct:
          progressPct === undefined
            ? undefined
            : Number.isFinite(progressPct)
              ? Math.min(100, Math.max(0, progressPct))
              : 0,
      }
    })
}
