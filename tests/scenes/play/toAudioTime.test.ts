import { describe, expect, it } from 'vitest'
import { toAudioTime } from '../../../src/scenes/play/toAudioTime'

describe('toAudioTime', () => {
  it('予約時（contextTime = 0）は -leadIn になる', () => {
    expect(toAudioTime(0, 2000)).toBe(-2000)
  })

  it('leadIn の間は負の値になる', () => {
    expect(toAudioTime(1.5, 2000)).toBeCloseTo(-500)
  })

  it('音声の開始時刻（leadIn / 1000 秒）で 0 になる', () => {
    expect(toAudioTime(2, 2000)).toBeCloseTo(0)
  })

  it('秒を ms に変換して増える', () => {
    expect(toAudioTime(12.345, 2000)).toBeCloseTo(10345)
  })
})
