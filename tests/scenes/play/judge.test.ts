import { describe, expect, it } from 'vitest'
import { judge } from '../../../src/scenes/play/judge'

describe('judge', () => {
  it('ずれが 75ms 以内なら great', () => {
    expect(judge(1000, 1000)).toBe('great')
    expect(judge(1000, 1075)).toBe('great')
  })

  it('ずれが 75ms を超え 150ms 以内なら good', () => {
    expect(judge(1000, 1076)).toBe('good')
    expect(judge(1000, 1150)).toBe('good')
  })

  it('ずれが 150ms を超え 225ms 以内なら bad', () => {
    expect(judge(1000, 1151)).toBe('bad')
    expect(judge(1000, 1225)).toBe('bad')
  })

  it('ずれが 225ms を超えると undefined', () => {
    expect(judge(1000, 1226)).toBeUndefined()
    expect(judge(1000, 774)).toBeUndefined()
  })

  it('早押しと遅押しで判定が対称になる', () => {
    expect(judge(1000, 925)).toBe('great')
    expect(judge(1000, 850)).toBe('good')
    expect(judge(1000, 775)).toBe('bad')
  })
})
