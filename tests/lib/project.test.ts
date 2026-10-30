import { describe, expect, it } from 'vitest'
import { project } from '../../src/lib/project'

describe('project', () => {
  it('判定バーの位置（d = 0）では変換されない', () => {
    const p = project(-144, 0)
    expect(p.x).toBe(-144)
    // 計算上 -0 になるため toBeCloseTo で比較する
    expect(p.y).toBeCloseTo(0)
    expect(p.scale).toBe(1)
  })

  it('レーン上端（d = 1）では Scene 上の y = 128、縮小率 0.25 になる', () => {
    const left = project(-180, 1)
    const right = project(180, 1)
    expect(left.y).toBeCloseTo(-384)
    expect(left.scale).toBeCloseTo(0.25)
    expect(left.x).toBeCloseTo(-45)
    expect(right.x).toBeCloseTo(45)
  })

  it('奥行きが大きいほど消失点（y = -512）に近づく', () => {
    const ys = [1, 10, 100, 1000].map((d) => project(0, d).y)
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeLessThan(ys[i - 1])
      expect(ys[i]).toBeGreaterThan(-512)
    }
    expect(ys[ys.length - 1]).toBeCloseTo(-512, 0)
  })
})
