import { describe, expect, it } from 'vitest'
import { notesBetween } from '../../../src/scenes/play/notesBetween'

describe('notesBetween', () => {
  const notes = [
    { hitTime: 1000, lane: 0 },
    { hitTime: 2000, lane: 1 },
    { hitTime: 3000, lane: 2 },
    { hitTime: 4000, lane: 3 },
  ]

  it('範囲内のノーツを譜面の順のまま返す', () => {
    expect(notesBetween(notes, 1500, 3500)).toEqual([notes[1], notes[2]])
  })

  it('範囲の境界を含む', () => {
    expect(notesBetween(notes, 2000, 3000)).toEqual([notes[1], notes[2]])
  })

  it('範囲外のノーツを含まない', () => {
    expect(notesBetween(notes, 2001, 2999)).toEqual([])
  })

  it('hitTime の昇順でない譜面でも範囲内のノーツをすべて返す', () => {
    const unsorted = [notes[3], notes[0], notes[2], notes[1]]
    expect(notesBetween(unsorted, 1500, 3500)).toEqual([notes[2], notes[1]])
  })

  it('範囲内にノーツがなければ空になる', () => {
    expect(notesBetween(notes, 5000, 6000)).toEqual([])
    expect(notesBetween([], 0, 1000)).toEqual([])
  })
})
