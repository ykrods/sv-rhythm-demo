import { describe, expect, it } from 'vitest'
import { barTimesBetween } from '../../../src/scenes/play/barTimesBetween'

describe('barTimesBetween', () => {
  it('範囲内の小節の頭の時刻を昇順で返す', () => {
    expect(barTimesBetween(1000, 7000, 2000)).toEqual([2000, 4000, 6000])
  })

  it('範囲の境界を含む', () => {
    expect(barTimesBetween(2000, 6000, 2000)).toEqual([2000, 4000, 6000])
  })

  it('0ms より前の小節は含めない', () => {
    expect(barTimesBetween(-5000, 2000, 2000)).toEqual([0, 2000])
  })

  it('範囲内に小節の頭がなければ空になる', () => {
    expect(barTimesBetween(2100, 3900, 2000)).toEqual([])
    expect(barTimesBetween(-3000, -100, 2000)).toEqual([])
  })

  it('小節の番号 × 1 小節の時間で求める', () => {
    expect(barTimesBetween(0, 1000, 1000 / 3)).toEqual([0, 1000 / 3, 2000 / 3, 1000])
  })
})
