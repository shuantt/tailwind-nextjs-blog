'use client'

import { useState, type ReactNode } from 'react'
import Image from '@/components/Image'
import IntroReveal from '@/components/IntroReveal'
import siteMetadata from '@/data/siteMetadata'
import heroContent, { type TitleChipContent } from '@/data/heroContent'
import { INTRO_CONTENT_DELAY_MS } from '@/lib/introRevealTiming'

const NAME = siteMetadata.author.toUpperCase()
const AVATAR_SRC = '/static/images/avatar-animated-v4.gif'

type TitleDef = TitleChipContent

const TITLES: TitleDef[] = heroContent.titles

interface StatDef {
  key: string
  label: string
  pct: number
  display: string
  barClassName: string
  iconClassName: string
  Icon: (props: { className?: string }) => JSX.Element
}

// Bar color + icon per stat — the only pieces of the HP/MP/EXP bars that are
// a design choice rather than copy, so they stay here instead of in
// data/heroContent.ts. Picked by what each stat means rather than the
// classic HP/MP/EXP red/blue/green, and pulled to a similar muted depth so
// the three bars read as one coordinated set against the dark background
// instead of clashing: COFFEE＝焦糖棕＋咖啡杯、SLEEP＝夜藍灰＋月亮、
// WORK EXP＝沉穩綠＋公事包.
// Each color is tuned per theme rather than reused as-is: a tone chosen
// against the dark card (e.g. slate-500 for SLEEP, which reads as a quiet
// moonlight gray-blue there) goes flat and "dirty gray" on a white light-mode
// background, since the same value looks more saturated against a dark
// backdrop than a light one (simultaneous contrast). Light mode gets a
// slightly richer/warmer variant of the same idea instead of the identical
// value.
const STAT_VISUALS: Record<
  string,
  { barClassName: string; iconClassName: string; Icon: StatDef['Icon'] }
> = {
  coffee: {
    barClassName: 'bg-amber-600 dark:bg-amber-700',
    iconClassName: 'text-amber-600 dark:text-amber-400',
    Icon: CoffeeIcon,
  },
  sleep: {
    barClassName: 'bg-indigo-600 dark:bg-slate-500',
    iconClassName: 'text-indigo-600 dark:text-slate-300',
    Icon: MoonIcon,
  },
  exp: {
    barClassName: 'bg-emerald-600 dark:bg-emerald-700',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
    Icon: BriefcaseIcon,
  },
}

const STATS: StatDef[] = heroContent.stats.map((stat) => ({
  ...stat,
  ...STAT_VISUALS[stat.key],
}))

// The bars sit inside the card that itself fades/slides in via
// `.intro-reveal-support` (INTRO_CONTENT_DELAY_MS delay + 420ms animation).
// Starting the fill animation once that settles, rather than at the same
// time, avoids the bar growing while its own container is still moving.
const STAT_BAR_BASE_DELAY_MS = INTRO_CONTENT_DELAY_MS + 420
const STAT_BAR_STAGGER_MS = 120

interface HeroStatCardProps {
  heading: string
  highlight?: string
  bio: string
  postsCount: number
  projectsCount: number
  raceCurrentWeek: number
  raceTotalWeeks: number
  raceProgressPct: number
}

export default function HeroStatCard({
  heading,
  highlight,
  bio,
  postsCount,
  projectsCount,
  raceCurrentWeek,
  raceTotalWeeks,
  raceProgressPct,
}: HeroStatCardProps) {
  const [tab, setTab] = useState<'bio' | 'status' | 'quests'>('bio')

  return (
    <div
      className="intro-reveal-support relative rounded-lg border border-primary-500 p-5 shadow-[0_0_0_1px_rgba(255,90,31,0.12)] sm:p-7"
      style={{ animationDelay: `${INTRO_CONTENT_DELAY_MS}ms` }}
    >
      {/* Game-HUD-style corner tag identifying the whole card as the
          character "status" panel — sits half on/half off the top edge,
          like a folder tab. Light mode: background matches the page so it
          reads as cutting into the border. Dark mode: filled solid instead,
          per explicit request, since the page-matching outline read as too
          faint there. */}
      <span className="absolute -top-3 left-5 rounded-md border border-primary-500 bg-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-primary-500 dark:bg-primary-700 dark:text-white">
        {heroContent.cornerTag}
      </span>

      {/* ============ Mobile: bubble on top, avatar+stats card below, BIO/STATUS/QUESTS tabs ============ */}
      <div className="sm:hidden">
        <Bubble heading={heading} highlight={highlight} tail="down" />

        <div className="mt-4 flex items-start gap-3.5">
          <Avatar
            imageSizes="128px"
            levelBadgeClassName="bottom-1.5 left-1.5 px-[7px] pb-px text-[9px]"
            className="h-32 w-32 rounded-[20px] border-2"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="text-lg font-extrabold leading-tight text-gray-900 dark:text-gray-100">
              {NAME}
            </p>
            <p className="-mt-1 mb-0.5 flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-wider text-primary-500">
              <LaptopIcon className="h-3 w-3 shrink-0" />
              {heroContent.jobTitle}
            </p>
            <div className="mt-1 flex flex-col gap-1.5">
              {STATS.map(({ key, ...stat }, index) => (
                <StatBar
                  key={key}
                  {...stat}
                  delayMs={STAT_BAR_BASE_DELAY_MS + index * STAT_BAR_STAGGER_MS}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-[5px]">
          {TITLES.map((title) => (
            <TitleChip key={title.label} {...title} compact />
          ))}
        </div>

        <div className="mt-5 flex justify-center gap-8 border-b border-gray-200 dark:border-gray-700">
          <TabButton active={tab === 'bio'} onClick={() => setTab('bio')}>
            {heroContent.tabs.bio}
          </TabButton>
          <TabButton active={tab === 'status'} onClick={() => setTab('status')}>
            {heroContent.tabs.stats}
          </TabButton>
          <TabButton active={tab === 'quests'} onClick={() => setTab('quests')}>
            {heroContent.tabs.quests}
          </TabButton>
        </div>
        <div className="pt-4">
          {tab === 'bio' && (
            <p className="text-xs leading-7 text-gray-800 dark:text-gray-200">{bio}</p>
          )}
          {tab === 'status' && <StatusList postsCount={postsCount} projectsCount={projectsCount} />}
          {tab === 'quests' && (
            <QuestList
              raceCurrentWeek={raceCurrentWeek}
              raceTotalWeeks={raceTotalWeeks}
              raceProgressPct={raceProgressPct}
            />
          )}
        </div>
      </div>

      {/* ============ Desktop: avatar column (plain, no card chrome) + content column, everything shown at once ============ */}
      <div className="hidden sm:grid sm:grid-cols-[15rem_minmax(0,1fr)] sm:gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Avatar
            imageSizes="272px"
            levelBadgeClassName="bottom-2.5 left-2.5 px-[9px] pb-[3px] pt-px text-[13px]"
            className="aspect-square w-full rounded-[18px] border-[3px]"
          />
          <div>
            <p className="text-2xl font-extrabold leading-tight text-gray-900 dark:text-gray-100">
              {NAME}
            </p>
            <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary-500">
              <LaptopIcon className="h-3.5 w-3.5 shrink-0" />
              {heroContent.jobTitle}
            </p>
          </div>
          <hr className="-my-1.5 border-t border-dashed border-gray-200 dark:border-gray-700" />
          <div className="flex flex-col gap-1.5">
            {STATS.map(({ key, ...stat }, index) => (
              <StatBar
                key={key}
                {...stat}
                delayMs={STAT_BAR_BASE_DELAY_MS + index * STAT_BAR_STAGGER_MS}
              />
            ))}
          </div>
          <div className="mt-1 flex flex-wrap gap-[5px]">
            {TITLES.map((title) => (
              <TitleChip key={title.label} {...title} />
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Bubble heading={heading} highlight={highlight} tail="left" />

          <div>
            <SectionLabel>{heroContent.sectionLabels.bio}</SectionLabel>
            <p className="text-sm leading-7 text-gray-800 dark:text-gray-200">{bio}</p>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-5 dark:border-gray-700">
            <SectionLabel weight="normal">{heroContent.sectionLabels.stats}</SectionLabel>
            <StatusList postsCount={postsCount} projectsCount={projectsCount} />
          </div>

          <div className="border-t border-dashed border-gray-200 pt-5 dark:border-gray-700">
            <SectionLabel>{heroContent.sectionLabels.quest}</SectionLabel>
            <QuestList
              raceCurrentWeek={raceCurrentWeek}
              raceTotalWeeks={raceTotalWeeks}
              raceProgressPct={raceProgressPct}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({
  children,
  weight = 'bold',
}: {
  children: ReactNode
  weight?: 'bold' | 'normal'
}) {
  return (
    <p
      className={`mb-2.5 text-[11px] uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400 ${
        weight === 'bold' ? 'font-extrabold' : 'font-normal'
      }`}
    >
      {children}
    </p>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 pb-2.5 pt-2 text-xs font-extrabold uppercase tracking-wide transition-colors duration-150 ${
        active
          ? 'border-primary-500 text-primary-500 dark:text-primary-400'
          : 'border-transparent text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  )
}

// The speech bubble is a single shared piece of markup (used once per
// breakpoint via `hidden`/`sm:hidden`, same pattern the rest of this card
// uses). `tail="down"` matches the mobile bubble that sits above the avatar
// card; `tail="left"` points at the avatar column on desktop.
function Bubble({
  heading,
  highlight,
  tail,
}: {
  heading: string
  highlight?: string
  tail: 'down' | 'left'
}) {
  const paddingClassName = tail === 'left' ? 'px-5 py-4' : 'p-4'
  const positionClassName = tail === 'left' ? 'ml-3 self-start' : ''

  return (
    <div
      className={`relative max-w-2xl rounded-3xl border border-gray-400 bg-white dark:border-white dark:bg-gray-950 ${paddingClassName} ${positionClassName}`}
    >
      {tail === 'down' ? (
        <span
          aria-hidden="true"
          className="absolute -bottom-[23px] left-12 h-6 w-3 text-gray-400 dark:text-white"
        >
          <svg viewBox="0 0 12 24" className="h-full w-full overflow-visible">
            <rect width="12" height="2" className="fill-white dark:fill-gray-950" />
            <path
              d="M1 0L6 23L11 0"
              className="fill-white stroke-current dark:fill-gray-950"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="absolute -left-[23px] top-1/2 h-3 w-6 -translate-y-1/2 text-gray-400 dark:text-white"
        >
          <svg viewBox="0 0 24 12" className="h-full w-full overflow-visible">
            <rect x="22" width="2" height="12" className="fill-white dark:fill-gray-950" />
            <path
              d="M24 1L1 6L24 11"
              className="fill-white stroke-current dark:fill-gray-950"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </span>
      )}
      <IntroReveal heading={heading} highlight={highlight} paragraphs={[]} />
    </div>
  )
}

function Avatar({
  imageSizes,
  levelBadgeClassName,
  className,
}: {
  imageSizes: string
  /** Position (inset from the corner) + padding + text-size classes for the
   *  level badge at this call site (e.g. "bottom-1.5 left-1.5 px-[7px] pb-px
   *  text-[9px]"). Kept as one literal prop for the same reason as `className`
   *  below. */
  levelBadgeClassName: string
  /** Complete size + corner-radius + border-width classes for this call site
   *  (e.g. "h-32 w-32 rounded-[20px] border-2"). Kept as one literal prop,
   *  never split into a "base default + override" pair — two utility classes
   *  for the same property (e.g. rounded-[20px] here and rounded-[18px] from
   *  a caller) would both land in the compiled stylesheet, and which one wins
   *  depends on Tailwind's internal rule order, not on prop precedence. */
  className: string
}) {
  return (
    // The badge is inset (not flush against the corner) and uses a plain,
    // uniform border-radius of its own — deliberately NOT trying to match or
    // sit flush against this box's outer curve. A flush corner tag depends on
    // the badge's radius, the image's overflow-hidden clip, and this box's
    // own border/radius all agreeing exactly; a couple of past attempts at
    // that broke in different ways (a seam at the corner, or the badge's own
    // sharp edge poking past the curve). Sitting the badge fully inside the
    // image, clipped the same way as everything else in this box, sidesteps
    // that whole class of bug.
    <div
      className={`relative shrink-0 overflow-hidden border-primary-500 bg-gray-100 dark:bg-gray-800 ${className}`}
    >
      <Image
        src={AVATAR_SRC}
        alt={siteMetadata.author}
        width={600}
        height={600}
        priority
        unoptimized
        sizes={imageSizes}
        className="h-full w-full object-cover [image-rendering:pixelated]"
      />
      <div
        className={`absolute rounded-md bg-primary-500 font-extrabold text-[#1a0800] ${levelBadgeClassName}`}
      >
        {heroContent.avatarLevel}
      </div>
    </div>
  )
}

function StatBar({
  label,
  pct,
  display,
  barClassName,
  iconClassName,
  Icon,
  delayMs,
}: Omit<StatDef, 'key'> & { delayMs: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5 ${iconClassName}`} />
      <div className="relative h-[11px] flex-1 overflow-hidden rounded-md border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
        <div
          className={`stat-bar-fill h-full rounded-md ${barClassName}`}
          style={
            {
              '--stat-bar-target-width': `${pct}%`,
              animationDelay: `${delayMs}ms`,
            } as React.CSSProperties
          }
        />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.85] whitespace-nowrap text-[8px] font-extrabold uppercase tracking-wide text-white [text-shadow:0_1px_2px_rgb(0_0_0_/_0.55)] sm:text-[9.5px]">
          {label}
        </span>
      </div>
      <span className="shrink-0 font-mono text-[8px] text-gray-500 dark:text-gray-400 sm:text-[10px]">
        {display}
      </span>
    </div>
  )
}

// Small line icons — plain geometric strokes (no icon-library dependency),
// colored via `currentColor` so a className's text-* color applies directly.
function LaptopIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="4" width="16" height="10" rx="1" />
      <path d="M2 18h20" />
    </svg>
  )
}

// The stat-bar icons below sit next to an 11px-tall bar, colored to match
// that stat's own bar color via `iconClassName` in STAT_VISUALS.
function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

// Decorative only — hover feedback without being an actual link or button
// action (稱號標籤跟 QUEST 項目都只是展示用，點擊沒有作用).
function TitleChip({ label, hint, compact }: TitleDef & { compact?: boolean }) {
  return (
    <div
      title={hint}
      className={`cursor-default whitespace-nowrap rounded-md border border-primary-600/50 bg-transparent font-normal text-primary-600 transition-colors duration-150 hover:border-primary-600/80 hover:bg-primary-500/10 dark:border-primary-400/60 dark:text-primary-400 dark:hover:border-primary-400/90 ${
        compact ? 'px-2 py-[3px] text-[10px]' : 'px-2.5 py-[5px] text-xs'
      }`}
    >
      {label}
    </div>
  )
}

// Not really "skills" in the game sense anymore — this row now mixes site
// stats (posts/projects) with a real running level, so the section is
// labeled the more generic "Status" instead (see the STATUS tab / heading
// above and the section label on desktop).
interface StatusListProps {
  postsCount: number
  projectsCount: number
}

function StatusList({ postsCount, projectsCount }: StatusListProps) {
  // The count itself is the "value" (kept orange); the unit character
  // (篇/個) is just grammar, so it stays a neutral gray instead.
  const items: { name: string; value: string; unit?: string }[] = [
    {
      name: heroContent.statusItems.posts.name,
      value: String(postsCount),
      unit: heroContent.statusItems.posts.unit,
    },
    {
      name: heroContent.statusItems.projects.name,
      value: String(projectsCount),
      unit: heroContent.statusItems.projects.unit,
    },
    {
      name: heroContent.statusItems.runningLevel.name,
      value: heroContent.statusItems.runningLevel.value,
    },
  ]

  return (
    <div className="flex flex-col">
      {items.map((item) => (
        <div
          key={item.name}
          // No gap between rows (the row itself supplies spacing via py) — a
          // flex `gap` here would leave an unfilled seam between rows that
          // hover:bg can't reach, since the gap sits outside each row's own
          // box (looked like a layout bug rather than a hover effect).
          className="-mx-2 flex cursor-default items-center justify-between border-b border-dashed border-gray-200 px-2 py-2 transition-colors duration-150 last:border-b-0 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-white/10"
        >
          <span className="text-xs font-normal text-gray-800 dark:text-gray-200 sm:text-sm">
            {item.name}
          </span>
          <span className="font-mono text-xs font-normal sm:text-sm">
            <span className="text-primary-400">{item.value}</span>
            {item.unit && (
              <span className="ml-0.5 text-gray-500 dark:text-gray-400">{item.unit}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

interface QuestListProps {
  raceCurrentWeek: number
  raceTotalWeeks: number
  raceProgressPct: number
}

// Only one real quest exists right now — the marathon countdown. (Posts/
// projects counts live in the Status section instead; see StatusList.) The
// name is a fixed "N-week training block" label; only the current-week
// fraction and the bar move, both derived from today's date vs. race day.
function QuestList({ raceCurrentWeek, raceTotalWeeks, raceProgressPct }: QuestListProps) {
  return (
    // Hover lives on this outer card, not the row inside it — with only one
    // row today, hovering anywhere in the visible pill should fill exactly
    // that pill's own rounded-2xl shape, not a smaller inset "chip" sized to
    // the row's own text+padding (which read as not tracking the card's
    // outline at all).
    <div className="cursor-default rounded-2xl border border-gray-200 bg-gray-50 px-4 transition-colors duration-150 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-white/10">
      <QuestRow
        name={`${heroContent.quest.namePrefix}${raceTotalWeeks}${heroContent.quest.nameSuffix}`}
        progressPct={raceProgressPct}
        valueLabel={`${raceCurrentWeek}/${raceTotalWeeks}`}
        first
      />
    </div>
  )
}

function QuestRow({
  name,
  progressPct,
  valueLabel,
  countLabel,
  first,
}: {
  name: string
  progressPct?: number
  valueLabel?: string
  countLabel?: string
  first?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-2.5 py-2.5 ${
        first ? '' : 'border-t border-dashed border-gray-200 dark:border-gray-700'
      }`}
    >
      <span className="min-w-0 flex-1 truncate text-xs font-normal text-gray-900 dark:text-gray-100 sm:text-sm">
        {name}
      </span>
      {progressPct !== undefined ? (
        <>
          <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right font-mono text-xs font-normal text-gray-500 dark:text-gray-400 sm:text-sm">
            {valueLabel}
          </span>
        </>
      ) : (
        <span className="shrink-0 font-mono text-xs font-normal text-gray-500 dark:text-gray-400 sm:text-sm">
          {countLabel}
        </span>
      )}
    </div>
  )
}
