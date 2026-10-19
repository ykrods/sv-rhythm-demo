import { describe, expect, it } from 'vitest'
import { SCENE_HEIGHT, SCENE_WIDTH } from '../../src/lib/scene'

describe('scene', () => {
  it('論理座標の縦横比が 9:16 である', () => {
    expect(SCENE_WIDTH * 16).toBe(SCENE_HEIGHT * 9)
  })
})
