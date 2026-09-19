// All copy shown in the homepage hero "character status" card lives here so
// it can be edited without touching component code. Visual/layout choices
// (Tailwind classes, colors, spacing, corner radii, etc.) stay in
// components/HeroStatCard.tsx and components/IntroReveal.tsx — this file is
// text and the character level. Live stat values are calculated in lib/heroStats.ts.

export interface TitleChipContent {
  /** Short badge text (e.g. "半馬菜鳥"). */
  label: string
  /** Tooltip shown on hover. */
  hint: string
}

export interface StatBarContent {
  /** Identifies which bar this is — also used to look up its bar color in
   *  HeroStatCard.tsx (STAT_BAR_COLORS), so keep this in sync if you rename
   *  or reorder bars there. */
  key: 'coffee' | 'sleep' | 'exp'
  /** Text shown inside the bar itself (e.g. "COFFEE"). */
  label: string
}

export type HeroDynamicItemKey = 'posts' | 'projects' | 'raceTraining'

export type HeroListItemContent = {
  /** Unique within its list; stays the same when the display name changes. */
  key: string
  /** Race training names may include {currentWeek} and {totalWeeks}. */
  name: string
  unit?: string
  hidden?: boolean
} & (
  | { key: HeroDynamicItemKey; value?: never; progressPct?: never }
  | { value: string | number; progressPct?: number }
)

export interface HeroContent {
  /** Speech-bubble heading. A literal "\n" forces a hard line break (see
   *  IntroReveal.tsx) instead of being scrambled like a normal character. */
  heading: string
  /** Substring of `heading` to draw a highlighter mark behind (e.g. a name). */
  highlight: string
  /** Bio paragraph shown in the BIO tab / section. */
  bio: string
  jobTitle: string
  /** Level badge overlaid on the avatar's corner (e.g. "Lv.4"). */
  avatarLevel: string
  /** Small tag on the outer card's top-left edge (e.g. "Status"). */
  cornerTag: string
  /** Mobile tab button labels. */
  tabs: {
    bio: string
    stats: string
    quests: string
  }
  /** Desktop section headings. */
  sectionLabels: {
    bio: string
    stats: string
    quest: string
  }
  /** Title/badge chips under the name (半馬菜鳥 / 三分鐘熱度 / 白日夢冒險王). */
  titles: TitleChipContent[]
  /** HP/MP/EXP-style stat bars, in display order. */
  stats: StatBarContent[]
  /** Both lists follow array order. Omit value for a built-in dynamic key;
   *  provide value for a custom item, and hidden: true to temporarily hide it.
   *  Custom progressPct values are percentages (0–100). */
  statusItems: HeroListItemContent[]
  quests: HeroListItemContent[]
}

const heroContent: HeroContent = {
  heading: "Hi! I'm Shuan, a developer and designer. Nice to meet you.",
  highlight: 'Shuan',
  bio: '從設計人到開發者，在 AI 的幫助下成長，也在 AI 的協作中徬徨，還在摸索自己真正想做、想留下的是什麼。寫寫開發、學習、創作和生活紀錄，被取代的那天可能會來得比想像中快，在那之前我想再多做點白日夢。',
  jobTitle: 'Full-Stack Developer',
  avatarLevel: 'Lv.31',
  cornerTag: 'Status',
  tabs: {
    bio: 'BIO',
    stats: 'STATS',
    quests: 'QUESTS',
  },
  sectionLabels: {
    bio: 'Bio',
    stats: 'Stats',
    quest: 'Quest',
  },
  titles: [
    { label: '跑步新手', hint: '正在為半馬備賽的新手跑者' },
    { label: '三分鐘熱度', hint: 'side project 啟動快、完成看心情' },
    { label: '白日夢', hint: '還在摸索真正想做的事' },
  ],
  stats: [
    { key: 'coffee', label: 'COFFEE' },
    { key: 'sleep', label: 'SLEEP' },
    { key: 'exp', label: 'EXP.' },
  ],
  statusItems: [
    { key: 'posts', name: '貼文數', unit: '篇' },
    { key: 'projects', name: '專案數', unit: '個' },
    { key: 'runningLevel', name: '跑步等級', value: 'Lv.1' },
  ],
  quests: [{ key: 'raceTraining', name: '台北馬{totalWeeks}週訓練' }],
}

export default heroContent
