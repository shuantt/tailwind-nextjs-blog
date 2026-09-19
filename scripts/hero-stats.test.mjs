import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: ['lib/heroStats.ts'],
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
})
const { getHeroStats } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
)
const at = (date) => getHeroStats(new Date(date))

test('coffee refills at 09:00 Taipei, drains linearly, and stays empty overnight', () => {
  for (const [time, expected] of [
    ['00:00', 0],
    ['08:59', 0],
    ['09:00', 100],
    ['13:30', 50],
    ['17:59', 1],
    ['18:00', 0],
    ['23:59', 0],
  ]) {
    assert.deepEqual(at(`2026-09-19T${time}:00+08:00`).coffee, { value: expected, pct: expected })
  }
  assert.equal(at('2026-09-19T01:00:00Z').coffee.value, 100)
  assert.equal(at('2026-09-19T10:00:00Z').coffee.value, 0)
})

test('sleep has one stable daily draw, uses Taipei weekends, and bounds its bar', () => {
  let overchargedDays = 0
  const values = new Set()
  for (let day = 0; day < 366; day++) {
    const utc = new Date(Date.UTC(2026, 0, 1 + day, 4))
    const weekend = [0, 6].includes(utc.getUTCDay())
    const { sleep } = getHeroStats(utc)
    assert.ok(sleep.value >= (weekend ? 80 : 50) && sleep.value <= (weekend ? 140 : 75))
    assert.equal(sleep.pct, Math.min(100, sleep.value))
    assert.equal(sleep.overcharged, sleep.value > 100)
    assert.deepEqual(getHeroStats(new Date(utc.getTime() + 3600000)).sleep, sleep)
    values.add(sleep.value)
    if (sleep.overcharged) overchargedDays++
  }
  assert.ok(values.size > 20)
  assert.ok(overchargedDays > 0)
  // Friday UTC becomes Saturday in Taipei.
  assert.deepEqual(at('2026-09-18T16:00:00Z').sleep, at('2026-09-19T23:59:00+08:00').sleep)
})

test('work levels follow anniversaries and reset progress, including leap years', () => {
  assert.deepEqual(at('2022-12-05T00:00:00+08:00').work, {
    years: 0,
    completedYears: 0,
    level: 1,
    pct: 0,
  })
  assert.deepEqual(at('2022-12-04T00:00:00+08:00').work, {
    years: 0,
    completedYears: 0,
    level: 1,
    pct: 0,
  })
  assert.equal(at('2023-12-04T23:59:00+08:00').work.level, 1)
  assert.deepEqual(at('2023-12-05T00:00:00+08:00').work, {
    years: 1,
    completedYears: 1,
    level: 2,
    pct: 0,
  })
  assert.deepEqual(at('2024-12-05T00:00:00+08:00').work, {
    years: 2,
    completedYears: 2,
    level: 3,
    pct: 0,
  })
  const leapYearDay = at('2024-06-05T00:00:00+08:00').work
  assert.equal(leapYearDay.years, 1.5)
  assert.equal(leapYearDay.pct, 50)
  const today = at('2026-09-19T00:00:00+08:00').work
  assert.equal(today.completedYears, 3)
  assert.equal(today.level, 4)
  assert.equal(today.pct, 78.9)
  assert.equal(today.years.toFixed(1), '3.8')
  assert.deepEqual(at('2026-12-04T16:00:00Z').work, {
    years: 4,
    completedYears: 4,
    level: 5,
    pct: 0,
  })
})
