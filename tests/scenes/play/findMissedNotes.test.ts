import { describe, expect, it } from 'vitest'
import { findMissedNotes } from '../../../src/scenes/play/findMissedNotes'
import type { Judgement, Note } from '../../../src/types'

describe('findMissedNotes', () => {
  const none = new Map<Note, Judgement>()
  const notes = [
    { hitTime: 1000, lane: 0 },
    { hitTime: 2000, lane: 1 },
    { hitTime: 500, lane: 2 },
  ]

  it('判定の範囲を過ぎたノーツを譜面の順のまま返す', () => {
    expect(findMissedNotes(notes, none, 1300)).toEqual([notes[0], notes[2]])
  })

  it('判定の範囲の境界ちょうど（225ms）は含めない', () => {
    expect(findMissedNotes(notes, none, 1225)).toEqual([notes[2]])
    expect(findMissedNotes(notes, none, 1226)).toEqual([notes[0], notes[2]])
  })

  it('判定済みのノーツは含めない', () => {
    const judged = new Map<Note, Judgement>([[notes[0], 'good']])
    expect(findMissedNotes(notes, judged, 1300)).toEqual([notes[2]])
  })

  it('範囲を過ぎたノーツがなければ空になる', () => {
    expect(findMissedNotes(notes, none, 700)).toEqual([])
  })
})
