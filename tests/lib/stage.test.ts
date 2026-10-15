import { describe, expect, it } from 'vitest'
import { STAGE_HEIGHT, STAGE_WIDTH } from '../../src/lib/stage'

describe('stage', () => {
  it('論理座標の縦横比が 9:16 である', () => {
    expect(STAGE_WIDTH * 16).toBe(STAGE_HEIGHT * 9)
  })
})
