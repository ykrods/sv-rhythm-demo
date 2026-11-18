import { describe, expect, it } from 'vitest'
import { barDuration } from '../../src/lib/barDuration'

describe('barDuration', () => {
  it('120 BPM・4 拍子で 2000ms になる', () => {
    expect(barDuration(120, 4)).toBeCloseTo(2000)
  })

  it('拍数に比例する', () => {
    expect(barDuration(120, 3)).toBeCloseTo(1500)
  })

  it('BPM に反比例する', () => {
    expect(barDuration(60, 4)).toBeCloseTo(4000)
    expect(barDuration(180, 4)).toBeCloseTo(4000 / 3)
  })
})
