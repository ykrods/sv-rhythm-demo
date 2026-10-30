import { describe, expect, it } from 'vitest'
import { depthAtY } from '../../src/lib/depthAtY'
import { project } from '../../src/lib/project'

describe('depthAtY', () => {
  it('判定バー（y = 0）で 0、レーン上端（y = -384）で 1 になる', () => {
    expect(depthAtY(0)).toBeCloseTo(0)
    expect(depthAtY(-384)).toBeCloseTo(1)
  })

  it('Scene の下端（y = 128）で -1/15 になる', () => {
    expect(depthAtY(128)).toBeCloseTo(-1 / 15)
  })

  it('project と組み合わせて元の奥行きに戻る', () => {
    for (const d of [-1 / 15, 0, 0.5, 1, 3]) {
      expect(depthAtY(project(0, d).y)).toBeCloseTo(d)
    }
  })
})
