import { describe, expect, it } from 'vitest'
import { findTargetNote } from '../../../src/scenes/play/findTargetNote'
import type { Judgement, Note } from '../../../src/types'

describe('findTargetNote', () => {
  const none = new Map<Note, Judgement>()

  it('押下したレーンの、判定の範囲内のノーツを返す', () => {
    const notes = [
      { hitTime: 1000, lane: 0 },
      { hitTime: 1000, lane: 1 },
    ]
    expect(findTargetNote(notes, none, 1, 1100)).toBe(notes[1])
  })

  it('他のレーンのノーツは選ばない', () => {
    const notes = [{ hitTime: 1000, lane: 0 }]
    expect(findTargetNote(notes, none, 1, 1000)).toBeUndefined()
  })

  it('判定済みのノーツは選ばない', () => {
    const notes = [{ hitTime: 1000, lane: 0 }]
    const judged = new Map<Note, Judgement>([[notes[0], 'great']])
    expect(findTargetNote(notes, judged, 0, 1000)).toBeUndefined()
  })

  it('判定の範囲の境界（225ms）を含み、超えると選ばない', () => {
    const notes = [{ hitTime: 1000, lane: 0 }]
    expect(findTargetNote(notes, none, 0, 775)).toBe(notes[0])
    expect(findTargetNote(notes, none, 0, 1225)).toBe(notes[0])
    expect(findTargetNote(notes, none, 0, 774)).toBeUndefined()
    expect(findTargetNote(notes, none, 0, 1226)).toBeUndefined()
  })

  it('範囲内に複数あれば hitTime が最も早いノーツを選ぶ', () => {
    const notes = [
      { hitTime: 1000, lane: 0 },
      { hitTime: 1200, lane: 0 },
    ]
    // 1200 の方がずれは小さいが、早い 1000 を選ぶ
    expect(findTargetNote(notes, none, 0, 1140)).toBe(notes[0])
  })

  it('hitTime の昇順でない譜面でも最も早いノーツを選ぶ', () => {
    const notes = [
      { hitTime: 1200, lane: 0 },
      { hitTime: 1000, lane: 0 },
    ]
    expect(findTargetNote(notes, none, 0, 1100)).toBe(notes[1])
  })
})
