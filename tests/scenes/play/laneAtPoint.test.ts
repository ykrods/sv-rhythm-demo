import { describe, expect, it } from 'vitest'
import { laneAtPoint } from '../../../src/scenes/play/laneAtPoint'

describe('laneAtPoint', () => {
  it('押下範囲を横に 5 等分したレーンを返す', () => {
    expect(laneAtPoint(36, 600)).toBe(0)
    expect(laneAtPoint(108, 600)).toBe(1)
    expect(laneAtPoint(180, 600)).toBe(2)
    expect(laneAtPoint(252, 600)).toBe(3)
    expect(laneAtPoint(324, 600)).toBe(4)
  })

  it('レーンの境界の x は右のレーンに含める', () => {
    expect(laneAtPoint(71.9, 600)).toBe(0)
    expect(laneAtPoint(72, 600)).toBe(1)
  })

  it('左右端を含む', () => {
    expect(laneAtPoint(0, 600)).toBe(0)
    expect(laneAtPoint(360, 600)).toBe(4)
  })

  it('判定バー上と Scene の下端を含む', () => {
    expect(laneAtPoint(180, 512)).toBe(2)
    expect(laneAtPoint(180, 640)).toBe(2)
  })

  it('判定バーより上や Scene の外は undefined', () => {
    expect(laneAtPoint(180, 511.9)).toBeUndefined()
    expect(laneAtPoint(180, 640.1)).toBeUndefined()
    expect(laneAtPoint(-0.1, 600)).toBeUndefined()
    expect(laneAtPoint(360.1, 600)).toBeUndefined()
  })
})
