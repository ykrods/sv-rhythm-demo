import { describe, expect, it } from 'vitest'
import { depthAtTime } from '../../../src/scenes/play/depthAtTime'
import { TRAVEL_TIME } from '../../../src/scenes/play/travel'

describe('depthAtTime', () => {
  it('判定バーに達する時刻（time = audioTime）で 0 になる', () => {
    expect(depthAtTime(2000, 2000)).toBeCloseTo(0)
  })

  it('TRAVEL_TIME 前にレーン上端（奥行き 1）にある', () => {
    expect(depthAtTime(2000, 2000 - TRAVEL_TIME)).toBeCloseTo(1)
  })

  it('時刻に対して線形に変化する', () => {
    expect(depthAtTime(2000, 2000 - TRAVEL_TIME / 2)).toBeCloseTo(0.5)
  })

  it('判定バーを過ぎると負になる', () => {
    expect(depthAtTime(2000, 2000 + TRAVEL_TIME / 10)).toBeCloseTo(-0.1)
  })
})
